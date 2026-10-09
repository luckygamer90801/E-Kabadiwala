import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import { LotRecord } from '../types/index.ts';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  Share2,
  RefreshCw,
  Scale,
  IndianRupee,
  Layers,
  Sparkles,
  AlertOctagon,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import { CancelLotModal } from '../components/CancelLotModal.tsx';
import { ReportModal } from '../components/ReportModal.tsx';

interface LotDetailPageProps {
  lotId: string;
  onBack: () => void;
}

export const LotDetailPage: React.FC<LotDetailPageProps> = ({ lotId, onBack }) => {
  const { t, language, syncNow, syncState } = useApp();
  const [lot, setLot] = useState<LotRecord | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    loadLot();
  }, [lotId]);

  const loadLot = async () => {
    try {
      const record = await db.lots.get(lotId);
      if (record) {
        setLot(record);
      } else {
        // Try finding by human readable ID
        const found = await db.lots.where('humanReadableId').equals(lotId).first();
        if (found) setLot(found);
      }
    } catch (e) {
      console.warn('Failed to load lot detail:', e);
    }
  };

  if (!lot) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
        Loading lot details...
      </div>
    );
  }

  const isSynced = lot.syncStatus === 'SYNCED';
  const isCancelled = lot.status === 'CANCELLED';

  // 7-Stage Traceability Timeline
  const timelineStages = isCancelled
    ? [
        { key: 'stepCollected', title: t('lot.stepCollected'), done: true, time: new Date(lot.createdAtDevice).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { key: 'stepCreated', title: t('lot.stepCreated'), done: true, time: new Date(lot.createdAtDevice).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { key: 'cancelled', title: 'Lot Cancelled by Collector', done: true, isCancelled: true, time: lot.cancelledAt ? new Date(lot.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Cancelled' },
      ]
    : [
        { key: 'stepCollected', title: t('lot.stepCollected'), done: true, time: new Date(lot.createdAtDevice).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { key: 'stepCreated', title: t('lot.stepCreated'), done: true, time: new Date(lot.createdAtDevice).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { key: 'stepSynced', title: t('lot.stepSynced'), done: isSynced, time: isSynced ? 'Cloud Verified' : 'Waiting for Internet' },
        { key: 'stepOffer', title: t('lot.stepOffer'), done: !!lot.offers?.length, time: lot.offers?.length ? `${lot.offers.length} formal offer(s)` : 'Pending formal offer' },
        { key: 'stepHandover', title: t('lot.stepHandover'), done: lot.status === 'HANDOVER' || lot.status === 'PAYMENT_RECORDED', time: 'At aggregation hub' },
        { key: 'stepAccepted', title: t('lot.stepAccepted'), done: lot.status === 'RECYCLER_ACCEPTED' || lot.status === 'PAYMENT_RECORDED', time: 'Quality test & verify' },
        { key: 'stepPaid', title: t('lot.stepPaid'), done: lot.status === 'PAYMENT_RECORDED', time: lot.status === 'PAYMENT_RECORDED' ? 'EPR settlement receipt' : 'EPR settlement receipt' },
      ];

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
          {t('lot.detailsTitle')}
        </h2>
        <div className="w-9" />
      </div>

      {/* CANCELLED LOT BANNER */}
      {isCancelled && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-red-950 shadow-sm space-y-1">
          <div className="flex items-center space-x-2">
            <Ban className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-black text-sm">Collection Lot Cancelled</span>
          </div>
          <p className="text-xs text-red-700 pl-7 leading-relaxed">
            <strong>Problem / Reason:</strong> {lot.cancellationReason || 'Cancelled by collector'}
          </p>
          {lot.cancelledAt && (
            <span className="text-[10px] text-red-500 pl-7 block">
              Cancelled on {new Date(lot.cancelledAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Lot Identification Card & QR Code */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center space-y-4">
        <div>
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">
            {t('success.lotId')}
          </span>
          <h3 className="text-2xl font-mono font-black text-brand-900 tracking-wider mt-0.5">
            {lot.humanReadableId}
          </h3>
          <span className="text-[11px] text-gray-500">
            Recorded {new Date(lot.createdAtDevice).toLocaleDateString()} at{' '}
            {new Date(lot.createdAtDevice).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* QR Code */}
        <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl inline-block shadow-inner">
          <QRCodeSVG
            value={lot.qrReference}
            size={180}
            level="H"
            includeMargin={true}
            className="mx-auto"
          />
          <span className="text-[10px] text-gray-400 font-mono mt-1.5 block">
            {lot.qrReference}
          </span>
        </div>

        {/* Sync Status Badge */}
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 ${
            isSynced
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          {isSynced ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('success.onlineNote')}</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{t('success.offlineNote')}</span>
            </>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-gray-100">
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Weight</span>
            <span className="text-base font-extrabold text-gray-900">{lot.totalWeightKg} kg</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">{t('home.statValue')}</span>
            <span className="text-base font-extrabold text-emerald-700">₹{lot.estimatedValue}</span>
          </div>
        </div>
      </div>

      {/* CHAIN-OF-CUSTODY TRACEABILITY TIMELINE */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-600" />
          {t('lot.timeline')}
        </h4>

        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {timelineStages.map((stage, idx) => (
            <div key={idx} className="relative flex items-start space-x-3">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                  stage.done
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {stage.done ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <span
                  className={`text-xs font-bold block ${
                    stage.done ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {stage.title}
                </span>
                <span className="text-[11px] text-gray-500">{stage.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLLECTED ITEMS BREAKDOWN */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
          <Layers className="w-4 h-4 mr-1.5 text-brand-600" />
          {t('lot.itemsHeader')}
        </h4>

        <div className="space-y-2">
          {lot.items?.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-gray-900 block">{item.materialNameEn}</span>
                <span className="text-[11px] text-gray-500">
                  {item.weight ? `${item.weight} kg` : `${item.quantity} pieces`} @ ₹{item.estimatedRate}/{item.unit}
                </span>
                {item.classificationSource === 'MOCK_AI' && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold inline-flex items-center mt-1">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Verified ({item.classificationConfidence}%)
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-black text-sm text-brand-900 block">
                  ₹{item.estimatedValue}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">Benchmark</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CAPTURED PHOTOS GALLERY */}
      {lot.images && lot.images.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {t('lot.photosHeader')} ({lot.images.length})
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {lot.images.map((img, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner"
              >
                <img
                  src={img.previewUrl || img.storageUrl || '/placeholder.png'}
                  alt={`Lot photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOCATION METADATA */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-gray-900 block">{t('lot.locationHeader')}</span>
            <span className="text-[11px] text-gray-500 font-mono">
              {lot.latitude
                ? `${lot.latitude}° N, ${lot.longitude}° E (±${lot.locationAccuracy}m)`
                : 'Approximate Location'}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (Cancel Lot / Report Buyer) */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700">Lot Operations</span>
          {isCancelled ? (
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
              Cancelled
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Active In Marketplace
            </span>
          )}
        </div>

        {!isCancelled && lot.status !== 'PAYMENT_RECORDED' && (
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-colors active:scale-[0.99]"
          >
            <AlertOctagon className="w-4 h-4 text-red-600" />
            <span>Cancel This Lot (Problem Encountered)</span>
          </button>
        )}

        {lot.offers && lot.offers.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="font-bold text-xs text-gray-800 block">
              Offers From Verified Buyers ({lot.offers.length})
            </span>
            <div className="space-y-1.5">
              {lot.offers.map((offer, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 block">{offer.shopName}</span>
                    <span className="text-[10px] text-gray-500">
                      By {offer.buyerName} {offer.note ? `• "${offer.note}"` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-800 text-sm block">
                      ₹{offer.offerAmount}
                    </span>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Report Buyer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Lot Modal */}
      <CancelLotModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        lotId={lot.clientId}
        humanReadableId={lot.humanReadableId}
        onCancelled={() => {
          loadLot();
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="BUYER"
        targetId={lot.offers?.[0]?.buyerId || lot.buyerId || 'BUYER-DEMO'}
        targetName={lot.offers?.[0]?.shopName || lot.shopName || 'Authorized Recycler Hub'}
        lotId={lot.humanReadableId}
      />
    </div>
  );
};
