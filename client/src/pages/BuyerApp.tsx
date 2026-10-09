import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { db } from '../db/index.ts';
import { LotRecord, MaterialRecord } from '../types/index.ts';
import L from 'leaflet';
import {
  Store,
  ShieldCheck,
  MapPin,
  Search,
  Filter,
  Truck,
  IndianRupee,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  RotateCcw,
  Check,
  Send,
  Eye,
  Phone,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal.tsx';
import { BanAlertBanner } from '../components/BanAlertBanner.tsx';

// Haversine formula for distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const BuyerApp: React.FC<{ onSwitchToCollector: () => void }> = ({ onSwitchToCollector }) => {
  const {
    buyer,
    logoutBuyer,
    updateBuyerProfile,
    isBuyerBanned,
    submitOffer,
    purchaseLot,
    refreshData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'purchases' | 'profile'>('feed');
  const [lots, setLots] = useState<LotRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');

  // Offer Modal State
  const [offerLot, setOfferLot] = useState<LotRecord | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [offerNote, setOfferNote] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);

  // Purchase Modal State
  const [purchaseLotTarget, setPurchaseLotTarget] = useState<LotRecord | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
    lotId?: string;
  } | null>(null);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedMapLot, setSelectedMapLot] = useState<LotRecord | null>(null);

  // Fetch lots from Dexie and Server
  const loadLots = async () => {
    setIsLoading(true);
    try {
      // 1. From local Dexie
      const localLots = await db.lots.toArray();

      // 2. From Server
      try {
        const res = await fetch('/api/lots?limit=100');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            // merge with local
            const serverMap = new Map();
            json.data.forEach((l: any) => serverMap.set(l.clientId, l));
            localLots.forEach((l) => {
              if (!serverMap.has(l.clientId)) serverMap.set(l.clientId, l);
            });
            const merged = Array.from(serverMap.values());
            merged.sort(
              (a, b) => new Date(b.createdAtDevice).getTime() - new Date(a.createdAtDevice).getTime()
            );
            setLots(merged);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      localLots.sort(
        (a, b) => new Date(b.createdAtDevice).getTime() - new Date(a.createdAtDevice).getTime()
      );
      setLots(localLots);
    } catch (e) {
      console.warn('Failed to load lots:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLots();
  }, []);

  // Filter lots
  const filteredLots = lots.filter((lot) => {
    if (activeTab === 'purchases') {
      return (
        lot.status === 'PAYMENT_RECORDED' ||
        lot.buyerId === buyer?.buyerId ||
        lot.offers?.some((o) => o.buyerId === buyer?.buyerId)
      );
    }

    // In general feed, hide cancelled lots or already paid lots by others
    if (lot.status === 'CANCELLED') return false;

    if (selectedMaterialFilter !== 'ALL') {
      const hasMat = lot.items?.some((i) => i.materialCode === selectedMaterialFilter);
      if (!hasMat) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = lot.humanReadableId?.toLowerCase().includes(q);
      const matchCollector = lot.collectorName?.toLowerCase().includes(q);
      const matchMat = lot.items?.some((i) => i.materialNameEn?.toLowerCase().includes(q));
      return matchId || matchCollector || matchMat;
    }

    return true;
  });

  // Handle Offer Submission
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerLot) return;
    setIsSubmittingOffer(true);
    const res = await submitOffer(offerLot.clientId, offerAmount, offerNote);
    setIsSubmittingOffer(false);
    if (res.success) {
      setOfferSuccessMsg('Your offer was registered and transmitted to the collector!');
      setTimeout(() => {
        setOfferLot(null);
        setOfferSuccessMsg(null);
        loadLots();
      }, 1500);
    } else {
      alert(res.error || 'Failed to submit offer');
    }
  };

  // Handle Purchase Confirmation
  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseLotTarget) return;
    setIsSubmittingPurchase(true);
    const res = await purchaseLot(purchaseLotTarget.clientId, purchaseAmount);
    setIsSubmittingPurchase(false);
    if (res.success) {
      setPurchaseSuccessMsg('Purchase settled! Digital traceability receipt recorded.');
      setTimeout(() => {
        setPurchaseLotTarget(null);
        setPurchaseSuccessMsg(null);
        loadLots();
      }, 1500);
    } else {
      alert(res.error || 'Failed to process purchase');
    }
  };

  // Leaflet Map for Buyer
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current || !buyer) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const shopLat = buyer.shopLatitude || 19.1172;
    const shopLng = buyer.shopLongitude || 72.8765;

    const map = L.map(mapContainerRef.current).setView([shopLat, shopLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Shop Marker (Amber/Gold)
    const shopIcon = L.divIcon({
      className: 'buyer-shop-marker',
      html: `<div style="background-color: #d97706; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(217,119,6,0.7);">🏢</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    L.marker([shopLat, shopLng], { icon: shopIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: #b45309; font-size: 13px;">🏢 ${buyer.shopName}</strong><br/>
          <span>${buyer.shopAddress}</span><br/>
          <span style="color: #059669; font-weight: bold;">Verified Authentic Buyer Location</span>
        </div>
      `)
      .openPopup();

    // 5km coverage radius circle
    L.circle([shopLat, shopLng], {
      color: '#d97706',
      fillColor: '#f59e0b',
      fillOpacity: 0.1,
      radius: 3500,
    }).addTo(map);

    // Collector Lots Markers
    const lotIcon = L.divIcon({
      className: 'collector-lot-marker',
      html: `<div style="background-color: #059669; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📦</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    lots.forEach((lot) => {
      if (lot.latitude && lot.longitude && lot.status !== 'CANCELLED') {
        const dist = calculateDistance(shopLat, shopLng, lot.latitude, lot.longitude);
        const marker = L.marker([lot.latitude, lot.longitude], { icon: lotIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-size: 12px;">
            <strong style="color: #064e3b;">📦 ${lot.humanReadableId}</strong><br/>
            <span>Collector: ${lot.collectorName}</span><br/>
            <span>Weight: <b>${lot.totalWeightKg} kg</b> (Est: ₹${lot.estimatedValue})</span><br/>
            <span style="color: #b45309; font-weight: bold;">📍 ${dist} km from your shop</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedMapLot(lot);
        });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, buyer, lots]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <div className="w-full max-w-7xl mx-auto min-h-screen flex flex-col bg-white shadow-sm sm:border-x sm:border-gray-200/80 relative">
        {/* Sticky Top Header for Buyer */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white shadow-md p-3 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20 shadow-inner flex-shrink-0">
                🏢
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-black tracking-tight leading-none">
                    {buyer?.shopName || 'Sharma Metal Recyclers'}
                  </h1>
                  <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase flex items-center">
                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                    Verified
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-amber-100 font-mono">
                  <span>GSTIN: {buyer?.gstin || '27AABCU9603R1ZM'}</span>
                  <span>•</span>
                  <span>📍 {buyer?.shopLatitude?.toFixed(2)}°, {buyer?.shopLongitude?.toFixed(2)}°</span>
                </div>
              </div>
            </div>

            {/* Switch Role Button */}
            <button
              onClick={onSwitchToCollector}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-extrabold text-white border border-white/20 flex items-center space-x-1 transition-all active:scale-95"
              title="Switch back to Collector role"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Collector Mode</span>
            </button>
          </div>
        </header>

        {/* Ban Alert Banner if Buyer is suspended */}
        <BanAlertBanner />

        {/* Buyer Navigation Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 p-1.5 sm:px-6 lg:px-8 text-xs">
          <div className="max-w-7xl mx-auto flex gap-1 sm:gap-2">
            {[
              { id: 'feed' as const, label: 'Scrap Feed', icon: '📦' },
              { id: 'map' as const, label: 'Lots Map', icon: '🗺️' },
              { id: 'purchases' as const, label: 'My Purchases', icon: '🧾' },
              { id: 'profile' as const, label: 'Shop Profile', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 overflow-y-auto space-y-4 max-w-7xl mx-auto w-full">
          {/* TAB 1: SCRAP FEED / LOT MARKET */}
          {activeTab === 'feed' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Search & Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by lot ID, material, or collector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div className="flex space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                  {[
                    { code: 'ALL', label: 'All Scrap' },
                    { code: 'mobile_pcb', label: '📱 Mobile PCB' },
                    { code: 'laptop_pcb', label: '💻 Motherboard' },
                    { code: 'copper_cable', label: '🔌 Copper' },
                    { code: 'battery_li_ion', label: '🔋 Battery' },
                  ].map((f) => (
                    <button
                      key={f.code}
                      onClick={() => setSelectedMaterialFilter(f.code)}
                      className={`px-2.5 py-1 rounded-lg font-bold flex-shrink-0 transition-all ${
                        selectedMaterialFilter === f.code
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-900">
                  Live Available Lots ({filteredLots.length})
                </span>
                <button
                  onClick={loadLots}
                  className="text-[11px] font-bold text-amber-700 hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Lots List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredLots.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300 text-gray-500 text-xs">
                    <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No lots matching your criteria right now.</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Check back shortly or refresh when collectors log new collections.
                    </p>
                  </div>
                ) : (
                  filteredLots.map((lot) => {
                    const shopLat = buyer?.shopLatitude || 19.1172;
                    const shopLng = buyer?.shopLongitude || 72.8765;
                    const distance = lot.latitude
                      ? calculateDistance(shopLat, shopLng, lot.latitude, lot.longitude || shopLng)
                      : 2.5;

                    const hasMyOffer = lot.offers?.some((o) => o.buyerId === buyer?.buyerId);
                    const isPurchased = lot.status === 'PAYMENT_RECORDED';

                    return (
                      <div
                        key={lot.clientId}
                        className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-sm hover:border-amber-500 transition-all space-y-3 relative overflow-hidden"
                      >
                        {/* Header: Lot ID + Distance */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg border border-gray-200">
                              {lot.humanReadableId}
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              📍 {distance} km away
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isPurchased
                                ? 'bg-emerald-100 text-emerald-800'
                                : hasMyOffer
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isPurchased
                              ? 'Purchased'
                              : hasMyOffer
                              ? 'Offer Sent'
                              : 'Open for Bids'}
                          </span>
                        </div>

                        {/* Collector & Material Info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900">
                              {lot.items?.map((i) => i.materialNameEn).join(' + ') || 'E-Waste Items'}
                            </h4>
                            <span className="text-[11px] text-gray-500 flex items-center mt-0.5">
                              <Truck className="w-3.5 h-3.5 mr-1 text-gray-400" />
                              Collector: <strong className="text-gray-800 ml-1">{lot.collectorName}</strong>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-base text-emerald-700 block">
                              ₹{lot.estimatedValue}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">
                              {lot.totalWeightKg} kg
                            </span>
                          </div>
                        </div>

                        {/* Photos preview */}
                        {lot.images && lot.images.length > 0 && (
                          <div className="flex space-x-2 overflow-x-auto py-1">
                            {lot.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.previewUrl || img.storageUrl || '/placeholder.png'}
                                alt="Lot evidence"
                                className="w-14 h-14 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                              />
                            ))}
                          </div>
                        )}

                        {/* Offers summary if any */}
                        {lot.offers && lot.offers.length > 0 && (
                          <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100 text-[10px] text-amber-900 flex items-center justify-between">
                            <span>
                              💬 {lot.offers.length} active offer(s) placed
                            </span>
                            <span className="font-bold">
                              Highest: ₹{Math.max(...lot.offers.map((o) => o.offerAmount))}
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          {/* Report Collector Button */}
                          <button
                            onClick={() =>
                              setReportTarget({
                                id: lot.collectorId,
                                name: lot.collectorName,
                                lotId: lot.humanReadableId,
                              })
                            }
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-xl text-[10px] font-bold flex items-center space-x-1 transition-colors"
                            title="Report this collector for fraud, stones in lot, or no-show"
                          >
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span>Report</span>
                          </button>

                          <div className="flex items-center space-x-2">
                            {/* Make Offer */}
                            <button
                              onClick={() => {
                                setOfferLot(lot);
                                setOfferAmount(lot.estimatedValue);
                              }}
                              disabled={isBuyerBanned || isPurchased}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                              Make Offer
                            </button>

                            {/* Direct Purchase / Accept */}
                            <button
                              onClick={() => {
                                setPurchaseLotTarget(lot);
                                setPurchaseAmount(lot.estimatedValue);
                              }}
                              disabled={isBuyerBanned || isPurchased}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-1"
                            >
                              <span>{isPurchased ? 'Settled' : 'Accept & Pay'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SHOP & SCRAP MAP */}
          {activeTab === 'map' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-gray-900">
                  🗺️ Map: Your Shop & Nearby Lots
                </span>
                <span className="text-gray-500 text-[10px]">
                  Yellow Pin = Your Shop • Green = Lots
                </span>
              </div>

              <div
                ref={mapContainerRef}
                className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-10"
              />

              {/* Selected lot from map */}
              {selectedMapLot && (
                <div className="bg-white p-4 rounded-2xl border-2 border-amber-500 shadow-md animate-fadeIn space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-black text-amber-900 block">
                        {selectedMapLot.humanReadableId}
                      </span>
                      <h4 className="font-extrabold text-gray-900">
                        {selectedMapLot.items?.map((i) => i.materialNameEn).join(' + ')}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Collector: {selectedMapLot.collectorName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-700 block text-sm">
                        ₹{selectedMapLot.estimatedValue}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {selectedMapLot.totalWeightKg} kg
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setOfferLot(selectedMapLot);
                        setOfferAmount(selectedMapLot.estimatedValue);
                      }}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-xl font-bold"
                    >
                      Make Offer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PURCHASES & TRANSACTIONS */}
          {activeTab === 'purchases' && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-gray-900">
                Purchased Lots & Transaction History
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredLots.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300 text-gray-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No purchases recorded yet.</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Accept lots from the Scrap Feed to generate formal EPR settlement receipts.
                    </p>
                  </div>
                ) : (
                  filteredLots.map((lot) => (
                    <div
                      key={lot.clientId}
                      className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-gray-800">
                          {lot.humanReadableId}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ✓ Paid & Settled
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-gray-700">
                        <span>Items: {lot.items?.map((i) => i.materialNameEn).join(', ')}</span>
                        <span className="font-black text-sm text-emerald-800">
                          ₹{lot.finalPaidAmount || lot.estimatedValue}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                        <span>
                          {new Date(lot.paidAt || lot.createdAtDevice).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() =>
                            setReportTarget({
                              id: lot.collectorId,
                              name: lot.collectorName,
                              lotId: lot.humanReadableId,
                            })
                          }
                          className="text-red-600 font-bold hover:underline"
                        >
                          Report Collector
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SHOP PROFILE & SETTINGS */}
          {activeTab === 'profile' && buyer && (
            <div className="space-y-3.5 animate-fadeIn text-xs">
              {/* Business Card */}
              <div className="bg-gradient-to-br from-amber-700 to-amber-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">
                      Authorized Scrap Aggregator
                    </span>
                    <h3 className="text-lg font-black">{buyer.shopName}</h3>
                    <p className="text-xs text-amber-100 mt-0.5">Owner: {buyer.ownerName}</p>
                  </div>
                  <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-[11px]">
                  <div>
                    <span className="text-amber-200 block text-[10px]">GSTIN Number</span>
                    <span className="font-mono font-bold">{buyer.gstin}</span>
                  </div>
                  <div>
                    <span className="text-amber-200 block text-[10px]">Contact Phone</span>
                    <span className="font-bold">{buyer.phone}</span>
                  </div>
                </div>
              </div>

              {/* Shop Geolocation Info */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <span className="font-extrabold text-gray-800 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-amber-600" />
                  Shop Geolocation & Address
                </span>
                <p className="text-gray-600 text-[11px]">{buyer.shopAddress}</p>
                <div className="bg-gray-50 p-2 rounded-xl text-[10px] font-mono text-gray-500">
                  Coordinates: {buyer.shopLatitude}° N, {buyer.shopLongitude}° E
                </div>
              </div>

              {/* Trust Score & Reports Card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-800 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                    Community Standing & Trust
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {buyer.reportCount || 0} Reports Received
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Severity Score: <strong>{buyer.severityScore || 0}</strong> points. Accounts with 6+ points or severe fraud reports are automatically suspended.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={onSwitchToCollector}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Truck className="w-4 h-4" />
                  <span>Switch to Collector View</span>
                </button>

                <button
                  onClick={logoutBuyer}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Buyer Account</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* MAKE OFFER MODAL */}
        {offerLot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-gray-900">Make Price Offer</h3>
                <span className="font-mono text-xs text-amber-700 font-bold">
                  {offerLot.humanReadableId}
                </span>
              </div>

              {offerSuccessMsg ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold">{offerSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleSendOffer} className="space-y-3">
                  <div className="bg-gray-50 p-2.5 rounded-xl text-[11px] text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Weight:</span>
                      <strong>{offerLot.totalWeightKg} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Benchmark Value:</span>
                      <strong className="text-emerald-700">₹{offerLot.estimatedValue}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Your Price Offer (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-base font-extrabold text-amber-900 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Note to Collector (Optional)
                    </label>
                    <input
                      type="text"
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      placeholder="e.g. Can collect today afternoon from your hub"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOfferLot(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingOffer}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center space-x-1"
                    >
                      {isSubmittingOffer ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1" />
                          <span>Submit Offer</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PURCHASE & PAY MODAL */}
        {purchaseLotTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-gray-900">Accept & Record Settlement</h3>
                <span className="font-mono text-xs text-emerald-700 font-bold">
                  {purchaseLotTarget.humanReadableId}
                </span>
              </div>

              {purchaseSuccessMsg ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold">{purchaseSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmPurchase} className="space-y-3">
                  <p className="text-gray-600 text-[11px]">
                    Accepting handover of <strong>{purchaseLotTarget.totalWeightKg} kg</strong> e-waste from <strong>{purchaseLotTarget.collectorName}</strong>.
                  </p>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Final Agreed Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-base font-extrabold text-emerald-900 bg-white border border-gray-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPurchaseLotTarget(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPurchase}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center space-x-1"
                    >
                      {isSubmittingPurchase ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Confirm Payment</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* REPORT MODAL */}
        {reportTarget && (
          <ReportModal
            isOpen={true}
            onClose={() => setReportTarget(null)}
            targetType="COLLECTOR"
            targetId={reportTarget.id}
            targetName={reportTarget.name}
            lotId={reportTarget.lotId}
          />
        )}
      </div>
    </div>
  );
};
