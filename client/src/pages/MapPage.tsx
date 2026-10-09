import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { RecyclerRecord } from '../types/index.ts';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  CheckCircle2,
  List,
  Map as MapIcon,
  RefreshCw,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal.tsx';

export const MapPage: React.FC = () => {
  const { t, recyclers } = useApp();
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerRecord | null>(null);
  const [reportingRecycler, setReportingRecycler] = useState<RecyclerRecord | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Get current device coordinates
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Demo fallback coordinates (e.g. Mumbai industrial center)
          setUserCoords({ lat: 19.1136, lng: 72.8697 });
        },
        { timeout: 5000 }
      );
    } else {
      setUserCoords({ lat: 19.1136, lng: 72.8697 });
    }
  }, []);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (viewMode !== 'MAP' || !mapContainerRef.current) return;

    const centerLat = userCoords ? userCoords.lat : 19.1136;
    const centerLng = userCoords ? userCoords.lng : 72.8697;

    // Destroy existing map instance if container changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 12);
    mapInstanceRef.current = map;

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Custom Icon for Collector Location (Blue Pin)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.6);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (userCoords) {
      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>📍 Your Current Location</b>');
    }

    // Custom Icons for Recyclers (Green Leaflet)
    const recyclerIcon = L.divIcon({
      className: 'custom-recycler-marker',
      html: `<div style="background-color: #059669; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">♻️</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Add Recycler Markers
    recyclers.forEach((rec) => {
      const marker = L.marker([rec.latitude, rec.longitude], { icon: recyclerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 12px; font-family: sans-serif;">
            <strong style="color: #064e3b; font-size: 13px;">${rec.name}</strong><br/>
            <span style="color: #666;">${rec.address}</span><br/>
            <span style="color: #059669; font-weight: bold; margin-top: 4px; display: inline-block;">● Accepting Collections</span>
          </div>
        `);

      marker.on('click', () => {
        setSelectedRecycler(rec);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, userCoords, recyclers]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header & View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">
            {t('recycler.title')}
          </h2>
          <span className="text-[11px] text-gray-500">
            {recyclers.length} authorized formal centers nearby
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-200 p-0.5 rounded-xl">
          <button
            onClick={() => setViewMode('MAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              viewMode === 'MAP' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{t('recycler.mapView')}</span>
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              viewMode === 'LIST' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{t('recycler.listView')}</span>
          </button>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>{t('recycler.demoNotice')}</span>
      </div>

      {/* MAP VIEW */}
      {viewMode === 'MAP' && (
        <div className="space-y-3">
          <div
            ref={mapContainerRef}
            className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-10"
          />

          {/* Selected or closest recycler card below map */}
          {selectedRecycler && (
            <div className="bg-white p-4 rounded-2xl border-2 border-brand-500 shadow-md animate-fadeIn space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ● Accepting E-Waste
                  </span>
                  <h4 className="font-extrabold text-sm text-gray-900 mt-1">
                    {selectedRecycler.name}
                  </h4>
                  <p className="text-xs text-gray-500">{selectedRecycler.address}</p>
                </div>
                <span className="text-xs font-extrabold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                  {selectedRecycler.distanceKm || 3.4} km
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">
                  🕒 {selectedRecycler.operatingHours}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setReportingRecycler(selectedRecycler)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 rounded-lg font-bold flex items-center space-x-1 transition-colors text-[11px]"
                    title="Report recycler"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span>Report</span>
                  </button>

                  <a
                    href={`tel:${selectedRecycler.contactPhone}`}
                    className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold flex items-center space-x-1"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" />
                    <span>{t('recycler.call')}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {(viewMode === 'LIST' || !selectedRecycler) && (
        <div className="space-y-3">
          {recyclers.map((rec) => (
            <div
              key={rec.id}
              onClick={() => {
                setSelectedRecycler(rec);
                setViewMode('MAP');
              }}
              className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-sm hover:border-brand-500 active:scale-[0.99] transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Authorized Formal Center
                  </span>
                  <h4 className="font-extrabold text-sm text-gray-900 mt-1">
                    {rec.name}
                  </h4>
                  <p className="text-xs text-gray-500">{rec.address}</p>
                </div>
                <span className="text-xs font-black text-brand-800 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-200">
                  {rec.distanceKm || 4.2} km
                </span>
              </div>

              {/* Accepted materials pills */}
              <div className="flex flex-wrap gap-1">
                {rec.acceptedMaterials?.map((mCode) => (
                  <span
                    key={mCode}
                    className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                  >
                    {mCode.replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {rec.operatingHours}
                </span>

                <div className="flex space-x-2">
                  <a
                    href={`tel:${rec.contactPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center"
                    title="Call Center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportingRecycler && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingRecycler(null)}
          targetType="BUYER"
          targetId={reportingRecycler.id}
          targetName={reportingRecycler.name}
        />
      )}
    </div>
  );
};
