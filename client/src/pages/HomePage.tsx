import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import { LotRecord } from '../types/index.ts';
import {
  PlusCircle,
  Layers,
  TrendingUp,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scale,
  IndianRupee,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, lotId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t, collector, syncState, pendingLotsCount, toggleSimulatedOffline } = useApp();
  const [recentLots, setRecentLots] = useState<LotRecord[]>([]);
  const [localStats, setLocalStats] = useState({
    totalLots: 0,
    totalWeight: 0,
    totalValue: 0,
  });

  const loadData = async () => {
    try {
      const allLots = await db.lots.toArray();
      allLots.sort(
        (a, b) => new Date(b.createdAtDevice).getTime() - new Date(a.createdAtDevice).getTime()
      );
      setRecentLots(allLots.slice(0, 3));

      // Calculate aggregated stats
      let weight = 0;
      let val = 0;
      allLots.forEach((l) => {
        weight += l.totalWeightKg || 0;
        val += l.estimatedValue || 0;
      });

      setLocalStats({
        totalLots: allLots.length || collector.stats?.totalLots || 0,
        totalWeight: Number((weight || collector.stats?.totalWeightKg || 0).toFixed(1)),
        totalValue: Math.round(val || collector.stats?.totalEstimatedValue || 0),
      });
    } catch (e) {
      console.warn('Failed to load home lots:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [pendingLotsCount]);

  return (
    <div className="space-y-4 md:space-y-6 pb-20">
      {/* Hero Card / Profile Banner */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-950 text-white rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-lg relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex justify-between items-start md:block">
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-1.5">
                ID: {collector.collectorId || 'KC-COL-101'}
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {collector.name || 'Ramesh Kumar'}
              </h2>
              <p className="text-xs md:text-sm text-emerald-200/80 mt-0.5">
                {t('app.subtitle')}
              </p>
            </div>

            <button
              onClick={() => onNavigate('profile')}
              className="md:hidden w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-lg shadow-inner flex-shrink-0 ml-3"
            >
              👨‍🔧
            </button>
          </div>

          {/* Live Aggregated Statistics */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 md:min-w-[420px] pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-emerald-700/50 md:pl-5 text-center">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-emerald-300 uppercase block font-semibold">
                {t('home.statLots')}
              </span>
              <span className="text-lg md:text-xl font-black text-white">
                {localStats.totalLots}
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-emerald-300 uppercase block font-semibold flex items-center justify-center">
                <Scale className="w-2.5 h-2.5 mr-0.5" />
                {t('home.statWeight')}
              </span>
              <span className="text-lg md:text-xl font-black text-white">
                {localStats.totalWeight} <span className="text-xs font-normal text-emerald-300">kg</span>
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] text-emerald-300 uppercase block font-semibold flex items-center justify-center">
                <IndianRupee className="w-2.5 h-2.5 mr-0.5" />
                {t('home.statValue')}
              </span>
              <span className="text-lg md:text-xl font-black text-amber-300">
                ₹{localStats.totalValue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY HIGH-CONTRAST ACTION: ADD COLLECTION */}
      <button
        onClick={() => onNavigate('add')}
        className="w-full bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white font-extrabold p-4 md:p-5 rounded-2xl shadow-lg shadow-brand-700/30 flex items-center justify-between active:scale-[0.98] transition-transform border-2 border-brand-500/40 group"
      >
        <div className="flex items-center space-x-3 text-left">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl shadow-inner group-hover:scale-105 transition-transform">
            📷
          </div>
          <div>
            <span className="text-lg md:text-xl block tracking-wide leading-tight">
              {t('home.addCollection')}
            </span>
            <span className="text-xs md:text-sm font-medium text-emerald-100">
              {t('home.addCollectionSub')}
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white text-brand-700 flex items-center justify-center shadow-md">
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
        </div>
      </button>

      {/* Grid of Main 4 Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* My Collections */}
        <button
          onClick={() => onNavigate('collections')}
          className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md text-left flex flex-col justify-between active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📦</span>
            {pendingLotsCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                {pendingLotsCount} {t('tag.pending')}
              </span>
            )}
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('home.myCollections')}</h3>
            <p className="text-[11px] text-gray-500">{t('lot.timeline')}</p>
          </div>
        </button>

        {/* Price Check */}
        <button
          onClick={() => onNavigate('prices')}
          className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md text-left flex flex-col justify-between active:scale-[0.98] transition-all"
        >
          <span className="text-2xl">💰</span>
          <div className="mt-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('home.priceCheck')}</h3>
            <p className="text-[11px] text-gray-500">{t('prices.disclaimer').slice(0, 24)}...</p>
          </div>
        </button>

        {/* Find Recycler */}
        <button
          onClick={() => onNavigate('map')}
          className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md text-left flex flex-col justify-between active:scale-[0.98] transition-all"
        >
          <span className="text-2xl">♻️</span>
          <div className="mt-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('home.findRecycler')}</h3>
            <p className="text-[11px] text-gray-500">Authorized hubs on map</p>
          </div>
        </button>

        {/* Safety Guide */}
        <button
          onClick={() => onNavigate('safety')}
          className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md text-left flex flex-col justify-between active:scale-[0.98] transition-all"
        >
          <span className="text-2xl">⚠️</span>
          <div className="mt-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('home.safety')}</h3>
            <p className="text-[11px] text-gray-500">Hazard warnings & audio</p>
          </div>
        </button>
      </div>

      {/* Airplane Demonstration Shortcut Banner (For Hackathon Judges) */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
        <div>
          <span className="font-bold block">✈️ SIH Demo: Airplane Mode</span>
          <span className="text-[11px] text-amber-700">
            {syncState.isSimulatedOffline
              ? 'Currently Offline — Collections will stay on phone'
              : 'Test offline lot creation & automatic synchronization'}
          </span>
        </div>
        <button
          onClick={toggleSimulatedOffline}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
            syncState.isSimulatedOffline
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {syncState.isSimulatedOffline ? 'Restore Network' : 'Cut Internet'}
        </button>
      </div>

      {/* Recent Collections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-gray-900 flex items-center">
            <Clock className="w-4 h-4 mr-1 text-gray-500" />
            {t('home.recentTitle')}
          </h3>
          <button
            onClick={() => onNavigate('collections')}
            className="text-xs font-semibold text-brand-700 flex items-center hover:underline"
          >
            {t('home.viewAll')} <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {recentLots.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center border border-dashed border-gray-300 text-gray-500 text-xs">
            {t('home.noCollections')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentLots.map((lot) => (
              <div
                key={lot.clientId}
                onClick={() => onNavigate('lot_detail', lot.clientId)}
                className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-sm flex items-center justify-between hover:border-brand-500 cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700 border border-gray-200">
                    {lot.items?.[0]?.materialCode === 'mobile_pcb'
                      ? '📱'
                      : lot.items?.[0]?.materialCode === 'battery_li_ion'
                      ? '🔋'
                      : lot.items?.[0]?.materialCode === 'copper_cable'
                      ? '🔌'
                      : '💻'}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-900 block">
                      {lot.humanReadableId}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {lot.items?.map((i) => i.materialNameEn).join(', ') || 'E-waste'} •{' '}
                      {lot.totalWeightKg} kg
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-sm text-gray-900 block">
                    ₹{lot.estimatedValue}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      lot.syncStatus === 'SYNCED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {lot.syncStatus === 'SYNCED' ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        {t('tag.synced')}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                        {t('tag.pending')}
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
