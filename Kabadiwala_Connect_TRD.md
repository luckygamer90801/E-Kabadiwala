# Technical Requirements Document (TRD)
## Kabadiwala Connect — SIH26229

**Document Version:** 1.0  
**Status:** Prototype / SIH 2026  
**Architecture:** Mobile-first PWA + Offline Local Database + REST Backend  
**Primary Scope:** Collector-side application  
**Design Priority:** Offline reliability > data integrity > simple UX > traceability > map > pricing > safety > visual polish

---

## 1. Technical Objective

Build a production-shaped collector-side prototype that can operate on a low-end Android phone, continue working without internet, persist data locally, and synchronize reliably with a backend when connectivity returns.

The implementation must not be a static mockup. The most important technical proof is:

```text
Local Database
    ↓
Offline Queue
    ↓
Connectivity Restored
    ↓
Sync Engine
    ↓
Backend
    ↓
Acknowledgement
    ↓
Local Record = SYNCED
```

The supplied specification explicitly requires this to be a genuine local-to-server synchronization process rather than a visual simulation. fileciteturn0file0L1018-L1066

---

## 2. Recommended Architecture

### Frontend

Recommended:

- React;
- TypeScript;
- Vite or Next.js;
- Tailwind CSS.

Use the existing project framework if one already exists. Do not replace functioning infrastructure unnecessarily. fileciteturn0file0L1784-L1803

### Local persistence

- IndexedDB;
- Dexie.js or equivalent IndexedDB abstraction.

### Backend

Either:

- Node.js + Express; or
- FastAPI.

Choose based on the existing repository and team familiarity.

### Database

Preferred:

- PostgreSQL.

Acceptable for local development:

- SQLite.

Schema should remain compatible with a future PostgreSQL/PostGIS deployment.

### Maps

- Leaflet;
- OpenStreetMap.

### QR

Use a reliable QR-generation library.

### Images

Use:

- browser/device camera API;
- gallery/file input;
- client-side image compression.

---

## 3. High-Level System Architecture

```text
┌──────────────────────────────────────────────┐
│              Mobile PWA                     │
│                                              │
│  React UI                                    │
│     │                                        │
│     ├── Auth                                 │
│     ├── Collection workflow                  │
│     ├── Lot/QR                               │
│     ├── History                              │
│     ├── Map                                  │
│     ├── Pricing                              │
│     ├── Safety                               │
│     └── Profile                              │
│                                              │
│  Service Worker                              │
│  IndexedDB / Dexie                           │
│  Sync Queue                                  │
└───────────────┬──────────────────────────────┘
                │ HTTPS
                ▼
┌──────────────────────────────────────────────┐
│              REST API                        │
│                                              │
│ Auth | Collectors | Lots | Images            │
│ Materials | Prices | Recyclers | Safety      │
│ Sync | Health                                │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│             PostgreSQL                       │
│                                              │
│ Collectors                                   │
│ Materials                                    │
│ Prices                                       │
│ Lots                                         │
│ LotItems                                     │
│ LotImages                                    │
│ Recyclers                                    │
│ Locations                                    │
│ SyncEvents                                   │
│ SafetyAlerts                                 │
└──────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

Recommended logical modules:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── cards/
│   └── status/
├── features/
│   ├── auth/
│   ├── collector/
│   ├── collections/
│   ├── lots/
│   ├── sync/
│   ├── map/
│   ├── pricing/
│   ├── safety/
│   ├── profile/
│   └── i18n/
├── services/
│   ├── api/
│   ├── camera/
│   ├── location/
│   ├── storage/
│   └── ai/
├── db/
│   ├── schema/
│   └── repositories/
├── hooks/
├── types/
└── utils/
```

This is a logical structure rather than a requirement to restructure an existing repository.

---

## 5. PWA Requirements

Implement:

- Web App Manifest;
- service worker;
- cached application shell;
- offline route access;
- static asset caching;
- IndexedDB persistence;
- installability.

The application should open even when the device has no internet.

### Service-worker responsibility

The service worker should primarily handle:

- application shell caching;
- static resources;
- appropriate cache invalidation/versioning.

Do not treat the service worker as the primary database. Application data belongs in IndexedDB.

---

## 6. Local Database Design

Use IndexedDB through Dexie or an equivalent abstraction.

Suggested tables:

```text
collectors
collections
lots
lotItems
lotImages
materials
prices
recyclers
safetyAlerts
syncQueue
settings
```

### Common local synchronization fields

Every syncable entity should support:

```typescript
interface SyncMetadata {
  localId: string;
  serverId?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retryCount: number;
  lastSyncAttempt?: string;
  syncError?: string;
}
```

---

## 7. Lot Data Model

### Lot

```typescript
interface Lot {
  localId: string;
  serverId?: string;
  clientId: string;
  collectorId: string;

  humanReadableId: string;

  createdAt: string;
  updatedAt: string;

  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;

  estimatedValue: number;

  status: LotStatus;
  syncStatus: SyncStatus;

  qrReference: string;

  items: LotItem[];
}
```

### LotItem

```typescript
interface LotItem {
  localId: string;
  lotId: string;
  materialId: string;

  quantity?: number;
  weight?: number;
  unit: "kg" | "g" | "piece";

  estimatedRate?: number;
  estimatedValue?: number;

  classificationSource:
    | "MANUAL"
    | "MOCK_AI"
    | "FUTURE_AI";

  classificationConfidence?: number;
}
```

### LotImage

```typescript
interface LotImage {
  localId: string;
  lotId: string;

  localBlobKey: string;
  serverId?: string;
  storageUrl?: string;

  mimeType: string;
  sizeBytes: number;

  createdAt: string;

  syncStatus: SyncStatus;
}
```

---

## 8. Server Database Model

Required entities:

```text
Collector
Material
Price
Lot
LotItem
LotImage
Recycler
Location
SyncEvent
SafetyAlert
```

The supplied specification explicitly identifies these entities as the approximate database model. fileciteturn0file0L1158-L1205

### Suggested relational structure

```text
Collector
  1 ─────── N Lot

Lot
  1 ─────── N LotItem

Lot
  1 ─────── N LotImage

Material
  1 ─────── N LotItem

Material
  1 ─────── N Price

Recycler
  1 ─────── 1+ Location

Lot
  1 ─────── N SyncEvent
```

---

## 9. PostgreSQL Schema Considerations

### collectors

```text
id UUID PRIMARY KEY
name VARCHAR
phone VARCHAR UNIQUE
preferred_language VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

### materials

```text
id UUID PRIMARY KEY
name VARCHAR
category VARCHAR
unit VARCHAR
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

### prices

```text
id UUID PRIMARY KEY
material_id UUID REFERENCES materials(id)
rate NUMERIC
currency VARCHAR
unit VARCHAR
source_label VARCHAR
effective_at TIMESTAMP
created_at TIMESTAMP
```

### lots

```text
id UUID PRIMARY KEY
client_id UUID UNIQUE NOT NULL
human_readable_id VARCHAR UNIQUE NOT NULL
collector_id UUID REFERENCES collectors(id)

created_at TIMESTAMP
updated_at TIMESTAMP

latitude NUMERIC
longitude NUMERIC
location_accuracy NUMERIC

status VARCHAR
estimated_value NUMERIC
qr_reference VARCHAR UNIQUE

created_at_device TIMESTAMP
```

`client_id` must have a uniqueness constraint to support idempotent synchronization.

### lot_items

```text
id UUID PRIMARY KEY
lot_id UUID REFERENCES lots(id)
material_id UUID REFERENCES materials(id)

quantity NUMERIC
weight NUMERIC
unit VARCHAR

estimated_rate NUMERIC
estimated_value NUMERIC

classification_source VARCHAR
classification_confidence NUMERIC
```

### lot_images

```text
id UUID PRIMARY KEY
lot_id UUID REFERENCES lots(id)

storage_url TEXT
mime_type VARCHAR
size_bytes INTEGER
created_at TIMESTAMP
```

### sync_events

```text
id UUID PRIMARY KEY
lot_id UUID
event_type VARCHAR
attempt_number INTEGER
status VARCHAR
error_message TEXT
created_at TIMESTAMP
```

---

## 10. Authentication Architecture

Prototype flow:

```text
Phone Number
    ↓
OTP Request
    ↓
OTP Verification
    ↓
Access Token / Session
    ↓
Collector Profile
```

If SMS infrastructure is unavailable:

- implement clearly labeled DEMO OTP;
- isolate authentication behind an auth service;
- keep the API contract compatible with future real OTP.

Never expose secrets in frontend code.

---

## 11. API Design

Suggested REST endpoints:

```http
POST   /auth/login
GET    /collector/profile

GET    /materials
GET    /prices

POST   /lots
GET    /lots
GET    /lots/{id}

POST   /lots/{id}/images

POST   /sync

GET    /recyclers/nearby
GET    /recyclers/{id}

GET    /safety

GET    /health
```

The endpoint structure may be refined to match the existing framework. The supplied specification provides this API shape as a baseline. fileciteturn0file0L1124-L1154

---

## 12. Idempotent Lot Creation

This is a critical requirement.

### Client

Generate:

```text
clientId = UUID
```

The same `clientId` must be reused across all retries.

### Server

On:

```http
POST /lots
Idempotency-Key: <clientId>
```

the backend should:

1. check whether the client ID already exists;
2. return the existing lot if it does;
3. create a lot if it does not;
4. persist the client ID atomically.

This prevents duplicate lots when the same offline record is uploaded multiple times.

---

## 13. Offline Synchronization Engine

### State machine

```text
PENDING
   │
   ▼
SYNCING
   │
   ├───────────────► SYNCED
   │
   └───────────────► FAILED
                         │
                         ▼
                    RETRY / SYNC NOW
                         │
                         ▼
                      SYNCING
```

### Sync algorithm

```text
1. Detect possible connectivity.
2. Verify backend reachability.
3. Load pending queue.
4. Order records deterministically.
5. Mark record SYNCING.
6. Upload lot metadata.
7. Receive server acknowledgement.
8. Upload associated images.
9. Verify image acknowledgements.
10. Mark local record SYNCED.
11. Record sync event.
12. Move to next pending record.
```

The exact implementation can optimize uploads, but data must not be marked fully synced before required server acknowledgements are received.

---

## 14. Connectivity Detection

Use browser connectivity events as triggers, but do not treat `navigator.onLine` as proof that the backend is reachable.

Required states:

```text
ONLINE
OFFLINE
BACKEND_UNAVAILABLE
SYNCING
SYNC_ERROR
```

A backend health request should be used before starting a synchronization batch.

---

## 15. Retry Strategy

For failed synchronization:

- preserve local record;
- increment retry count;
- store error;
- return record to pending/failed state;
- retry with exponential backoff;
- provide manual Sync Now.

Example backoff:

```text
1st retry: 2s
2nd:       5s
3rd:       15s
4th:       30s
5th+:      capped delay
```

Exact timing may be tuned for the prototype.

---

## 16. Offline Image Architecture

Images must not depend on network access during capture.

### Capture pipeline

```text
Camera/Gallery
      ↓
Decode
      ↓
Resize/Compress
      ↓
IndexedDB Blob
      ↓
LotImage.localBlobKey
      ↓
Pending Sync
      ↓
Multipart Upload
      ↓
Server/Object Storage
      ↓
storageUrl
      ↓
Image SYNCED
```

Requirements:

- limit image dimensions;
- compress JPEG/WebP where appropriate;
- validate MIME type;
- enforce maximum size;
- retain local thumbnail;
- release unnecessary object URLs;
- handle storage quota failures.

---

## 17. Camera Implementation

Use standard browser APIs where supported:

```text
<input type="file" accept="image/*" capture="environment">
```

or an equivalent camera component.

Support:

- camera capture;
- gallery selection;
- multiple images;
- permission failure;
- cancellation;
- large images.

Do not make image upload blocking when offline.

---

## 18. Geolocation Architecture

Use:

```text
navigator.geolocation
```

Capture:

```text
latitude
longitude
accuracy
timestamp
```

Suggested strategy:

- capture when opening map;
- capture when creating a lot;
- optionally refresh while map is open;
- never continuously track in the background.

The application must continue if location permission is denied or no location is available. fileciteturn0file0L882-L900

---

## 19. Map Architecture

Use:

```text
Leaflet
+
OpenStreetMap
```

Map layers:

```text
Collector Location
Recycler Markers
Collection/Hubs
```

Do not use turn-by-turn navigation.

Recycler data should include a demo/verified classification field so UI labels cannot accidentally present demo records as officially authorized.

---

## 20. QR Architecture

QR payload should contain either:

```text
KC-2026-8F4A92
```

or preferably a secure verification reference:

```text
https://<future-domain>/verify/<secure-token>
```

The final implementation should avoid embedding:

- phone number;
- exact unnecessary personal details;
- raw internal database credentials;
- sensitive information.

The future recycler application should be able to scan the QR and retrieve the associated lot.

---

## 21. Pricing Service

Do not hardcode rates into React components.

Use:

```http
GET /prices
```

Response concept:

```json
{
  "materialId": "uuid",
  "material": "Mobile PCB",
  "rate": 123,
  "unit": "kg",
  "currency": "INR",
  "label": "Indicative benchmark",
  "lastUpdated": "2026-..."
}
```

### Value calculation

```text
estimatedValue = weight × applicableRate
```

The backend should be authoritative for rates. Client calculations are for immediate UX and must not be treated as trusted transaction values.

---

## 22. Safety Module

### Data-driven safety cards

Safety information should be represented as data rather than hard-coded UI.

Example:

```typescript
interface SafetyAlert {
  id: string;
  materialCategory: string;
  severity: "INFO" | "WARNING" | "HIGH";
  titleKey: string;
  bodyKey: string;
  voiceKey?: string;
}
```

Initial rules should cover:

- swollen/damaged batteries;
- CRTs;
- exposed electrical components;
- chemical contamination;
- broken components;
- cables/wires;
- sharp components.

---

## 23. AI Abstraction Layer

Create interfaces now even if production AI is not implemented.

```typescript
interface WasteClassifier {
  classifyWaste(image: Blob): Promise<ClassificationResult>;
}

interface HazardDetector {
  detectHazard(image: Blob): Promise<HazardResult>;
}

interface VoiceService {
  speakSafetyAlert(alertId: string, language: string): Promise<void>;
}

interface RecyclerRecommendationService {
  findBestRecycler(
    location: Location,
    material: string,
    quantity: number
  ): Promise<RecyclerRecommendation[]>;
}
```

Initial implementations can be:

```text
ManualClassifier
MockClassifier
RuleBasedHazardDetector
BrowserSpeechVoiceService
MockRecyclerRecommendationService
```

Later implementations can use lightweight on-device models or other services without changing UI contracts.

---

## 24. Internationalization

Do not hard-code user-facing strings.

Use translation keys:

```text
home.addCollection
home.myCollections
home.findRecycler
home.safety
collection.takePhoto
collection.chooseGallery
collection.createLot
sync.pending
sync.synced
sync.failed
```

Languages:

```text
en
hi
mr (future)
```

Language selection belongs in Profile/Settings.

---

## 25. State Management

Use a lightweight state-management approach appropriate to the existing application.

Separate:

### Server state

- collector profile;
- prices;
- materials;
- recycler data;
- safety data.

### Local/offline state

- draft collection;
- local lots;
- image blobs;
- sync queue;
- sync status.

Avoid storing the entire server database in global client state.

---

## 26. Error Model

Use structured API errors.

Example:

```json
{
  "error": {
    "code": "LOT_VALIDATION_FAILED",
    "message": "Lot data is invalid.",
    "details": {
      "weight": "Weight must be greater than zero."
    }
  }
}
```

Frontend should map known errors to simple user-facing messages.

Never display raw stack traces to collectors.

---

## 27. Security Requirements

Even for a prototype:

### API security

- authenticate requests;
- authorize collector access;
- validate all input;
- use HTTPS outside local development;
- rate-limit sensitive endpoints where appropriate.

### Lot integrity

- do not trust client-generated collector IDs;
- do not trust client-side prices;
- enforce server ownership checks;
- enforce unique client IDs.

### File security

- validate MIME type;
- enforce maximum size;
- sanitize filenames;
- do not execute uploaded content;
- store uploads outside executable paths.

### Secrets

- environment variables only;
- never expose database credentials;
- never place private API keys in frontend source;
- use `.env` locally and secure deployment secrets in production.

These requirements directly reflect the supplied security specification. fileciteturn0file0L1209-L1225

---

## 28. Privacy Requirements

Minimize PII.

Required principles:

- collect only what is needed;
- mask phone numbers in UI where appropriate;
- avoid unnecessary exact location exposure;
- do not put personal data in QR payloads;
- do not expose database identifiers unnecessarily;
- future recycler APIs should return only operationally necessary location information.

---

## 29. Performance Requirements

Target:

- low-end Android;
- limited RAM;
- slow CPU;
- slow network;
- intermittent network;
- limited storage.

Technical strategies:

- code splitting;
- lazy routes;
- compressed images;
- cached static assets;
- pagination;
- lightweight icons;
- limited animations;
- no continuous GPS;
- no continuously running AI;
- avoid large dependency bundles.

The supplied specification explicitly calls for these optimizations. fileciteturn0file0L1228-L1253

---

## 30. Observability and Debug Screen

Create a development-only synchronization debug screen.

Show:

```text
Network status
Backend status
Pending records
Last sync
Failed records
Retry count
Local DB status
```

This screen should not be exposed in normal collector navigation.

It should be useful for:

- SIH testing;
- diagnosing sync failures;
- checking persistence;
- validating offline demonstrations.

---

## 31. Demo Data

Seed:

- materials;
- indicative prices;
- demo recyclers;
- demo collection history.

Every demo record should be distinguishable from official/verified data.

Suggested fields:

```text
isDemo
verificationStatus
sourceLabel
```

UI examples:

```text
Prototype data
Demo benchmark
Demo recycler
```

Never label a fabricated organization as an authorized recycler. fileciteturn0file0L1277-L1297

---

## 32. Routing

Suggested routes:

```text
/login
/home
/collections
/collections/:id
/add
/lot/:id
/map
/prices
/safety
/profile
/settings
/debug/sync
```

`/debug/sync` must be development/demo protected.

---

## 33. UI Technical Requirements

The UI must be mobile-first.

### Touch targets

Prefer large controls suitable for outdoor use and one-handed interaction.

### Status

Always combine:

- icon;
- text;
- optional color.

Example:

```text
✓ Synced
⏳ Pending
⚠ Failed
```

### Forms

Keep fields minimal.

Prefer:

```text
Visual material card
+
Numeric weight field
+
Quantity
```

over large text forms.

---

## 34. Testing Strategy

### Unit tests

Test:

- value calculation;
- lot ID generation;
- UUID handling;
- sync-state transitions;
- retry calculation;
- translation key resolution;
- price mapping;
- validation.

### Integration tests

Test:

- API authentication;
- lot creation;
- idempotent retry;
- image upload;
- price retrieval;
- recycler retrieval;
- safety retrieval.

### Offline tests

Mandatory:

- airplane mode;
- browser restart;
- app restart;
- multiple offline collections;
- offline image persistence.

### Sync tests

Mandatory:

- one pending record;
- multiple pending records;
- failed upload;
- retry;
- duplicate request;
- backend unavailable;
- internet restoration.

### Location tests

- permission granted;
- permission denied;
- inaccurate GPS;
- unavailable location.

### Camera tests

- permission granted;
- permission denied;
- large image;
- multiple images.

### Storage tests

- refresh;
- close browser;
- reopen;
- storage quota failure.

### Language tests

- English;
- Hindi.

The test categories mirror the supplied acceptance requirements. fileciteturn0file0L1669-L1716

---

## 35. Critical End-to-End Test

### Test: offline-to-online lot synchronization

#### Preconditions

- app installed/open;
- authenticated collector;
- backend available;
- at least one demo material and price exists.

#### Steps

1. Open Home.
2. Create Collection A online.
3. Capture photo.
4. Select material.
5. Enter weight.
6. Capture location if available.
7. Create Lot A.
8. Verify Lot A exists locally and on server.
9. Disable internet/enable airplane mode.
10. Create Collection B.
11. Capture photo.
12. Select material.
13. Enter weight.
14. Create Lot B.
15. Verify B is PENDING.
16. Close/reopen app.
17. Verify B still exists.
18. Restore internet.
19. Verify backend reachability.
20. Sync begins.
21. Verify image/data upload.
22. Verify server acknowledgement.
23. Verify local status becomes SYNCED.
24. Refresh history.
25. Open Lot B.
26. Verify photo, material, weight, value, location/timestamp, QR, and status.

#### Expected result

No data is lost, no duplicate lot is created, and the exact offline-created record reaches the backend after connectivity returns.

This scenario is the primary technical proof of the prototype. fileciteturn0file0L1512-L1589

---

## 36. Build Order

### Phase 1 — Foundation

- inspect repository;
- identify existing framework;
- routing;
- UI system;
- database;
- backend;
- authentication;
- PWA shell.

### Phase 2 — Collector Core

- home;
- add collection;
- camera;
- material selection;
- weight;
- lot creation.

### Phase 3 — Offline First

- IndexedDB;
- local persistence;
- queue;
- sync engine;
- retry;
- image sync.

### Phase 4 — Traceability

- IDs;
- QR;
- timestamps;
- GPS;
- history;
- status timeline.

### Phase 5 — Map

- Leaflet;
- current location;
- recycler markers;
- distance.

### Phase 6 — Economics

- rates;
- estimated value;
- basic history/trends.

### Phase 7 — Safety

- safety cards;
- rule-based warnings;
- voice abstraction;
- AI integration points.

### Phase 8 — Polish

- Hindi;
- English;
- responsive design;
- accessibility;
- error/loading/empty states;
- demo mode.

Do not proceed by randomly implementing screens. The phase order is intended to protect the core offline workflow from being buried under visual features. fileciteturn0file0L1593-L1666

---

## 37. Deployment Considerations

### Prototype environment

A simple deployment may use:

```text
Frontend → Static hosting / Node server
Backend  → Node/FastAPI server
Database → PostgreSQL
```

For local development:

```text
Frontend
Backend
SQLite/PostgreSQL
```

### Production direction

Future deployment should consider:

- HTTPS;
- managed PostgreSQL;
- object storage for images;
- secure authentication provider/SMS;
- monitoring;
- rate limiting;
- database backups;
- CDN/static asset caching.

These are future deployment concerns and should not unnecessarily delay the SIH prototype.

---

## 38. Future Backend Compatibility

The backend must support future flow:

```text
Collector
   ↓
Aggregator
   ↓
Authorized Recycler
   ↓
Formal Processing
   ↓
EPR / Government Reporting
```

Future endpoints may include:

```text
GET    /recycler/lots
POST   /lots/{id}/offer
POST   /lots/{id}/accept
POST   /lots/{id}/reject
POST   /lots/{id}/handover
POST   /lots/{id}/settlement
GET    /lots/{id}/chain-of-custody
```

These should not be implemented in the current collector milestone unless required for a demonstrable collector workflow.

---

## 39. Future AI Interfaces

Keep these contracts stable:

```text
classifyWaste(image)
detectHazard(image)
speakSafetyAlert(alert, language)
findBestRecycler(location, material, quantity)
```

Possible future implementations:

- TensorFlow Lite;
- ONNX;
- MediaPipe;
- another lightweight inference runtime;
- cloud inference where appropriate.

The prototype should not wait for a production AI model.

---

## 40. Technical Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| IndexedDB quota exceeded | High | Compress images, enforce limits, show storage error |
| Duplicate sync | High | Client UUID + server uniqueness |
| Backend unavailable | High | Keep local queue and retry |
| Image upload failure | High | Independent image status + retry |
| GPS denied | Medium | Continue without location |
| Camera denied | Medium | Allow gallery selection/manual continuation where appropriate |
| Slow device | High | Small bundle, lazy loading, minimal animation |
| Poor network | High | Offline-first queue |
| Fake demo data misunderstood | High | Explicit demo/prototype labels |
| Browser PWA limitations | Medium | Test target Android browsers early |
| Service-worker stale assets | Medium | Versioned cache strategy |
| Auth expires offline | Medium | Allow safe local work and defer server sync |
| Price data becomes stale | Medium | Timestamp and source label |
| Location privacy exposure | High | Minimize and restrict exposure |
| AI not ready | Medium | Manual/mock abstraction |
| Map tiles unavailable offline | Medium | Core collection flow must not depend on map |

---

## 41. Definition of Technical Done

### Frontend

- [ ] Mobile-first UI.
- [ ] PWA installability.
- [ ] Offline app shell.
- [ ] English.
- [ ] Hindi.
- [ ] Collector onboarding.
- [ ] Collection workflow.
- [ ] Multi-image capture.
- [ ] Material selection.
- [ ] Weight/count.
- [ ] Value estimation.
- [ ] Lot creation.
- [ ] QR.
- [ ] History.
- [ ] Safety.
- [ ] Map.
- [ ] Recycler discovery.
- [ ] Profile.

### Local storage

- [ ] IndexedDB.
- [ ] Offline collections.
- [ ] Offline images.
- [ ] Persistent sync metadata.
- [ ] Queue.
- [ ] Retry state.
- [ ] Restart persistence.

### Backend

- [ ] Authentication.
- [ ] Materials.
- [ ] Prices.
- [ ] Lots.
- [ ] Lot items.
- [ ] Images.
- [ ] Recyclers.
- [ ] Safety.
- [ ] Health.
- [ ] Idempotent lot creation.

### Synchronization

- [ ] Connectivity detection.
- [ ] Backend reachability check.
- [ ] Pending → Syncing.
- [ ] Server acknowledgement.
- [ ] Image synchronization.
- [ ] Syncing → Synced.
- [ ] Failed state.
- [ ] Retry.
- [ ] Duplicate protection.
- [ ] Debug screen.

### Security

- [ ] Server-side validation.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Upload validation.
- [ ] Size limits.
- [ ] Environment secrets.
- [ ] No frontend secrets.
- [ ] Minimal PII.

### Testing

- [ ] Airplane mode.
- [ ] Browser restart.
- [ ] Multiple offline records.
- [ ] Failed sync.
- [ ] Duplicate sync.
- [ ] Backend outage.
- [ ] GPS denial.
- [ ] Camera denial.
- [Large images.
- [ ] English.
- [ ] Hindi.
- [ ] Mobile-sized screen.
- [ ] Complete SIH end-to-end scenario.

---

## 42. Final Engineering Rule

Before modifying the codebase:

1. Inspect the existing repository.
2. Identify framework, dependencies, database, API, authentication, folder structure, and environment configuration.
3. Reuse functioning infrastructure.
4. Identify what must be added.
5. Define the data model.
6. Define the offline strategy.
7. Define the synchronization strategy.
8. Define map/location strategy.
9. Identify major risks.
10. Then implement.

Do not declare completion because screens exist. Completion means the real collector workflow works end-to-end, especially the offline-to-online transition.

The core prototype objective is:

```text
LOW-END ANDROID PHONE
        ↓
PHOTOGRAPH E-WASTE
        ↓
CREATE LOT
        ↓
TURN INTERNET OFF
        ↓
CREATE ANOTHER LOT
        ↓
SAVE LOCALLY
        ↓
CLOSE + REOPEN APP
        ↓
RESTORE INTERNET
        ↓
AUTOMATIC SYNC
        ↓
BACKEND RECEIVES EXACT RECORD
        ↓
HISTORY + TRACEABILITY
```

That transition must be real, persistent, idempotent, and demonstrable. fileciteturn0file0L1904-L1924
