import { db } from '../db/index.ts';
import { LotRecord, SyncStatus } from '../types/index.ts';
import { uploadImageToServer } from './imageService.ts';

export interface SyncEngineState {
  isOnline: boolean;
  isBackendReachable: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

type Listener = (state: SyncEngineState) => void;

class SyncEngine {
  private listeners: Set<Listener> = new Set();
  private isSimulatedOffline: boolean = false;
  private isSyncing: boolean = false;
  private isOnline: boolean = navigator.onLine;
  private isBackendReachable: boolean = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private healthCheckInterval: any = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Load simulated offline preference if stored
    try {
      const simSetting = await db.settings.get('simulatedOffline');
      if (simSetting) {
        this.isSimulatedOffline = !!simSetting.value;
      }
    } catch {}

    // Window online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify();
      this.checkBackendAndSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.isBackendReachable = false;
      this.notify();
    });

    // Check health initially and periodically
    this.checkBackendAndSync();
    this.healthCheckInterval = setInterval(() => {
      this.checkBackendAndSync();
    }, 10000);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): SyncEngineState {
    return {
      isOnline: this.isSimulatedOffline ? false : this.isOnline,
      isBackendReachable: this.isSimulatedOffline ? false : this.isBackendReachable,
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount: 0, // dynamic
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  /**
   * Toggles simulated airplane mode for presentation / testing
   */
  public async setSimulatedOffline(value: boolean): Promise<void> {
    this.isSimulatedOffline = value;
    await db.settings.put({ key: 'simulatedOffline', value });
    this.notify();
    if (!value) {
      this.checkBackendAndSync();
    }
  }

  /**
   * Pings backend /api/health to confirm real network reachability
   */
  public async checkBackendReachability(): Promise<boolean> {
    if (this.isSimulatedOffline || !this.isOnline) {
      this.isBackendReachable = false;
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      this.isBackendReachable = res.ok;
      return res.ok;
    } catch {
      this.isBackendReachable = false;
      return false;
    }
  }

  /**
   * Check reachability and start syncing pending queue
   */
  public async checkBackendAndSync(): Promise<void> {
    const reachable = await this.checkBackendReachability();
    this.notify();
    if (reachable) {
      await this.syncPendingLots();
    }
  }

  /**
   * Core Sync Procedure
   */
  public async syncPendingLots(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (this.isSimulatedOffline || !this.isOnline) return { synced: 0, failed: 0 };

    const reachable = await this.checkBackendReachability();
    if (!reachable) {
      this.notify();
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let synced = 0;
    let failed = 0;

    try {
      // Find all lots that are PENDING or FAILED
      const pendingLots = await db.lots
        .where('syncStatus')
        .equals('PENDING')
        .or('syncStatus')
        .equals('FAILED')
        .toArray();

      for (const lot of pendingLots) {
        try {
          // Mark SYNCING
          await db.lots.update(lot.clientId, { syncStatus: 'SYNCING' as SyncStatus });
          this.notify();

          // 1. Upload Lot Metadata (Idempotent POST)
          const lotResponse = await fetch('/api/lots', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': lot.clientId,
            },
            body: JSON.stringify({
              clientId: lot.clientId,
              humanReadableId: lot.humanReadableId,
              collectorId: lot.collectorId,
              collectorName: lot.collectorName,
              createdAtDevice: lot.createdAtDevice,
              latitude: lot.latitude,
              longitude: lot.longitude,
              locationAccuracy: lot.locationAccuracy,
              locationName: lot.locationName,
              items: lot.items,
              estimatedValue: lot.estimatedValue,
              totalWeightKg: lot.totalWeightKg,
              notes: lot.notes,
            }),
          });

          if (!lotResponse.ok) {
            throw new Error(`Server returned HTTP ${lotResponse.status}`);
          }

          const lotResult = await lotResponse.json();
          const serverLot = lotResult.lot;

          // 2. Upload any offline-stored photos
          const imageBlobs = await db.imageBlobs
            .where('lotClientId')
            .equals(lot.clientId)
            .toArray();

          const syncedImages = [...lot.images];

          for (const imgBlob of imageBlobs) {
            if (imgBlob.syncStatus !== 'SYNCED') {
              try {
                const imgUploadRes = await uploadImageToServer(lot.humanReadableId, imgBlob);
                if (imgUploadRes.success) {
                  await db.imageBlobs.update(imgBlob.localBlobKey, { syncStatus: 'SYNCED' });
                  // Update image record in lot
                  const foundImg = syncedImages.find((i) => i.localBlobKey === imgBlob.localBlobKey);
                  if (foundImg) {
                    foundImg.syncStatus = 'SYNCED';
                    foundImg.storageUrl = imgUploadRes.image.storageUrl;
                  }
                }
              } catch (imgErr) {
                console.warn(`Image sync failed for ${imgBlob.localBlobKey}:`, imgErr);
              }
            }
          }

          // 3. If lot was cancelled locally, sync cancellation
          if (lot.status === 'CANCELLED') {
            try {
              await fetch(`/api/lots/${lot.clientId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: lot.cancellationReason || 'Cancelled offline' }),
              });
            } catch {}
          }

          // 4. Mark lot as SYNCED in local database
          await db.lots.update(lot.clientId, {
            syncStatus: 'SYNCED' as SyncStatus,
            serverId: serverLot?._id || lot.serverId,
            status: lot.status === 'CANCELLED' ? 'CANCELLED' : 'SYNCED',
            images: syncedImages,
            lastSyncAttempt: new Date().toISOString(),
            syncError: undefined,
          });

          synced++;
        } catch (lotErr: any) {
          failed++;
          await db.lots.update(lot.clientId, {
            syncStatus: 'FAILED' as SyncStatus,
            retryCount: (lot.retryCount || 0) + 1,
            lastSyncAttempt: new Date().toISOString(),
            syncError: lotErr.message,
          });
          this.lastError = lotErr.message;
        }
      }

      this.lastSyncTime = new Date().toLocaleTimeString();
    } catch (generalErr: any) {
      this.lastError = generalErr.message;
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { synced, failed };
  }

  /**
   * Helper to count pending lots in local database
   */
  public async getPendingCount(): Promise<number> {
    try {
      return await db.lots
        .where('syncStatus')
        .equals('PENDING')
        .or('syncStatus')
        .equals('FAILED')
        .count();
    } catch {
      return 0;
    }
  }

  /**
   * Manual trigger button
   */
  public async syncNow(): Promise<{ synced: number; failed: number }> {
    return await this.syncPendingLots();
  }
}

export const syncEngine = new SyncEngine();
