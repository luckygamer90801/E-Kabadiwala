import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import {
  User,
  Phone,
  Globe,
  Plane,
  Database,
  Terminal,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  LogOut,
} from 'lucide-react';

interface ProfilePageProps {
  onOpenDebug: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenDebug }) => {
  const { t, collector, language, setLanguage, syncState, toggleSimulatedOffline, setUserRole } = useApp();
  const [offlineStats, setOfflineStats] = useState({
    localLots: 0,
    imageBlobs: 0,
  });

  useEffect(() => {
    loadOfflineStats();
  }, [syncState]);

  const loadOfflineStats = async () => {
    try {
      const lotCount = await db.lots.count();
      const imgCount = await db.imageBlobs.count();
      setOfflineStats({ localLots: lotCount, imageBlobs: imgCount });
    } catch {}
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {t('profile.title')}
        </h2>
        <p className="text-xs text-gray-500">
          Informal Collector Credentials & Device Sync Settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Collector Info Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center text-2xl font-black shadow-md flex-shrink-0">
                👨‍🔧
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-800 rounded-md border border-brand-200">
                  {collector.collectorId || 'KC-COL-101'}
                </span>
                <h3 className="font-extrabold text-base text-gray-900 mt-0.5">
                  {collector.name || 'Ramesh Kumar'}
                </h3>
                <p className="text-xs text-gray-500 flex items-center">
                  <Phone className="w-3 h-3 mr-1 text-gray-400" />
                  +91 {collector.phone || '9876543210'}
                </p>
              </div>
            </div>

            {/* Language Selection */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                <Globe className="w-4 h-4 mr-1 text-brand-600" />
                {t('profile.language')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'en', label: 'English' },
                  { code: 'mr', label: 'मराठी (Marathi)' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      language === lang.code
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COMMUNITY STANDING & REPORT STRIKES */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                Community Trust & Strikes
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                collector.isBanned
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : (collector.reportCount || 0) > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {collector.isBanned
                  ? '⛔ Account Suspended'
                  : `${collector.reportCount || 0} Reports (${collector.severityScore || 0} pts)`}
              </span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Collectors and buyers can report each other with evidence. Users with 6+ severity points or severe violations are automatically banned.
            </p>

            {collector.isBanned && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900">
                <strong>Ban Reason:</strong> {collector.banReason || 'Multiple community reports'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* SIH AIRPLANE MODE DEMO TOGGLE */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center space-x-1.5">
                  <Plane className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-sm text-gray-900">
                    {t('profile.demoAirplane')}
                  </h4>
                </div>
                <p className="text-xs text-gray-500">
                  {t('profile.demoAirplaneDesc')}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleSimulatedOffline}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syncState.isSimulatedOffline ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    syncState.isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {syncState.isSimulatedOffline && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium animate-fadeIn">
                ⚠️ Network simulated as offline. Any collections created now will remain locally in phone storage until you turn this off!
              </div>
            )}
          </div>

          {/* DEVICE PERSISTENT STORAGE STATS */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
              <HardDrive className="w-4 h-4 mr-1 text-brand-600" />
              {t('profile.offlineStats')}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                  IndexedDB Lots
                </span>
                <span className="text-lg font-black text-gray-900">
                  {offlineStats.localLots} records
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                  Offline Photo Blobs
                </span>
                <span className="text-lg font-black text-gray-900">
                  {offlineStats.imageBlobs} images
                </span>
              </div>
            </div>
          </div>

          {/* SWITCH ROLE TO BUYER */}
          <button
            type="button"
            onClick={() => setUserRole('buyer')}
            className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-base">🏢</span>
              <span>Switch to Scrap Buyer (दुकान) Mode</span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded">
              Switch Role
            </span>
          </button>

          {/* DEBUG SCREEN SHORTCUT */}
          <button
            type="button"
            onClick={onOpenDebug}
            className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{t('profile.debugScreen')}</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
              SIH EVALUATOR
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
