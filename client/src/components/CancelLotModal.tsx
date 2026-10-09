import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { AlertOctagon, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface CancelLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotId: string;
  humanReadableId: string;
  onCancelled?: () => void;
}

export const CancelLotModal: React.FC<CancelLotModalProps> = ({
  isOpen,
  onClose,
  lotId,
  humanReadableId,
  onCancelled,
}) => {
  const { cancelLot } = useApp();

  const reasons = [
    { value: 'WRONG_WEIGHT_OR_ITEMS', label: 'Wrong weight or item entered by mistake' },
    { value: 'CUSTOMER_CANCELLED', label: 'Customer cancelled / refused e-waste handover' },
    { value: 'DAMAGED_CONTAMINATED', label: 'Lot damaged or contaminated with hazardous liquid' },
    { value: 'DUPLICATE_ENTRY', label: 'Duplicate entry / test collection' },
    { value: 'OTHER', label: 'Other problem in the field' },
  ];

  const [selectedReason, setSelectedReason] = useState(reasons[0].label);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullReason = notes.trim()
      ? `${selectedReason}: ${notes.trim()}`
      : selectedReason;

    const res = await cancelLot(lotId, fullReason);
    setIsSubmitting(false);

    if (res.success) {
      if (onCancelled) onCancelled();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to cancel lot.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all text-xs">
        {/* Header */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-950">Cancel Collection Lot</h3>
              <span className="font-mono text-[10px] text-red-700 block font-bold">
                {humanReadableId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-red-800 text-[11px]">
              {errorMsg}
            </div>
          )}

          <p className="text-gray-600 text-[11px] leading-relaxed">
            Cancelling this lot will remove it from the active marketplace and reverse its contribution to your stats. This action cannot be undone.
          </p>

          <div>
            <label className="block text-gray-700 font-bold mb-1">
              Reason for Cancellation *
            </label>
            <div className="space-y-1.5">
              {reasons.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start space-x-2 p-2 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === r.label
                      ? 'bg-red-50/80 border-red-400 text-red-950 font-semibold'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={selectedReason === r.label}
                    onChange={() => setSelectedReason(r.label)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-[11px]">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">
              Additional Details / Problem Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Accidental double entry for 5kg copper"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-bold text-gray-700 transition-colors"
            >
              Keep Lot
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md shadow-red-600/30 flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancel</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
