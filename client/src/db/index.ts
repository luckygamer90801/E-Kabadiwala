import Dexie, { type Table } from 'dexie';
import {
  LotRecord,
  MaterialRecord,
  PriceRecord,
  RecyclerRecord,
  SafetyAlertRecord,
  CollectorProfile,
  BuyerProfile,
  ReportRecord,
} from '../types/index.ts';

export interface StoredImageBlob {
  localBlobKey: string;
  lotClientId: string;
  mimeType: string;
  blob: Blob;
  sizeBytes: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: any;
}

export class KabadiwalaDatabase extends Dexie {
  lots!: Table<LotRecord, string>;
  imageBlobs!: Table<StoredImageBlob, string>;
  materialsCache!: Table<MaterialRecord, string>;
  pricesCache!: Table<PriceRecord, string>;
  recyclersCache!: Table<RecyclerRecord, string>;
  safetyCache!: Table<SafetyAlertRecord, string>;
  profile!: Table<CollectorProfile, string>;
  buyerProfile!: Table<BuyerProfile, string>;
  reportsCache!: Table<ReportRecord, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('KabadiwalaConnectDB');
    this.version(2).stores({
      lots: 'clientId, humanReadableId, syncStatus, status, createdAtDevice',
      imageBlobs: 'localBlobKey, lotClientId, syncStatus',
      materialsCache: 'code, category',
      pricesCache: 'materialCode',
      recyclersCache: 'id',
      safetyCache: 'alertId',
      profile: 'collectorId',
      buyerProfile: 'buyerId',
      reportsCache: 'reportId, targetId, reporterId',
      settings: 'key',
    });
  }
}

export const db = new KabadiwalaDatabase();
