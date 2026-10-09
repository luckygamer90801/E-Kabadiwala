import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  Home,
  Layers,
  Plus,
  MapPin,
  TrendingUp,
  ShieldAlert,
  User,
} from 'lucide-react';

export const Navbar: React.FC<{
  currentTab?: string;
  onNavigate?: (tab: string) => void;
  onOpenDebug?: () => void;
}> = ({ currentTab, onNavigate, onOpenDebug }) => {
  const {
    t,
    language,
    setLanguage,
    syncState,
    pendingLotsCount,
    syncNow,
    toggleSimulatedOffline,
    userRole,
    setUserRole,
  } = useApp();

  const isActuallyOnline = syncState.isOnline && syncState.isBackendReachable;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Greeting */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => onNavigate && onNavigate('home')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-black text-lg flex-shrink-0">
            ♻️
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold text-gray-900 leading-tight tracking-tight">
                {t('app.title')}
              </h1>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                SIH
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {t('app.namaste')}, Ramesh 👋
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        {onNavigate && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {[
              { id: 'home', label: t('nav.home'), icon: Home },
              { id: 'collections', label: t('nav.collections'), icon: Layers, badge: pendingLotsCount },
              { id: 'map', label: t('nav.map'), icon: MapPin },
              { id: 'prices', label: t('home.priceCheck'), icon: TrendingUp },
              { id: 'safety', label: t('home.safety'), icon: ShieldAlert },
              { id: 'profile', label: t('nav.profile'), icon: User },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-brand-50 text-brand-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-0.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            {/* Desktop Add Collection CTA */}
            <button
              onClick={() => onNavigate('add')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 text-white font-extrabold text-xs shadow-md hover:from-brand-800 hover:to-brand-700 active:scale-95 transition-all ml-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('home.addCollection')}</span>
            </button>
          </nav>
        )}

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Online/Offline Pill */}
          <button
            onClick={toggleSimulatedOffline}
            title={syncState.isSimulatedOffline ? 'Disable Airplane Demo Mode' : 'Click to toggle simulated airplane mode for demo'}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              isActuallyOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
            }`}
          >
            {isActuallyOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <Wifi className="w-3.5 h-3.5 ml-0.5" />
                <span>{t('status.online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {pendingLotsCount > 0 ? `${pendingLotsCount} ${t('tag.pending')}` : t('status.offline')}
                </span>
              </>
            )}
          </button>

          {/* Sync Trigger button if pending */}
          {pendingLotsCount > 0 && isActuallyOnline && (
            <button
              onClick={() => syncNow()}
              disabled={syncState.isSyncing}
              className="p-1.5 rounded-full bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors"
              title={t('status.syncNow')}
            >
              <RefreshCw className={`w-4 h-4 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Language Selector */}
          <button
            onClick={() => {
              if (language === 'hi') setLanguage('en');
              else if (language === 'en') setLanguage('mr');
              else setLanguage('hi');
            }}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-colors"
            title="Change language"
          >
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-bold">
              {language === 'hi' ? 'हिंदी' : language === 'en' ? 'EN' : 'मराठी'}
            </span>
          </button>

          {/* Role Switcher Pill */}
          <button
            onClick={() => setUserRole(userRole === 'collector' ? 'buyer' : 'collector')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 ${
              userRole === 'collector'
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
            title="Click to toggle between Collector and Buyer interface"
          >
            <span>{userRole === 'collector' ? '👷' : '🏢'}</span>
            <span>{userRole === 'collector' ? 'Collector' : 'Buyer'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
