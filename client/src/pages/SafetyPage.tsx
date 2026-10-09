import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { speakSafetyAlert } from '../services/aiService.ts';
import { SafetyAlertRecord } from '../types/index.ts';
import {
  ShieldAlert,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Info,
} from 'lucide-react';

export const SafetyPage: React.FC = () => {
  const { t, language, safetyAlerts } = useApp();
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const handleSpeak = async (alert: SafetyAlertRecord) => {
    setActiveSpeakingId(alert.alertId);
    await speakSafetyAlert(alert, language);
    setTimeout(() => setActiveSpeakingId(null), 4000);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
          <ShieldAlert className="w-5 h-5 mr-1.5 text-red-600" />
          {t('safety.title')}
        </h2>
        <p className="text-xs text-gray-500">
          {t('safety.subtitle')}
        </p>
      </div>

      {/* Safety Alert Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safetyAlerts.map((alert) => {
          const isHigh = alert.severity === 'HIGH';
          const isSpeaking = activeSpeakingId === alert.alertId;

          return (
            <div
              key={alert.alertId}
              className={`bg-white rounded-2xl p-4 border shadow-sm space-y-3 transition-all ${
                isHigh ? 'border-red-200' : 'border-amber-200'
              }`}
            >
              {/* Header with Icon, Title, and Audio Button */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl flex-shrink-0">{alert.icon || '⚠️'}</span>
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block mb-1 ${
                        isHigh ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.severity} RISK
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {language === 'hi' ? alert.titleHi : alert.titleEn}
                    </h3>
                  </div>
                </div>

                {/* Speech Synthesis Audio Button */}
                <button
                  type="button"
                  onClick={() => handleSpeak(alert)}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all active:scale-95 ${
                    isSpeaking
                      ? 'bg-brand-600 text-white animate-pulse'
                      : 'bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-200'
                  }`}
                  title={t('safety.listenAudio')}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Description Body */}
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                {language === 'hi' ? alert.bodyHi : alert.bodyEn}
              </p>

              {/* Do's & Don'ts Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {/* Do */}
                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    {t('safety.dos')}
                  </span>
                  <ul className="text-[11px] text-gray-700 space-y-1">
                    {(language === 'hi' ? alert.dosHi : alert.dosEn)?.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-emerald-600 font-bold mr-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Don't */}
                <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-800 flex items-center">
                    <XCircle className="w-3 h-3 mr-1 text-red-600" />
                    {t('safety.donts')}
                  </span>
                  <ul className="text-[11px] text-gray-700 space-y-1">
                    {(language === 'hi' ? alert.dontsHi : alert.dontsEn)?.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-600 font-bold mr-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
