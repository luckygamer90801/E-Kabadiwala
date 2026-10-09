import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Ban, AlertOctagon, RefreshCw, RotateCcw } from 'lucide-react';

export const BanAlertBanner: React.FC = () => {
  const {
    userRole,
    collector,
    isCollectorBanned,
    collectorBanReason,
    buyer,
    isBuyerBanned,
    buyerBanReason,
    resetUserBan,
  } = useApp();

  const [isResetting, setIsResetting] = useState(false);

  const isBanned = userRole === 'collector' ? isCollectorBanned : isBuyerBanned;
  const banReason =
    userRole === 'collector'
      ? collectorBanReason || 'Multiple community violation reports received.'
      : buyerBanReason || 'Buyer trade privileges suspended due to reports.';
  const userId =
    userRole === 'collector' ? collector.collectorId : buyer?.buyerId || '';

  if (!isBanned) return null;

  const handleReset = async () => {
    if (!userId) return;
    setIsResetting(true);
    await resetUserBan(userId);
    setIsResetting(false);
  };

  return (
    <div className="bg-red-600 text-white p-3 shadow-md border-b-2 border-red-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-start justify-between space-x-2">
        <div className="flex items-start space-x-2.5">
          <Ban className="w-5 h-5 flex-shrink-0 mt-0.5 text-white animate-pulse" />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xs uppercase tracking-wider bg-red-900 px-1.5 py-0.2 rounded">
                Account Suspended
              </span>
              <span className="text-[10px] text-red-100 font-bold">
                (Policy Violations)
              </span>
            </div>
            <p className="text-[11px] text-red-100 mt-0.5 leading-snug">
              {banReason}
            </p>
            <p className="text-[10px] text-red-200 mt-1">
              New lot creation and transactions are blocked to protect community trust.
            </p>
          </div>
        </div>

        {/* Demo Reset / Appeal button for testing */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Demo Reset: Clear strikes and restore account"
          className="flex-shrink-0 px-2 py-1 bg-white text-red-700 hover:bg-red-50 rounded-lg text-[10px] font-extrabold shadow flex items-center space-x-1 transition-transform active:scale-95"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Restoring...' : 'Reset Ban'}</span>
        </button>
      </div>
    </div>
  );
};
