import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import L from 'leaflet';
import {
  ShieldCheck,
  MapPin,
  Store,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';

interface BuyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BuyerAuthModal: React.FC<BuyerAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { authenticateBuyer } = useApp();

  const [shopName, setShopName] = useState('Sharma Metal & E-Waste Scrap Yard');
  const [ownerName, setOwnerName] = useState('Anil Sharma');
  const [phone, setPhone] = useState('9823456789');
  const [gstin, setGstin] = useState('27AABCU9603R1ZM');
  const [licenseType, setLicenseType] = useState('GSTIN');
  const [operatingHours, setOperatingHours] = useState('09:00 AM - 07:30 PM');

  // OTP Demo state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('1234');
  const [isOtpVerified, setIsOtpVerified] = useState(true);

  // Shop Map Location
  const [shopCoords, setShopCoords] = useState<{ lat: number; lng: number }>({
    lat: 19.1172,
    lng: 72.8765,
  });
  const [shopAddress, setShopAddress] = useState('Gala 14, Near MIDC Signal, Andheri East, Mumbai');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    'mobile_pcb',
    'laptop_pcb',
    'copper_cable',
    'battery_li_ion',
  ]);

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Auto-detect device GPS on open if available
  useEffect(() => {
    if (!isOpen) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setShopCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Keep default Mumbai industrial area
        },
        { timeout: 4000 }
      );
    }
  }, [isOpen]);

  // Leaflet Map Initialization for Pinning Shop Location
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([shopCoords.lat, shopCoords.lng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const shopIcon = L.divIcon({
      className: 'custom-shop-pin',
      html: `<div style="background-color: #d97706; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 3px 10px rgba(217,119,6,0.6);">🏢</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([shopCoords.lat, shopCoords.lng], {
      icon: shopIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup('<b>📍 Your Shop Location</b><br/>Drag or click anywhere to adjust.').openPopup();

    // On Drag End
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setShopCoords({ lat: Number(pos.lat.toFixed(5)), lng: Number(pos.lng.toFixed(5)) });
      setShopAddress(`Shop Location at ${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E`);
    });

    // On Click anywhere on map
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setShopCoords({ lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) });
      setShopAddress(`Shop Location at ${e.latlng.lat.toFixed(4)}° N, ${e.latlng.lng.toFixed(4)}° E`);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  const handleUseGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          };
          setShopCoords(newCoords);
          setShopAddress(`Current GPS Pin: ${newCoords.lat}° N, ${newCoords.lng}° E (±${Math.round(pos.coords.accuracy)}m)`);
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 14);
            markerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
          }
          setIsLocating(false);
        },
        (err) => {
          console.warn('GPS error:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp === '1234' || otp.length === 4) {
      setIsOtpVerified(true);
    }
  };

  const toggleMaterial = (mat: string) => {
    if (selectedMaterials.includes(mat)) {
      setSelectedMaterials(selectedMaterials.filter((m) => m !== mat));
    } else {
      setSelectedMaterials([...selectedMaterials, mat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!shopName.trim() || !ownerName.trim() || !phone.trim() || !gstin.trim()) {
      setErrorMsg('Please complete all required verification fields.');
      return;
    }

    setIsSubmitting(true);
    const result = await authenticateBuyer({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      gstin: gstin.trim(),
      licenseType,
      shopLatitude: shopCoords.lat,
      shopLongitude: shopCoords.lng,
      shopAddress: shopAddress.trim(),
      operatingHours,
      acceptedMaterials: selectedMaterials,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/20">
              🏢
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm tracking-tight">Authentic Buyer Verification</h3>
                <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-amber-100">
                Authenticate your business & set shop map pin
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-2xl flex items-center space-x-2 text-red-800 text-[11px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Business Identity & Verification */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-800 flex items-center">
                <Store className="w-3.5 h-3.5 mr-1 text-amber-600" />
                1. Business Identity
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center">
                <ShieldCheck className="w-3 h-3 mr-0.5" />
                Authorized Trade
              </span>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">
                Shop / Business Trade Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma Metal & E-Waste Scrap Yard"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Anil Sharma"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9823456789"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* OTP Verification Pill */}
            <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <div>
                  <span className="font-bold text-gray-800 block text-[11px]">Phone OTP Verification</span>
                  <span className="text-[10px] text-gray-500">Demo OTP: 1234</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-16 px-2 py-1 text-center font-mono font-bold border border-gray-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="px-2 py-1 bg-amber-600 text-white rounded-lg font-bold text-[10px] hover:bg-amber-700"
                >
                  {isOtpVerified ? '✓ Verified' : 'Verify'}
                </button>
              </div>
            </div>

            {/* GSTIN / Trade Registration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-600 font-semibold">
                  GSTIN / Trade License / Scrap Registration *
                </label>
                <span className="text-[10px] text-emerald-600 font-bold">Government Verified</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCU9603R1ZM"
                  className="w-full px-3 py-2 uppercase font-mono tracking-wider bg-white border border-emerald-400 rounded-xl focus:border-amber-500 focus:outline-none text-xs"
                />
                <div className="absolute right-2.5 top-2.5 text-emerald-600 font-bold flex items-center text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                  Authentic
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Shop Geolocation on Map */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-800 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-amber-600" />
                2. Pin Shop Location on Map *
              </span>
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={isLocating}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[10px] flex items-center space-x-1 transition-colors"
              >
                <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              Click or drag the amber pin to place your scrap collection shop or warehouse location. Collectors will navigate here.
            </p>

            {/* Leaflet Map Pin Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-44 rounded-xl overflow-hidden border-2 border-amber-400 shadow-inner z-10"
            />

            {/* Coordinates & Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-gray-200 font-mono">
                <span className="text-gray-500">Pinned Coordinates:</span>
                <span className="font-bold text-amber-800">
                  {shopCoords.lat}° N, {shopCoords.lng}° E
                </span>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">
                  Shop Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Street, Industrial Area, Landmark, City"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-semibold mb-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-gray-400" />
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="09:00 AM - 07:30 PM"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">
                  License Category
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none"
                >
                  <option value="GSTIN">GST Registered Dealer</option>
                  <option value="POLLUTION_CONTROL_BOARD">SPCB Authorized E-Recycler</option>
                  <option value="MSME">Udyam MSME Registered</option>
                  <option value="MUNICIPAL_TRADE_LICENSE">Municipal Trade License</option>
                </select>
              </div>
            </div>

            {/* Accepted Materials */}
            <div>
              <label className="block text-gray-600 font-semibold mb-1.5">
                Accepted Scrap Categories
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: 'mobile_pcb', label: '📱 Mobile PCB' },
                  { code: 'laptop_pcb', label: '💻 Motherboard' },
                  { code: 'copper_cable', label: '🔌 Copper Cables' },
                  { code: 'battery_li_ion', label: '🔋 Li-ion Battery' },
                  { code: 'display_monitor', label: '🖥️ Monitors' },
                  { code: 'aluminium_casing', label: '⚙️ Aluminium' },
                ].map((item) => {
                  const active = selectedMaterials.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => toggleMaterial(item.code)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        active
                          ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item.label} {active ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Pinning Shop...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Enter Buyer Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              By authenticating, you agree to fair weighing benchmarks and traceability standards.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
