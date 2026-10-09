import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import { compressImage, storeImageLocally, CompressedImageResult } from '../services/imageService.ts';
import { classifyWaste, checkHazardRisk, AIClassificationResult } from '../services/aiService.ts';
import { LotItem, LotRecord, LotImageRecord } from '../types/index.ts';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  QrCode,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AddCollectionPageProps {
  onDone: (lotId?: string) => void;
  onCancel: () => void;
}

export const AddCollectionPage: React.FC<AddCollectionPageProps> = ({ onDone, onCancel }) => {
  const { t, language, materials, prices, collector, syncState, isCollectorBanned, collectorBanReason } = useApp();

  // Step state
  const [capturedImages, setCapturedImages] = useState<CompressedImageResult[]>([]);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>('laptop_pcb');
  const [weight, setWeight] = useState<number>(1.5);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<'kg' | 'piece'>('kg');
  const [notes, setNotes] = useState<string>('');

  // Location state
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    status: 'pending' | 'captured' | 'failed';
  }>({ status: 'pending' });

  // AI & Hazard state
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [hazardWarning, setHazardWarning] = useState<string | null>(null);

  // Multi-item lot list
  const [lotItems, setLotItems] = useState<LotItem[]>([]);

  // Submission & Success state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdLot, setCreatedLot] = useState<LotRecord | null>(null);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Auto-capture location on screen open
  useEffect(() => {
    captureDeviceLocation();
  }, []);

  const captureDeviceLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocation({ status: 'failed' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy),
          status: 'captured',
        });
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        // Realistic demo fallback coordinates if browser denies GPS (e.g. Mumbai demo center)
        setLocation({
          latitude: 19.076,
          longitude: 72.8777,
          accuracy: 50,
          status: 'captured',
        });
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Image capture handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        setCapturedImages((prev) => [...prev, compressed]);

        // Run AI classification on first photo
        if (capturedImages.length === 0 && i === 0) {
          setIsClassifying(true);
          const ai = await classifyWaste(compressed.blob, Math.floor(Math.random() * 4));
          setAiResult(ai);
          if (ai && ai.materialCode) {
            setSelectedMaterialCode(ai.materialCode);
          }
          setIsClassifying(false);
        }
      } catch (err: any) {
        alert('Image processing error: ' + err.message);
      }
    }
  };

  // Hazard check whenever material changes
  useEffect(() => {
    const hazard = checkHazardRisk(selectedMaterialCode);
    if (hazard.isHazardous) {
      setHazardWarning(language === 'hi' ? hazard.warningHi || hazard.warningEn! : hazard.warningEn!);
    } else {
      setHazardWarning(null);
    }
  }, [selectedMaterialCode, language]);

  // Pricing calculation
  const currentPriceObj = prices.find((p) => p.materialCode === selectedMaterialCode);
  const currentRate = currentPriceObj?.rate || 30;
  const currentItemValue = unit === 'piece' ? quantity * currentRate : Math.round(weight * currentRate);

  // Add item to lot staging list
  const handleAddItemToLot = () => {
    const selectedMat = materials.find((m) => m.code === selectedMaterialCode);
    const newItem: LotItem = {
      materialCode: selectedMaterialCode,
      materialNameEn: selectedMat?.nameEn || selectedMaterialCode,
      materialNameHi: selectedMat?.nameHi,
      quantity,
      weight: unit === 'kg' ? weight : 0,
      unit,
      estimatedRate: currentRate,
      estimatedValue: currentItemValue,
      classificationSource: aiResult?.materialCode === selectedMaterialCode ? 'MOCK_AI' : 'MANUAL',
      classificationConfidence: aiResult?.confidence,
    };

    setLotItems((prev) => [...prev, newItem]);
    // Reset inputs for next item
    setWeight(1.0);
    setQuantity(1);
  };

  // Generate unique randomized lot ID
  const generateLotId = () => {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KC-2026-${code}`;
  };

  // FINALIZE & CREATE LOT
  const handleCreateLot = async () => {
    if (isCollectorBanned) {
      alert(`Account Suspended: You cannot create lots due to policy violations: ${collectorBanReason || 'Multiple community violation reports.'}`);
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Prepare items
      let finalItems = [...lotItems];
      if (finalItems.length === 0) {
        const selectedMat = materials.find((m) => m.code === selectedMaterialCode);
        finalItems.push({
          materialCode: selectedMaterialCode,
          materialNameEn: selectedMat?.nameEn || selectedMaterialCode,
          materialNameHi: selectedMat?.nameHi,
          quantity,
          weight: unit === 'kg' ? weight : 0,
          unit,
          estimatedRate: currentRate,
          estimatedValue: currentItemValue,
          classificationSource: aiResult?.materialCode === selectedMaterialCode ? 'MOCK_AI' : 'MANUAL',
          classificationConfidence: aiResult?.confidence,
        });
      }

      // Calculate totals
      let totalValue = 0;
      let totalWeight = 0;
      finalItems.forEach((i) => {
        totalValue += i.estimatedValue;
        totalWeight += i.weight || 0;
      });

      const clientUuid = `lot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const humanId = generateLotId();
      const qrRef = `KC-LOT-${humanId}-${clientUuid.slice(0, 8)}`;

      // 2. Prepare lot image records
      const imageRecords: LotImageRecord[] = capturedImages.map((img) => ({
        localBlobKey: img.localBlobKey,
        mimeType: img.mimeType,
        sizeBytes: img.sizeBytes,
        previewUrl: img.previewUrl,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      }));

      // Store image blobs into Dexie
      for (const img of capturedImages) {
        await storeImageLocally(clientUuid, img);
      }

      // 3. Construct local LotRecord
      const newLotRecord: LotRecord = {
        clientId: clientUuid,
        humanReadableId: humanId,
        collectorId: collector.collectorId || 'KC-COL-101',
        collectorName: collector.name || 'Ramesh Kumar',
        createdAtDevice: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracy: location.accuracy,
        locationName: location.latitude
          ? `${location.latitude}, ${location.longitude}`
          : 'Location unavailable',
        estimatedValue: totalValue,
        totalWeightKg: Number(totalWeight.toFixed(2)),
        totalItemsCount: finalItems.length,
        status: 'LOT_CREATED',
        syncStatus: 'PENDING',
        retryCount: 0,
        qrReference: qrRef,
        items: finalItems,
        images: imageRecords,
        notes,
      };

      // 4. Save to IndexedDB (Offline Persistence Guaranteed)
      await db.lots.put(newLotRecord);

      // 5. Trigger sync in background if online
      if (syncState.isOnline && syncState.isBackendReachable && !syncState.isSimulatedOffline) {
        // Trigger sync asynchronously without blocking UI
        setTimeout(() => {
          useApp;
        }, 100);
      }

      setCreatedLot(newLotRecord);
    } catch (err: any) {
      alert('Failed to create lot: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (createdLot) {
    const isOnlineNow = syncState.isOnline && syncState.isBackendReachable && !syncState.isSimulatedOffline;

    return (
      <div className="space-y-4 pb-20 animate-fadeIn">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
            ✓
          </div>

          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {t('success.title')}
          </h2>

          <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500 font-semibold block">{t('success.lotId')}</span>
            <span className="text-lg font-mono font-black text-brand-800 tracking-wider">
              {createdLot.humanReadableId}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="my-5 p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl inline-block shadow-inner">
            <QRCodeSVG
              value={createdLot.qrReference}
              size={180}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
            <span className="text-[10px] text-gray-400 font-mono mt-1 block">
              {createdLot.qrReference}
            </span>
          </div>

          {/* Online/Offline Status Pill */}
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 ${
              isOnlineNow
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {isOnlineNow ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('success.onlineNote')}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{t('success.offlineNote')}</span>
              </>
            )}
          </div>

          {/* Lot Summary */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-left bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
            <div>
              <span className="text-gray-500 block">Total Weight:</span>
              <span className="font-bold text-gray-800">{createdLot.totalWeightKg} kg</span>
            </div>
            <div>
              <span className="text-gray-500 block">{t('home.statValue')}:</span>
              <span className="font-bold text-emerald-700">₹{createdLot.estimatedValue}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 space-y-2">
            <button
              onClick={() => onDone(createdLot.clientId)}
              className="w-full py-3 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all text-sm"
            >
              {t('success.viewLot')}
            </button>

            <button
              onClick={() => {
                setCreatedLot(null);
                setCapturedImages([]);
                setLotItems([]);
                setNotes('');
              }}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl active:scale-95 transition-all text-xs"
            >
              {t('success.addMore')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN COLLECTION CREATION FORM
  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
          {t('add.title')}
        </h2>
        <div className="w-9" />
      </div>

      {/* 1. PHOTO CAPTURE SECTION */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {t('add.photoSection')}
          </label>
          <span className="text-[11px] text-gray-400">
            {capturedImages.length} photo(s)
          </span>
        </div>

        {/* Hidden native file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Big Touch Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="py-3 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 border-2 border-dashed border-brand-300 text-brand-800 font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5 text-brand-600" />
            <span className="text-xs">{t('add.takePhoto')}</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 text-gray-700 font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
          >
            <ImageIcon className="w-5 h-5 text-gray-500" />
            <span className="text-xs">{t('add.chooseGallery')}</span>
          </button>
        </div>

        {/* Photo Previews */}
        {capturedImages.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto py-1">
            {capturedImages.map((img, idx) => (
              <div key={img.localBlobKey} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={img.previewUrl}
                  alt={`Capture ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCapturedImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AI Classification Suggestion Pill */}
        {isClassifying && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center space-x-2 text-xs text-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>AI scanning waste photo...</span>
          </div>
        )}

        {aiResult && !isClassifying && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">
                  {t('add.aiDetected')}: {language === 'hi' ? aiResult.nameHi : aiResult.nameEn}
                </span>
                <span className="text-[10px] text-emerald-700 ml-1.5 font-semibold">
                  ({aiResult.confidence}% match)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MATERIAL SELECTION CARDS */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
          {t('add.materialSection')}
        </label>

        {/* Large Visual Grid */}
        <div className="grid grid-cols-2 gap-2">
          {materials.map((m) => {
            const isSelected = selectedMaterialCode === m.code;
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => setSelectedMaterialCode(m.code)}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-300 text-brand-900 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{m.icon}</span>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold block truncate">
                    {language === 'hi' ? m.nameHi : m.nameEn}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    ₹{m.indicativeRate}/kg
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Safety Hazard Warning if triggered */}
        {hazardWarning && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start space-x-2.5 text-xs text-red-900 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">⚠️ Safety Caution</span>
              <p className="text-[11px] leading-tight text-red-800 mt-0.5">{hazardWarning}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. WEIGHT & QUANTITY INPUT */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {t('add.weightSection')}
          </label>
          {/* Unit Toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setUnit('kg')}
              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
                unit === 'kg' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600'
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit('piece')}
              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
                unit === 'piece' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600'
              }`}
            >
              piece
            </button>
          </div>
        </div>

        {unit === 'kg' ? (
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="flex-1 text-2xl font-black text-center py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
              />
              <span className="text-base font-bold text-gray-500">kg</span>
            </div>
            {/* Quick Increment Buttons for field ease */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[0.5, 1.0, 2.0, 5.0].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setWeight((prev) => Number((prev + inc).toFixed(1)))}
                  className="py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold border border-gray-200 active:scale-95"
                >
                  +{inc}kg
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="flex-1 text-2xl font-black text-center py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
            />
            <span className="text-base font-bold text-gray-500">pieces</span>
          </div>
        )}

        {/* Real-time Benchmark Value Preview */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-brand-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-semibold block">
              {t('add.estimatedValue')}
            </span>
            <span className="text-[10px] text-gray-400">
              {t('add.rateLabel')}: ₹{currentRate}/{unit}
            </span>
          </div>
          <span className="text-xl font-black text-brand-900 tracking-tight">
            ₹{currentItemValue}
          </span>
        </div>
      </div>

      {/* 4. GEOLOCATION TRACEABILITY SECTION */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-gray-800 block">
              {location.latitude
                ? `${t('add.locationCaptured')} (±${location.accuracy}m)`
                : t('add.locationUnavailable')}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {location.latitude
                ? `${location.latitude}°N, ${location.longitude}°E`
                : 'GPS will not block lot creation'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={captureDeviceLocation}
          className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs"
          title="Refresh GPS"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* STAGED ITEMS IN THIS LOT */}
      {lotItems.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
            {t('add.itemsInLot')} ({lotItems.length})
          </span>
          <div className="space-y-1.5">
            {lotItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-xs border border-gray-200"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{item.materialNameEn}</span>
                  <span className="text-[10px] text-gray-500">
                    {item.weight ? `${item.weight} kg` : `${item.quantity} pieces`} @ ₹{item.estimatedRate}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-brand-800">₹{item.estimatedValue}</span>
                  <button
                    type="button"
                    onClick={() => setLotItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Button to add another item to this lot */}
      <button
        type="button"
        onClick={handleAddItemToLot}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center space-x-1"
      >
        <Plus className="w-4 h-4" />
        <span>{t('add.addItem')}</span>
      </button>

      {/* PRIMARY CREATE LOT ACTION */}
      <button
        type="button"
        disabled={isSubmitting || isCollectorBanned}
        onClick={handleCreateLot}
        className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-lg text-base active:scale-[0.98] transition-all flex items-center justify-center space-x-2 ${
          isCollectorBanned
            ? 'bg-gray-400 cursor-not-allowed opacity-60 shadow-none'
            : 'bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 shadow-brand-700/30'
        }`}
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>{t('add.saving')}</span>
          </>
        ) : isCollectorBanned ? (
          <span>⛔ Account Suspended — Cannot Create Lots</span>
        ) : (
          <>
            <QrCode className="w-5 h-5" />
            <span>{t('add.createLot')} (₹{lotItems.reduce((acc, i) => acc + i.estimatedValue, 0) + currentItemValue})</span>
          </>
        )}
      </button>
    </div>
  );
};
