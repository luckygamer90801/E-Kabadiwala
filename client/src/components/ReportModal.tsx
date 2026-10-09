import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ReportSeverity } from '../types/index.ts';
import {
  AlertTriangle,
  Camera,
  Upload,
  X,
  ShieldAlert,
  CheckCircle2,
  FileText,
  RefreshCw,
  Scale,
  Ban,
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'COLLECTOR' | 'BUYER';
  targetId: string;
  targetName: string;
  lotId?: string;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  lotId,
  onSuccess,
}) => {
  const { userRole, collector, buyer, fileReport } = useApp();

  const isCollectorReporting = userRole === 'collector';

  const buyerCategories = [
    { value: 'UNDERWEIGHING_SCALES', label: '⚖️ Rigged Scale / Underweighing E-Waste' },
    { value: 'PAYMENT_REFUSAL', label: '💵 Payment Refused / Delayed Unfairly' },
    { value: 'VERBAL_ABUSE', label: '🗣️ Abusive Harassment or Mistreatment' },
    { value: 'FAKE_SHOP_LOCATION', label: '📍 Fake or Abandoned Shop Address' },
    { value: 'SAFETY_VIOLATION', label: '☣️ Unsafe Open Burning or Acid Leaching' },
    { value: 'OTHER', label: '⚠️ Other Serious Violation' },
  ];

  const collectorCategories = [
    { value: 'ADULTERATED_WASTE', label: '🪨 Adulterated Waste (Stones / Water in Lot)' },
    { value: 'HAZARDOUS_MIXING', label: '☣️ Hazardous / Toxic Waste Mixed Inside' },
    { value: 'NO_SHOW_GHOST_LOT', label: '👻 Ghost Lot / Collector Never Showed Up' },
    { value: 'MISREPRESENTED_WEIGHT', label: '⚖️ Grossly Misrepresented Weight' },
    { value: 'STOLEN_GOODS', label: '🚨 Suspected Stolen / Tampered Electronics' },
    { value: 'OTHER', label: '⚠️ Other Serious Violation' },
  ];

  const categories = isCollectorReporting ? buyerCategories : collectorCategories;

  const [category, setCategory] = useState(categories[0].value);
  const [severity, setSeverity] = useState<ReportSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    text: string;
    banned: boolean;
    reportId?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg('Please describe what happened in detail.');
      return;
    }

    setIsSubmitting(true);

    const reporterType = isCollectorReporting ? 'COLLECTOR' : 'BUYER';
    const reporterId = isCollectorReporting ? collector.collectorId : buyer?.buyerId || 'BUYER-DEMO';
    const reporterName = isCollectorReporting ? collector.name : buyer?.shopName || 'Authorized Buyer';

    const res = await fileReport({
      reporterType,
      reporterId,
      reporterName,
      targetType,
      targetId,
      targetName,
      lotId,
      category,
      severity,
      description: description.trim(),
      proofImages: proofImage ? [proofImage] : [],
    });

    setIsSubmitting(false);

    if (res.success) {
      setResultMessage({
        text: res.message || 'Report submitted successfully.',
        banned: !!res.targetBanned,
      });
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to file report. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm tracking-tight">Report Violation</h3>
                <span className="text-[9px] bg-red-900 text-red-100 font-bold px-1.5 py-0.2 rounded uppercase">
                  Proof Review
                </span>
              </div>
              <p className="text-[11px] text-red-100">
                Reporting {targetType === 'COLLECTOR' ? 'Collector' : 'Buyer'}: <span className="font-bold underline">{targetName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {resultMessage ? (
          <div className="p-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              resultMessage.banned ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {resultMessage.banned ? <Ban className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>

            <div>
              <h4 className="font-black text-base text-gray-900">
                {resultMessage.banned ? '⛔ User Account Suspended' : 'Report Logged Successfully'}
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {resultMessage.text}
              </p>
            </div>

            {resultMessage.banned && (
              <div className="bg-red-50 p-3 rounded-2xl border border-red-200 text-left text-xs text-red-900 space-y-1">
                <span className="font-bold block">Community Safety Action:</span>
                <p className="text-[11px] text-red-800">
                  Because of repeated or high-severity violation reports, <strong>{targetName}</strong> has been restricted from creating lots or making purchases.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-800 text-[11px] flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Card */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Target User</span>
                <span className="font-extrabold text-xs text-gray-900">{targetName}</span>
                <span className="text-[10px] text-gray-500 font-mono block">ID: {targetId}</span>
              </div>
              {lotId && (
                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-mono">
                  Lot: {lotId}
                </span>
              )}
            </div>

            {/* 1. Category */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Violation Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-800 focus:border-red-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Seriousness Level */}
            <div>
              <label className="block text-gray-700 font-bold mb-1 flex items-center justify-between">
                <span>Seriousness Level *</span>
                <span className="text-[10px] text-gray-400 font-normal">Impacts Ban Strikes</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { level: 'LOW' as const, pts: '1 pt', label: 'Low', desc: 'Minor' },
                  { level: 'MEDIUM' as const, pts: '2 pts', label: 'Medium', desc: 'Dispute' },
                  { level: 'HIGH' as const, pts: '3 pts', label: 'High', desc: 'Fraud' },
                  { level: 'SEVERE' as const, pts: '4 pts', label: 'Severe', desc: 'Ban risk' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSeverity(item.level)}
                    className={`p-2 rounded-xl border transition-all ${
                      severity === item.level
                        ? item.level === 'SEVERE'
                          ? 'bg-red-600 text-white border-red-700 shadow-md scale-[1.02]'
                          : 'bg-red-50 text-red-900 border-red-500 font-black shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-extrabold block text-xs">{item.label}</span>
                    <span className="text-[9px] opacity-80 block">{item.pts}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                What happened? (Describe incident) *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give exact details: weights disputed, payment withheld, contaminated items, abusive words..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* 4. Proof Upload */}
            <div>
              <label className="block text-gray-700 font-bold mb-1 flex items-center justify-between">
                <span>Attach Photographic Evidence / Proof</span>
                <span className="text-[10px] text-red-600 font-semibold">Recommended</span>
              </label>

              {proofImage ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-300 max-h-32 bg-gray-100 flex items-center justify-center">
                  <img src={proofImage} alt="Proof" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofImage(null)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-red-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-red-50/40 transition-colors">
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-gray-700 font-bold text-[11px]">Take Photo or Upload Proof</span>
                  <span className="text-[10px] text-gray-400">Scale reading, receipt, contaminated lot photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold rounded-xl shadow-md shadow-red-600/30 flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Report & Evidence...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Submit Violation Report</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                Users accumulating multiple serious reports will be automatically banned from the app.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
