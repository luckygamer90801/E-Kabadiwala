import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import { LotRecord } from '../types/index.ts';
import {
  Terminal,
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Play,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
} from 'lucide-react';

interface SyncDebugPageProps {
  onBack: () => void;
}

export const SyncDebugPage: React.FC<SyncDebugPageProps> = ({ onBack }) => {
  const { syncState, pendingLotsCount, syncNow, toggleSimulatedOffline } = useApp();
  const [localLots, setLocalLots] = useState<LotRecord[]>([]);
  const [imageCount, setImageCount] = useState<number>(0);
  const [backendPing, setBackendPing] = useState<{ status: string; latencyMs: number } | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const all = await db.lots.toArray();
      setLocalLots(all);
      const imgC = await db.imageBlobs.count();
      setImageCount(imgC);
    } catch {}
  };

  useEffect(() => {
    loadData();
    pingBackend();
  }, [syncState]);

  const pingBackend = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setBackendPing({ status: 'HEALTHY (200 OK)', latencyMs: latency });
      } else {
        setBackendPing({ status: `ERROR (${res.status})`, latencyMs: latency });
      }
    } catch (e: any) {
      setBackendPing({ status: `UNREACHABLE (${e.message})`, latencyMs: 0 });
    } finally {
      setIsPinging(false);
    }
  };

  // 1-Click Fast Offline Demo Test Lot Generator
  const handleInsertDemoOfflineLot = async () => {
    const chars = '0123456789ABCDEF';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

    const testLot: LotRecord = {
      clientId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      humanReadableId: `KC-2026-${code}`,
      collectorId: 'KC-COL-101',
      collectorName: 'Ramesh Kumar',
      createdAtDevice: new Date().toISOString(),
      latitude: 19.1136,
      longitude: 72.8697,
      locationAccuracy: 12,
      locationName: 'Andheri Industrial Hub (Demo GPS)',
      estimatedValue: 720,
      totalWeightKg: 2.0,
      totalItemsCount: 1,
      status: 'LOT_CREATED',
      syncStatus: 'PENDING',
      retryCount: 0,
      qrReference: `KC-LOT-KC-2026-${code}-DEMO`,
      items: [
        {
          materialCode: 'laptop_pcb',
          materialNameEn: 'Laptop PCB / Motherboard',
          quantity: 1,
          weight: 2.0,
          unit: 'kg',
          estimatedRate: 360,
          estimatedValue: 720,
          classificationSource: 'MOCK_AI',
          classificationConfidence: 91,
        },
      ],
      images: [],
      notes: 'Demo offline collection created during SIH test',
    };

    await db.lots.put(testLot);
    await loadData();
    alert(`Demo lot ${testLot.humanReadableId} saved into offline IndexedDB queue!`);
  };

  const handleClearDatabase = async () => {
    if (confirm('Are you sure you want to clear local IndexedDB lots and images?')) {
      await db.lots.clear();
      await db.imageBlobs.clear();
      await loadData();
    }
  };

  return (
    <div className="space-y-4 pb-24 font-mono text-xs animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between font-sans">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
            Sync Debug Inspector
          </h2>
          <span className="text-[10px] text-gray-500 font-mono">SIH26229 EVALUATOR TOOLS</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Network & Backend Status Card */}
      <div className="bg-gray-900 text-emerald-400 p-4 rounded-2xl shadow-md space-y-3 border border-gray-800">
        <div className="flex items-center justify-between pb-2 border-b border-gray-800 font-sans">
          <span className="font-bold text-white flex items-center">
            <Activity className="w-4 h-4 mr-1.5 text-emerald-400" />
            Connectivity Diagnostics
          </span>
          <button
            onClick={pingBackend}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-emerald-300 text-[10px]"
          >
            <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-gray-400 block">Browser Navigator:</span>
            <span className={syncState.isOnline ? 'text-emerald-400' : 'text-red-400'}>
              {syncState.isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Airplane Demo Mode:</span>
            <span className={syncState.isSimulatedOffline ? 'text-amber-400 font-bold' : 'text-gray-300'}>
              {syncState.isSimulatedOffline ? 'ENABLED (OFFLINE)' : 'DISABLED'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Backend Reachable:</span>
            <span className={syncState.isBackendReachable ? 'text-emerald-400' : 'text-red-400'}>
              {syncState.isBackendReachable ? 'YES (200 OK)' : 'NO / BLOCKED'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Server Ping Latency:</span>
            <span className="text-gray-300">
              {backendPing?.latencyMs ? `${backendPing.latencyMs} ms` : 'N/A'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px]">
          <span className="text-gray-400">Sync Engine Status:</span>
          <span className={syncState.isSyncing ? 'text-blue-400 animate-pulse' : 'text-emerald-400'}>
            {syncState.isSyncing ? 'SYNCING IN PROGRESS...' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Action Controls for Evaluator */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2 font-sans">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
          One-Click SIH Testing Controls
        </span>

        <button
          onClick={toggleSimulatedOffline}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all ${
            syncState.isSimulatedOffline
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {syncState.isSimulatedOffline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Turn Airplane Mode OFF (Restore Sync)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Turn Airplane Mode ON (Cut Network)</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleInsertDemoOfflineLot}
            className="py-2.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-1"
          >
            <Play className="w-3.5 h-3.5 text-brand-700" />
            <span>+ 1 Offline Lot</span>
          </button>

          <button
            onClick={() => syncNow()}
            disabled={syncState.isSyncing}
            className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>Force Sync Now</span>
          </button>
        </div>

        <button
          onClick={handleClearDatabase}
          className="w-full py-2 text-red-600 hover:text-red-700 text-[11px] font-bold text-center block"
        >
          Reset / Clear Local Storage
        </button>
      </div>

      {/* IndexedDB Lots Queue Inspector */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
            <Database className="w-4 h-4 mr-1 text-brand-600" />
            IndexedDB Lots Table ({localLots.length})
          </h4>
          <span className="text-[10px] text-gray-400">
            {imageCount} Blobs in memory
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {localLots.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Local database is empty.
            </p>
          ) : (
            localLots.map((l) => (
              <div
                key={l.clientId}
                className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] font-mono space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{l.humanReadableId}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      l.syncStatus === 'SYNCED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {l.syncStatus}
                  </span>
                </div>
                <div className="text-gray-500 text-[10px]">
                  UUID: {l.clientId.slice(0, 16)}... | Value: ₹{l.estimatedValue} | Weight: {l.totalWeightKg}kg
                </div>
                {l.syncError && (
                  <div className="text-red-600 text-[10px]">Error: {l.syncError}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
