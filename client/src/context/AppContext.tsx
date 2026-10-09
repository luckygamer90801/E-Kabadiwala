import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../db/index.ts';
import { translations, Language } from '../i18n/index.ts';
import { syncEngine, SyncEngineState } from '../services/syncEngine.ts';
import {
  CollectorProfile,
  BuyerProfile,
  MaterialRecord,
  PriceRecord,
  RecyclerRecord,
  SafetyAlertRecord,
  ReportRecord,
  UserRole,
} from '../types/index.ts';

interface AppContextType {
  // i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;

  // Role Management
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;

  // Sync & Network
  syncState: SyncEngineState;
  pendingLotsCount: number;
  syncNow: () => Promise<void>;
  toggleSimulatedOffline: () => Promise<void>;

  // Collector Data
  collector: CollectorProfile;
  isCollectorBanned: boolean;
  collectorBanReason?: string;

  // Buyer Data & Auth
  buyer: BuyerProfile | null;
  isBuyerAuthenticated: boolean;
  isBuyerBanned: boolean;
  buyerBanReason?: string;
  authenticateBuyer: (data: Partial<BuyerProfile>) => Promise<{ success: boolean; error?: string; buyer?: BuyerProfile }>;
  logoutBuyer: () => void;
  updateBuyerProfile: (updates: Partial<BuyerProfile>) => Promise<boolean>;

  // Market & Shared Data
  materials: MaterialRecord[];
  prices: PriceRecord[];
  recyclers: RecyclerRecord[];
  safetyAlerts: SafetyAlertRecord[];
  refreshData: () => Promise<void>;

  // Actions
  cancelLot: (lotId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  submitOffer: (lotId: string, offerAmount: number, note?: string) => Promise<{ success: boolean; error?: string }>;
  purchaseLot: (lotId: string, amount?: number) => Promise<{ success: boolean; error?: string }>;
  fileReport: (report: Partial<ReportRecord>) => Promise<{ success: boolean; targetBanned?: boolean; message?: string; error?: string }>;
  resetUserBan: (userId: string) => Promise<boolean>;
}

const defaultCollector: CollectorProfile = {
  collectorId: 'KC-COL-101',
  name: 'Ramesh Kumar',
  phone: '9876543210',
  preferredLanguage: 'hi',
  stats: {
    totalLots: 0,
    totalWeightKg: 0,
    totalEstimatedValue: 0,
  },
  isBanned: false,
  reportCount: 0,
  severityScore: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('hi');
  const [syncState, setSyncState] = useState<SyncEngineState>(syncEngine.getState());
  const [pendingLotsCount, setPendingLotsCount] = useState<number>(0);
  const [collector, setCollector] = useState<CollectorProfile>(defaultCollector);
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);

  // User Role (collector vs buyer, null triggers the app start modal)
  const [userRole, setUserRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('kabadiwala_user_role');
    return (saved === 'collector' || saved === 'buyer') ? (saved as UserRole) : null;
  });

  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [recyclers, setRecyclers] = useState<RecyclerRecord[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlertRecord[]>([]);

  // 1. Subscribe to Sync Engine
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newState) => {
      setSyncState(newState);
      refreshPendingCount();
    });
    return () => unsubscribe();
  }, []);

  const refreshPendingCount = async () => {
    const count = await syncEngine.getPendingCount();
    setPendingLotsCount(count);
  };

  const setUserRole = (role: UserRole | null) => {
    setUserRoleState(role);
    if (role) {
      localStorage.setItem('kabadiwala_user_role', role);
    } else {
      localStorage.removeItem('kabadiwala_user_role');
    }
  };

  // 2. Load cached data from Dexie & sync with server if reachable
  const refreshData = async () => {
    try {
      // Load from local IndexedDB first
      const cachedMaterials = await db.materialsCache.toArray();
      const cachedPrices = await db.pricesCache.toArray();
      const cachedRecyclers = await db.recyclersCache.toArray();
      const cachedSafety = await db.safetyCache.toArray();
      const cachedProfile = await db.profile.get('KC-COL-101');
      const cachedBuyer = await db.buyerProfile.toCollection().first();

      if (cachedMaterials.length > 0) setMaterials(cachedMaterials);
      if (cachedPrices.length > 0) setPrices(cachedPrices);
      if (cachedRecyclers.length > 0) setRecyclers(cachedRecyclers);
      if (cachedSafety.length > 0) setSafetyAlerts(cachedSafety);
      if (cachedProfile) {
        setCollector(cachedProfile);
        setLanguageState(cachedProfile.preferredLanguage);
      }
      if (cachedBuyer) {
        setBuyer(cachedBuyer);
      }

      await refreshPendingCount();

      // If backend is reachable, fetch and update cache
      const isReachable = await syncEngine.checkBackendReachability();
      if (isReachable) {
        // Fetch materials
        const matRes = await fetch('/api/materials');
        if (matRes.ok) {
          const matData = await matRes.json();
          if (matData.data) {
            setMaterials(matData.data);
            await db.materialsCache.bulkPut(matData.data);
          }
        }

        // Fetch prices
        const priceRes = await fetch('/api/prices');
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          if (priceData.data) {
            setPrices(priceData.data);
            await db.pricesCache.bulkPut(priceData.data);
          }
        }

        // Fetch recyclers
        const recRes = await fetch('/api/recyclers/nearby');
        if (recRes.ok) {
          const recData = await recRes.json();
          if (recData.data) {
            setRecyclers(recData.data);
            await db.recyclersCache.bulkPut(recData.data);
          }
        }

        // Fetch safety
        const safeRes = await fetch('/api/safety');
        if (safeRes.ok) {
          const safeData = await safeRes.json();
          if (safeData.data) {
            setSafetyAlerts(safeData.data);
            await db.safetyCache.bulkPut(safeData.data);
          }
        }

        // Fetch collector profile
        const profRes = await fetch('/api/collector/profile');
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.collector) {
            setCollector(profData.collector);
            await db.profile.put(profData.collector);
          }
        }

        // Fetch buyer profile if stored or logged in
        const storedBuyerId = localStorage.getItem('kabadiwala_buyer_id');
        const buyerRes = await fetch(storedBuyerId ? `/api/buyers/profile?buyerId=${storedBuyerId}` : '/api/buyers/profile');
        if (buyerRes.ok) {
          const buyerData = await buyerRes.json();
          if (buyerData.buyer) {
            setBuyer(buyerData.buyer);
            await db.buyerProfile.put(buyerData.buyer);
          }
        }
      }
    } catch (err) {
      console.warn('[AppContext] Offline or network error while refreshing data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    const updated = { ...collector, preferredLanguage: newLang };
    setCollector(updated);
    await db.profile.put(updated);
    try {
      if (syncState.isBackendReachable) {
        await fetch('/api/collector/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: newLang }),
        });
      }
    } catch {}
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let str = translations[language]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  const syncNow = async () => {
    await syncEngine.syncNow();
    await refreshPendingCount();
    await refreshData();
  };

  const toggleSimulatedOffline = async () => {
    await syncEngine.setSimulatedOffline(!syncState.isSimulatedOffline);
  };

  // Buyer Authentication
  const authenticateBuyer = async (data: Partial<BuyerProfile>): Promise<{ success: boolean; error?: string; buyer?: BuyerProfile }> => {
    try {
      const res = await fetch('/api/buyers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error?.message || 'Authentication failed' };
      }

      setBuyer(json.buyer);
      await db.buyerProfile.put(json.buyer);
      localStorage.setItem('kabadiwala_buyer_id', json.buyer.buyerId);
      localStorage.setItem('kabadiwala_buyer_token', json.token);
      return { success: true, buyer: json.buyer };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during authentication' };
    }
  };

  const logoutBuyer = () => {
    setBuyer(null);
    localStorage.removeItem('kabadiwala_buyer_id');
    localStorage.removeItem('kabadiwala_buyer_token');
    db.buyerProfile.clear();
  };

  const updateBuyerProfile = async (updates: Partial<BuyerProfile>): Promise<boolean> => {
    try {
      if (!buyer) return false;
      const res = await fetch('/api/buyers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: buyer.buyerId, ...updates }),
      });
      if (res.ok) {
        const json = await res.json();
        setBuyer(json.buyer);
        await db.buyerProfile.put(json.buyer);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Cancel Lot
  const cancelLot = async (lotId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Update Dexie local storage immediately
      const existing = await db.lots.get(lotId) || await db.lots.where('humanReadableId').equals(lotId).first();
      if (existing) {
        await db.lots.update(existing.clientId, {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        });
      }

      // 2. If online, notify backend
      if (syncState.isBackendReachable) {
        const res = await fetch(`/api/lots/${lotId}/cancel`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        if (!res.ok) {
          const err = await res.json();
          return { success: false, error: err.error?.message };
        }
      }

      await refreshPendingCount();
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Submit Offer (Buyer action)
  const submitOffer = async (lotId: string, offerAmount: number, note = ''): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!buyer) return { success: false, error: 'Buyer authentication required' };
      if (buyer.isBanned) return { success: false, error: `Account suspended: ${buyer.banReason}` };

      const res = await fetch(`/api/lots/${lotId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: buyer.buyerId,
          offerAmount,
          note,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error?.message || 'Failed to submit offer' };
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Purchase Lot (Buyer action)
  const purchaseLot = async (lotId: string, amount?: number): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!buyer) return { success: false, error: 'Buyer authentication required' };
      if (buyer.isBanned) return { success: false, error: `Account suspended: ${buyer.banReason}` };

      const res = await fetch(`/api/lots/${lotId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: buyer.buyerId,
          paidAmount: amount,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error?.message || 'Failed to purchase lot' };
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // File Report
  const fileReport = async (report: Partial<ReportRecord>): Promise<{ success: boolean; targetBanned?: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error?.message || 'Failed to submit report' };
      }

      // If current user was banned or target was banned, refresh data
      await refreshData();

      return {
        success: true,
        targetBanned: json.targetBanned,
        message: json.message,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Reset User Ban (Testing / Appeal helper)
  const resetUserBan = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reports/reset-ban/${userId}`, { method: 'POST' });
      if (res.ok) {
        await refreshData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        userRole,
        setUserRole,
        syncState,
        pendingLotsCount,
        syncNow,
        toggleSimulatedOffline,
        collector,
        isCollectorBanned: !!collector.isBanned,
        collectorBanReason: collector.banReason,
        buyer,
        isBuyerAuthenticated: !!buyer && buyer.isVerified,
        isBuyerBanned: !!buyer?.isBanned,
        buyerBanReason: buyer?.banReason,
        authenticateBuyer,
        logoutBuyer,
        updateBuyerProfile,
        materials,
        prices,
        recyclers,
        safetyAlerts,
        refreshData,
        cancelLot,
        submitOffer,
        purchaseLot,
        fileReport,
        resetUserBan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
