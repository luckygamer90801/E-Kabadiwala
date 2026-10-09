import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import { LotRecord, SyncStatus } from '../types/index.ts';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Scale,
  IndianRupee,
  ChevronRight,
  WifiOff,
} from 'lucide-react';

interface CollectionsPageProps {
  onSelectLot: (lotId: string) => void;
  onAddNew: () => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ onSelectLot, onAddNew }) => {
  const { t, syncState, pendingLotsCount, syncNow } = useApp();
  const [lots, setLots] = useState<LotRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLots = async () => {
    try {
      const records = await db.lots.toArray();
      records.sort(
        (a, b) => new Date(b.createdAtDevice).getTime() - new Date(a.createdAtDevice).getTime()
      );
      setLots(records);
    } catch (e) {
      console.warn('Failed to fetch collections from Dexie:', e);
    }
  };

  useEffect(() => {
    loadLots();
  }, [pendingLotsCount]);

  const filteredLots = lots.filter((lot) => {
    if (filter === 'ACTIVE' && lot.status === 'CANCELLED') return false;
    if (filter === 'CANCELLED' && lot.status !== 'CANCELLED') return false;
    if (filter === 'PENDING' && lot.syncStatus === 'SYNCED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = lot.humanReadableId.toLowerCase().includes(q);
      const matchMat = lot.items?.some((i) => i.materialNameEn.toLowerCase().includes(q));
      return matchId || matchMat;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">
            {t('home.myCollections')}
          </h2>
          <p className="text-xs text-gray-500">
            {lots.length} total recorded lot(s)
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="px-3 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
        >
          + {t('nav.add')}
        </button>
      </div>

      {/* OFFLINE QUEUE VISUAL CARD */}
      {pendingLotsCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center font-black">
              ⏳
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                {t('status.pendingCount', { count: pendingLotsCount })}
              </span>
              <span className="text-[11px] text-amber-700">
                Saved safely on this phone.
              </span>
            </div>
          </div>

          <button
            onClick={() => syncNow()}
            disabled={syncState.isSyncing}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>{t('status.syncNow')}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Lot ID or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        <div className="flex space-x-1.5 bg-gray-200/70 p-1 rounded-xl text-[11px]">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              filter === 'ALL'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({lots.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              filter === 'ACTIVE'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({lots.filter((l) => l.status !== 'CANCELLED').length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              filter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({lots.filter((l) => l.syncStatus !== 'SYNCED').length})
          </button>
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              filter === 'CANCELLED'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cancelled ({lots.filter((l) => l.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Collection Cards List */}
      <div className="space-y-2.5">
        {filteredLots.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300 text-gray-500 text-xs">
            <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold">{t('home.noCollections')}</p>
          </div>
        ) : (
          filteredLots.map((lot) => {
            const isSynced = lot.syncStatus === 'SYNCED';
            const isCancelled = lot.status === 'CANCELLED';
            const firstMat = lot.items?.[0];

            return (
              <div
                key={lot.clientId}
                onClick={() => onSelectLot(lot.clientId)}
                className={`bg-white rounded-2xl p-4 border shadow-sm active:scale-[0.99] transition-all cursor-pointer space-y-3 ${
                  isCancelled
                    ? 'border-red-200 bg-red-50/20 opacity-80'
                    : 'border-gray-200/90 hover:border-brand-500'
                }`}
              >
                {/* Header row: Lot ID & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 tracking-wide">
                    {lot.humanReadableId}
                  </span>

                  {isCancelled ? (
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                      🚫 Cancelled
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSynced
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      }`}
                    >
                      {isSynced ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                          {t('tag.synced')}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-2.5 h-2.5 mr-1 text-amber-600" />
                          {t('tag.pending')}
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Items & Materials snippet */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      {lot.items?.map((i) => i.materialNameEn).join(' + ') || 'E-Waste Items'}
                    </h4>
                    <span className="text-[11px] text-gray-500 flex items-center mt-0.5">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      {new Date(lot.createdAtDevice).toLocaleDateString()} •{' '}
                      {new Date(lot.createdAtDevice).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Estimated value & Weight */}
                  <div className="text-right">
                    <span className="font-black text-base text-brand-900 block">
                      ₹{lot.estimatedValue}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {lot.totalWeightKg} kg
                    </span>
                  </div>
                </div>

                {/* If cancelled, show reason note */}
                {isCancelled && lot.cancellationReason && (
                  <div className="bg-red-50 p-2 rounded-xl text-[10px] text-red-800 border border-red-200">
                    <strong>Problem:</strong> {lot.cancellationReason}
                  </div>
                )}

                {/* Footer metadata */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span>
                    📷 {lot.images?.length || 0} photo(s) • 📍 {lot.locationAccuracy ? `GPS (±${lot.locationAccuracy}m)` : 'Approx location'}
                  </span>
                  <span className="text-brand-700 font-bold flex items-center">
                    {t('lot.timeline')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
