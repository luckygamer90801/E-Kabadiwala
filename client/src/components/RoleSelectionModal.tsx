import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserRole } from '../types/index.ts';
import { Sparkles, ShieldCheck, Truck, Store, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose }) => {
  const { setUserRole } = useApp();

  if (!isOpen) return null;

  const handleSelect = (role: UserRole) => {
    setUserRole(role);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-600 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner backdrop-blur-md border border-white/20 text-3xl">
            ♻️
          </div>
          <span className="text-[10px] tracking-widest font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white inline-block mb-1">
            Kabadiwala Connect • SIH 2026
          </span>
          <h2 className="text-xl font-black tracking-tight">Select Your Role</h2>
          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            Choose how you wish to access the digital e-waste recycling ecosystem.
          </p>
        </div>

        {/* Role Cards */}
        <div className="p-5 space-y-3.5">
          {/* 1. Collector (कबाड़ीवाला) */}
          <button
            onClick={() => handleSelect('collector')}
            className="w-full text-left p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-600 transition-all group active:scale-[0.98] shadow-sm relative overflow-hidden"
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/30">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800">
                    Waste Collector (कबाड़ीवाला)
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Instant
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                  Collect scrap in field, photograph, weight lots, offline mode.
                </p>
                <div className="mt-2 flex items-center text-[10px] font-semibold text-emerald-700 space-x-2">
                  <span className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    No login / password needed
                  </span>
                  <span>•</span>
                  <span>100% Offline</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Start as Collector</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. Buyer / Recycler (कबाड़ खरीदार) */}
          <button
            onClick={() => handleSelect('buyer')}
            className="w-full text-left p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-600 transition-all group active:scale-[0.98] shadow-sm relative overflow-hidden"
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-600/30">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-amber-900">
                    Scrap Buyer (कबाड़ खरीदार / दुकान)
                  </h3>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                  Authorized Aggregator / Formal Recycler buying lots from collectors.
                </p>
                <div className="mt-2 flex items-center text-[10px] font-semibold text-amber-800 space-x-2">
                  <span className="flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1 text-amber-600" />
                    Requires GSTIN / Trade Auth
                  </span>
                  <span>•</span>
                  <span>Shop Pin on Map</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Authenticate as Buyer</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="px-5 pb-5 text-center">
          <p className="text-[10px] text-gray-400">
            You can seamlessly switch roles anytime from the header menu.
          </p>
        </div>
      </div>
    </div>
  );
};
