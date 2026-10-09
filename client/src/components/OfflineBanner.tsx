import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { RefreshCw, CloudOff, CheckCircle2, AlertTriangle } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { t, syncState, pendingLotsCount, syncNow } = useApp();

  const isActuallyOnline = syncState.isOnline && syncState.isBackendReachable;

  if (pendingLotsCount === 0 && isActuallyOnline) {
    return null;
  }

  return (
    <div
      className={`px-4 sm:px-6 lg:px-8 py-2 border-b text-xs transition-colors ${
        syncState.isSyncing
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : !isActuallyOnline
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {syncState.isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          ) : !isActuallyOnline ? (
            <CloudOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}

          <div>
            <span className="font-semibold">
              {syncState.isSyncing
                ? t('status.syncing')
                : !isActuallyOnline
                ? t('status.offline')
                : t('status.allSynced')}
            </span>
            {pendingLotsCount > 0 && !syncState.isSyncing && (
              <span className="ml-1 text-[11px] text-gray-600 font-normal">
                ({t('status.pendingCount', { count: pendingLotsCount })})
              </span>
            )}
          </div>
        </div>

        {pendingLotsCount > 0 && isActuallyOnline && !syncState.isSyncing && (
          <button
            onClick={() => syncNow()}
            className="px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white font-medium rounded-lg text-xs shadow-sm flex items-center space-x-1 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            <span>{t('status.syncNow')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
