export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export type LotStatus =
  | 'COLLECTED'
  | 'LOT_CREATED'
  | 'SYNCED'
  | 'OFFER_RECEIVED'
  | 'HANDOVER'
  | 'RECYCLER_ACCEPTED'
  | 'PAYMENT_RECORDED'
  | 'CANCELLED';

export interface LotItem {
  materialCode: string;
  materialNameEn: string;
  materialNameHi?: string;
  quantity: number;
  weight: number;
  unit: 'kg' | 'g' | 'piece';
  estimatedRate: number;
  estimatedValue: number;
  classificationSource: 'MANUAL' | 'MOCK_AI' | 'FUTURE_AI';
  classificationConfidence?: number;
}

export interface LotImageRecord {
  localBlobKey: string;
  filename?: string;
  storageUrl?: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string; // object URL for instant offline view
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface LotOffer {
  buyerId: string;
  buyerName: string;
  shopName: string;
  offerAmount: number;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface LotRecord {
  clientId: string; // UUID (idempotency key)
  serverId?: string;
  humanReadableId: string; // e.g. KC-2026-8F4A92
  collectorId: string;
  collectorName: string;

  createdAtDevice: string;
  createdAt?: string;
  updatedAt?: string;

  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationName?: string;

  estimatedValue: number;
  totalWeightKg: number;
  totalItemsCount: number;

  status: LotStatus;
  syncStatus: SyncStatus;
  retryCount: number;
  lastSyncAttempt?: string;
  syncError?: string;

  cancellationReason?: string;
  cancelledAt?: string;

  offers?: LotOffer[];
  buyerId?: string;
  buyerName?: string;
  shopName?: string;
  finalPaidAmount?: number;
  paidAt?: string;

  qrReference: string;
  items: LotItem[];
  images: LotImageRecord[];
  notes?: string;
}

export interface MaterialRecord {
  code: string;
  nameEn: string;
  nameHi: string;
  nameMr?: string;
  category: string;
  icon: string;
  defaultUnit: 'kg' | 'g' | 'piece';
  indicativeRate: number;
  descriptionEn: string;
  descriptionHi: string;
}

export interface PriceRecord {
  materialCode: string;
  materialNameEn: string;
  materialNameHi: string;
  rate: number;
  unit: string;
  currency: string;
  sourceLabel: string;
  isDemo: boolean;
  effectiveAt: string;
}

export interface RecyclerRecord {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  acceptedMaterials: string[];
  status: 'ACCEPTING' | 'AT_CAPACITY' | 'TEMPORARILY_CLOSED';
  isDemo: boolean;
  contactPhone: string;
  sourceLabel: string;
  operatingHours: string;
  distanceKm?: number;
}

export interface SafetyAlertRecord {
  alertId: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'HIGH';
  icon: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  dosEn: string[];
  dosHi: string[];
  dontsEn: string[];
  dontsHi: string[];
  voiceTextEn: string;
  voiceTextHi: string;
}

export interface CollectorProfile {
  id?: string;
  collectorId: string;
  name: string;
  phone: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  stats: {
    totalLots: number;
    totalWeightKg: number;
    totalEstimatedValue: number;
  };
  isBanned?: boolean;
  banReason?: string;
  reportCount?: number;
  severityScore?: number;
}

export type UserRole = 'collector' | 'buyer';

export interface BuyerProfile {
  id?: string;
  buyerId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  gstin: string;
  licenseType: string;
  isVerified: boolean;
  shopLatitude: number;
  shopLongitude: number;
  shopAddress: string;
  operatingHours: string;
  acceptedMaterials: string[];
  stats: {
    totalLotsPurchased: number;
    totalWeightKg: number;
    totalAmountPaid: number;
  };
  isBanned: boolean;
  banReason?: string;
  reportCount: number;
  severityScore: number;
}

export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';

export interface ReportRecord {
  reportId?: string;
  reporterType: 'COLLECTOR' | 'BUYER';
  reporterId: string;
  reporterName: string;
  targetType: 'COLLECTOR' | 'BUYER';
  targetId: string;
  targetName: string;
  lotId?: string;
  category: string;
  severity: ReportSeverity;
  severityPoints?: number;
  description: string;
  proofImages: string[];
  status?: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  actionTaken?: string;
  createdAt?: string;
}
