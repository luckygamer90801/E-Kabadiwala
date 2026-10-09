import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  LocateFixed,
  Compass,
  ChevronDown,
  Globe,
  ExternalLink,
  ShieldCheck,
  Search,
  X,
  Crosshair,
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal.tsx';
import {
  getLiveGPSCoordinates,
  reverseGeocode,
  generateLocalCentersAroundGPS,
  calculateDistanceKm,
  searchLocation,
  saveLastLocation,
  loadLastLocation,
  POPULAR_LOCATIONS,
  GPSPosition,
  SearchLocationResult,
} from '../services/gpsService.ts';

type LocationSource = 'GPS' | 'NETWORK' | 'IP' | 'SEARCH' | 'MANUAL';

export const MapPage: React.FC = () => {
  const { t, recyclers } = useApp();
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

  // GPS / Location State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const saved = loadLastLocation();
    return saved ? { lat: saved.lat, lng: saved.lng } : null;
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>(() => {
    const saved = loadLastLocation();
    return saved ? saved.address : '';
  });
  const [locationSource, setLocationSource] = useState<LocationSource>('IP');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchLocationResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Recyclers & UI State
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerRecord | null>(null);
  const [reportingRecycler, setReportingRecycler] = useState<RecyclerRecord | null>(null);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const recyclerMarkersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Calculate nearby centers dynamically around the user's coordinates
  const displayRecyclers = useMemo(() => {
    if (!userCoords) return recyclers;
    return generateLocalCentersAroundGPS(userCoords.lat, userCoords.lng, recyclers);
  }, [userCoords, recyclers]);

  // Set the closest recycler as initially selected once available
  useEffect(() => {
    if (displayRecyclers.length > 0) {
      setSelectedRecycler(displayRecyclers[0]);
    }
  }, [displayRecyclers]);

  // Update position and reverse geocode
  const setCoordinatesWithGeocoding = async (
    lat: number,
    lng: number,
    accuracy: number | null,
    source: LocationSource,
    presetAddress?: string
  ) => {
    setUserCoords({ lat, lng });
    setGpsAccuracy(accuracy);
    setLocationSource(source);

    if (presetAddress) {
      setGpsAddress(presetAddress);
      saveLastLocation(lat, lng, presetAddress);
    } else {
      try {
        const addr = await reverseGeocode(lat, lng);
        setGpsAddress(addr);
        saveLastLocation(lat, lng, addr);
      } catch {
        const fallback = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        setGpsAddress(fallback);
        saveLastLocation(lat, lng, fallback);
      }
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  // Request Live GPS / IP Coordinates
  const fetchLiveGPS = async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const pos: GPSPosition = await getLiveGPSCoordinates();
      let src: LocationSource = 'GPS';
      if (pos.source === 'IP_GEOLOCATION') src = 'IP';
      else if (pos.source === 'BROWSER_NETWORK') src = 'NETWORK';
      else if (pos.source === 'MANUAL_PRESET') src = 'MANUAL';

      await setCoordinatesWithGeocoding(
        pos.lat,
        pos.lng,
        pos.accuracy || 20,
        src,
        pos.address
      );
    } catch (err: any) {
      console.warn('GPS location attempt error:', err.message);
      setLocationError(err.message || 'Unable to retrieve location.');
      // Default to Gurugram if nothing available
      if (!userCoords) {
        const fallback = POPULAR_LOCATIONS[0];
        await setCoordinatesWithGeocoding(fallback.lat, fallback.lng, 500, 'MANUAL', fallback.name);
      }
    } finally {
      setIsLocating(false);
    }
  };

  // Perform Location Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);

      if (results.length === 1) {
        // Direct jump if only 1 match
        selectSearchResult(results[0]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: SearchLocationResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setCoordinatesWithGeocoding(item.lat, item.lng, 100, 'SEARCH', item.displayName.split(',')[0]);
  };

  // Auto-acquire GPS on initial component mount if not loaded
  useEffect(() => {
    fetchLiveGPS();
  }, []);

  // Initialize or re-render Leaflet Map
  useEffect(() => {
    if (viewMode !== 'MAP' || !mapContainerRef.current) return;

    const centerLat = userCoords ? userCoords.lat : 28.4601;
    const centerLng = userCoords ? userCoords.lng : 77.0263;

    // Reset old instance if needed
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    // Add zoom controls
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | E-Kabadiwala GPS',
      maxZoom: 19,
    }).addTo(map);

    // Enable clicking on map to place / move user location
    map.on('click', (e: L.LeafletMouseEvent) => {
      setCoordinatesWithGeocoding(
        Number(e.latlng.lat.toFixed(5)),
        Number(e.latlng.lng.toFixed(5)),
        30,
        'MANUAL'
      );
    });

    // Draw User Location with Animated Radar Marker
    if (userCoords) {
      const userRadarIcon = L.divIcon({
        className: 'gps-user-marker',
        html: `
          <div class="gps-pulse-ring"></div>
          <div class="gps-center-dot"></div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      // Draggable marker so user can drag to their exact pinpoint!
      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: userRadarIcon,
        draggable: true,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
            <strong style="color: #2563eb; font-size: 13px;">📍 Your Location</strong><br/>
            <span style="color: #4b5563; font-size: 11px;">${gpsAddress || 'Active Pin'}</span><br/>
            <span style="color: #059669; font-weight: bold; font-size: 10px;">Drag pin to fine-tune</span>
          </div>
        `);

      userMarker.on('dragend', (e: any) => {
        const newPos = e.target.getLatLng();
        setCoordinatesWithGeocoding(
          Number(newPos.lat.toFixed(5)),
          Number(newPos.lng.toFixed(5)),
          25,
          'MANUAL'
        );
      });

      userMarkerRef.current = userMarker;

      // Add accuracy radius circle
      if (gpsAccuracy && gpsAccuracy < 1200) {
        accuracyCircleRef.current = L.circle([userCoords.lat, userCoords.lng], {
          radius: Math.max(gpsAccuracy, 40),
          color: '#2563eb',
          weight: 1,
          opacity: 0.6,
          fillColor: '#60a5fa',
          fillOpacity: 0.12,
        }).addTo(map);
      }
    }

    // Add Recycler Markers
    recyclerMarkersRef.current = [];
    displayRecyclers.forEach((rec) => {
      const isSelected = selectedRecycler?.id === rec.id;
      const markerColor = isSelected ? '#15803d' : '#059669';

      const recyclerIcon = L.divIcon({
        className: 'custom-recycler-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          ">
            ♻️
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([rec.latitude, rec.longitude], { icon: recyclerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 12px; font-family: sans-serif; min-width: 170px;">
            <strong style="color: #064e3b; font-size: 13px;">${rec.name}</strong><br/>
            <span style="color: #6b7280; font-size: 11px;">${rec.address}</span><br/>
            <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #047857; font-weight: 700; font-size: 11px;">● Accepting</span>
              <span style="background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 10px;">
                ${rec.distanceKm} km away
              </span>
            </div>
          </div>
        `);

      marker.on('click', () => {
        setSelectedRecycler(rec);
      });

      recyclerMarkersRef.current.push(marker);
    });

    // Draw route line if a recycler is selected and userCoords exist
    if (userCoords && selectedRecycler) {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
      }
      routeLineRef.current = L.polyline(
        [
          [userCoords.lat, userCoords.lng],
          [selectedRecycler.latitude, selectedRecycler.longitude],
        ],
        {
          color: '#059669',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
          lineCap: 'round',
        }
      ).addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, userCoords, displayRecyclers, selectedRecycler?.id]);

  // Center map on user location
  const handleRecenterOnUser = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15, {
        animate: true,
        duration: 1,
      });
    } else {
      fetchLiveGPS();
    }
  };

  // Fit map bounds to encompass user and closest recyclers
  const handleFitAll = () => {
    if (!mapInstanceRef.current || !userCoords) return;
    const points: [number, number][] = [[userCoords.lat, userCoords.lng]];
    displayRecyclers.slice(0, 3).forEach((r) => {
      points.push([r.latitude, r.longitude]);
    });
    mapInstanceRef.current.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Real-time GPS & Location Header Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status info */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  locationSource === 'GPS'
                    ? 'bg-emerald-400 animate-pulse'
                    : locationSource === 'IP'
                    ? 'bg-cyan-400'
                    : locationSource === 'SEARCH'
                    ? 'bg-indigo-400'
                    : 'bg-amber-400'
                }`}
              />
              <div
                className={`absolute inset-0 w-3.5 h-3.5 rounded-full ${
                  locationSource === 'GPS' ? 'bg-emerald-400/40 animate-ping' : 'bg-transparent'
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-black tracking-wide uppercase">
                  {locationSource === 'GPS' && '🛰️ Hardware GPS Locked'}
                  {locationSource === 'NETWORK' && '📶 Wi-Fi / Browser Location'}
                  {locationSource === 'IP' && '🌐 Network Auto-Detected (Real Location)'}
                  {locationSource === 'SEARCH' && '🔍 Custom Searched Area'}
                  {locationSource === 'MANUAL' && '📍 Pin Placed on Map'}
                </span>
                {gpsAccuracy && (
                  <span className="bg-emerald-800/90 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-600/70">
                    {locationSource === 'IP' ? 'City Precision' : `±${gpsAccuracy}m`}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 font-medium truncate max-w-sm sm:max-w-md mt-0.5">
                {gpsAddress ||
                  (userCoords
                    ? `${userCoords.lat.toFixed(4)}°N, ${userCoords.lng.toFixed(4)}°E`
                    : 'Locating...')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
            {/* Locate Me Button */}
            <button
              onClick={fetchLiveGPS}
              disabled={isLocating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm border border-emerald-500/50"
              title="Detect my current live location"
            >
              <LocateFixed
                className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-200' : ''}`}
              />
              <span>{isLocating ? 'Detecting...' : 'Detect GPS'}</span>
            </button>
          </div>
        </div>

        {/* Live Search & Quick City Pills */}
        <div className="mt-3 pt-3 border-t border-emerald-800/60 space-y-2.5">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your area, city, sector, or pin code (e.g. Gurugram, Rohini, Connaught Place)..."
                className="w-full pl-9 pr-8 py-2 bg-emerald-950/70 text-white placeholder-emerald-300/60 text-xs rounded-xl border border-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="ml-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
            >
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Autocomplete / Search Results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 z-50">
              <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span>Select Your Location</span>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold truncate pr-2">{item.displayName}</span>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                    {item.lat.toFixed(2)}, {item.lng.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Popular City Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-emerald-300 font-bold flex-shrink-0 mr-1 flex items-center">
              <MapPin className="w-3 h-3 mr-0.5" />
              Quick:
            </span>
            {POPULAR_LOCATIONS.slice(0, 6).map((city) => (
              <button
                key={city.name}
                onClick={() =>
                  setCoordinatesWithGeocoding(city.lat, city.lng, 50, 'MANUAL', city.name)
                }
                className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 rounded-lg flex-shrink-0 font-medium border border-emerald-700/50 transition-all hover:scale-105 active:scale-95"
              >
                {city.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Helper Pin Tip */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Interactive Map:</strong> Tap anywhere on the map or drag the blue marker to pinpoint your exact shop or house location.
          </span>
        </div>
      </div>

      {/* Header & View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">
            {t('recycler.title')}
          </h2>
          <span className="text-[11px] text-gray-500 font-medium">
            Found {displayRecyclers.length} authorized formal centers near your location
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

      {/* MAP VIEW */}
      {viewMode === 'MAP' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-3 relative">
            {/* Map Container */}
            <div className="relative">
              <div
                ref={mapContainerRef}
                className="w-full h-80 sm:h-96 lg:h-[530px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-10"
              />

              {/* Floating Quick Map Controls on Bottom Right */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
                <button
                  onClick={handleRecenterOnUser}
                  className="p-2.5 bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 rounded-xl shadow-lg border border-gray-200 transition-transform active:scale-90 flex items-center justify-center"
                  title="Center on my location"
                >
                  <LocateFixed className="w-5 h-5 text-emerald-600" />
                </button>
                <button
                  onClick={handleFitAll}
                  className="p-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-lg border border-gray-200 transition-transform active:scale-90 flex items-center justify-center text-xs font-bold"
                  title="Fit all nearby facilities in frame"
                >
                  <Compass className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Route distance indicator badge overlay on map */}
              {selectedRecycler && userCoords && (
                <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center space-x-2 text-xs font-bold text-gray-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Route Distance:</span>
                  <span className="text-emerald-700 font-extrabold font-mono">
                    {selectedRecycler.distanceKm ||
                      calculateDistanceKm(
                        userCoords.lat,
                        userCoords.lng,
                        selectedRecycler.latitude,
                        selectedRecycler.longitude
                      )}{' '}
                    km
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            {/* Selected recycler card with direct GPS Navigation */}
            {selectedRecycler ? (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-600 shadow-md animate-fadeIn space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-700 mr-1" />
                      CPCB Authorized Formal Center
                    </span>
                    <h4 className="font-extrabold text-base text-gray-900 mt-1.5 leading-snug">
                      {selectedRecycler.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">{selectedRecycler.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-mono inline-block">
                      {selectedRecycler.distanceKm || 2.4} km
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-0.5 font-medium">
                      from your pin
                    </span>
                  </div>
                </div>

                {/* Accepted Waste Materials */}
                {selectedRecycler.acceptedMaterials && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Accepted E-Waste Streams:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecycler.acceptedMaterials.map((mCode) => (
                        <span
                          key={mCode}
                          className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                        >
                          {mCode.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operating hours & phone info */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {selectedRecycler.operatingHours || '08:30 AM - 07:00 PM'}
                  </span>
                  <button
                    onClick={() => setReportingRecycler(selectedRecycler)}
                    className="text-gray-500 hover:text-red-600 flex items-center space-x-1 text-[11px] font-bold"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>Report Facility</span>
                  </button>
                </div>

                {/* Turn-by-Turn GPS Navigation CTA Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={
                      userCoords
                        ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedRecycler.latitude},${selectedRecycler.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${selectedRecycler.latitude},${selectedRecycler.longitude}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm text-xs"
                  >
                    <Navigation className="w-4 h-4 text-emerald-100" />
                    <span>Start GPS Navigation</span>
                    <ExternalLink className="w-3 h-3 text-emerald-200" />
                  </a>

                  <a
                    href={`tel:${selectedRecycler.contactPhone}`}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all text-xs border border-gray-200"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" />
                    <span>{t('recycler.call')}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <span className="font-bold block">💡 Live Map Active</span>
                <p className="text-[11px] text-emerald-800">
                  Tap any green recycling icon on the map to review distances, calculate real-time road directions, and start GPS turn-by-turn navigation.
                </p>
              </div>
            )}

            {/* Quick list of nearest centers sorted by real distance */}
            <div className="space-y-2 hidden lg:block">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  Nearest Centers from Your Location
                </h4>
                <span className="text-[10px] text-gray-400 font-semibold">Sorted by Proximity</span>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {displayRecyclers.map((rec) => {
                  const isSelected = selectedRecycler?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecycler(rec);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([rec.latitude, rec.longitude], 14, {
                            animate: true,
                            duration: 0.8,
                          });
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 truncate pr-2">{rec.name}</span>
                        <span className="font-mono text-[10px] text-emerald-800 font-black bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          {rec.distanceKm} km
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{rec.address}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'LIST' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayRecyclers.map((rec) => (
            <div
              key={rec.id}
              onClick={() => {
                setSelectedRecycler(rec);
                setViewMode('MAP');
              }}
              className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-sm hover:border-emerald-500 active:scale-[0.99] transition-all cursor-pointer space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      CPCB Formal Center
                    </span>
                    <h4 className="font-extrabold text-sm text-gray-900 mt-1">
                      {rec.name}
                    </h4>
                    <p className="text-xs text-gray-500">{rec.address}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-mono">
                    {rec.distanceKm} km
                  </span>
                </div>

                {/* Accepted materials pills */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {rec.acceptedMaterials?.map((mCode) => (
                    <span
                      key={mCode}
                      className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                    >
                      {mCode.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs mt-3">
                <span className="text-gray-500 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {rec.operatingHours || '08:30 AM - 07:00 PM'}
                </span>

                <div className="flex items-center space-x-1.5">
                  <a
                    href={
                      userCoords
                        ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${rec.latitude},${rec.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${rec.latitude},${rec.longitude}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center"
                    title="Start Navigation"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </a>

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
