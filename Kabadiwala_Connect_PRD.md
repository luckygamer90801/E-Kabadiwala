# Product Requirements Document (PRD)
## Kabadiwala Connect — SIH26229

**Document Version:** 1.0  
**Status:** Prototype / SIH 2026  
**Primary Platform:** Mobile-first Progressive Web App (PWA)  
**Primary User:** Informal e-waste collector / kabadiwala  
**Scope:** Collector-side prototype only

---

## 1. Product Overview

Kabadiwala Connect is a mobile-first digital bridge between informal e-waste collectors and the formal recycling ecosystem.

The prototype addresses the operational gap faced by informal collectors: they may have strong last-mile reach but lack simple tools for documenting collections, estimating material value, maintaining digital records, handling e-waste safely, creating traceable lots, discovering formal recycling channels, and continuing operations during unreliable connectivity.

The first milestone is deliberately limited to the **collector-side experience**. The recycler/buyer dashboard is not part of the current implementation, but the data model and APIs must be designed so that it can be added later without rewriting the collector application.

The supplied specification explicitly prioritizes **offline-first operation, reliable data, simple UX, traceability, map functionality, fair-price information, safety, and visual polish**. fileciteturn0file0L1784-L1924

---

## 2. Problem Statement

Informal e-waste collectors need a simple way to:

- document what they collect;
- record photographs, quantity, and weight;
- understand indicative material values;
- create traceable collection lots;
- maintain records digitally;
- connect with formal recycling channels;
- receive practical safety guidance;
- operate without continuous internet connectivity.

Kabadiwala Connect converts these activities into a low-friction mobile workflow that can operate offline and synchronize when connectivity returns. fileciteturn0file0L46-L64

---

## 3. Product Vision

Enable an informal collector to go from **physical e-waste → documented collection → traceable lot → formal-network-ready record** using an inexpensive Android phone, with minimal typing and without depending on continuous internet access.

### Vision statement

> Make formal e-waste traceability accessible to the informal collector without making the collector change the way they work.

---

## 4. Goals

### 4.1 Primary goals

1. Provide extremely simple collector onboarding and authentication.
2. Allow collectors to create collections using photos, material type, weight/count, and location.
3. Allow multiple collected items to be grouped into a lot.
4. Generate a unique lot ID and QR representation.
5. Persist collections locally when offline.
6. Synchronize pending collections automatically when connectivity returns.
7. Make synchronization status visible and trustworthy.
8. Provide collection history and lot traceability.
9. Provide indicative, clearly labeled price information.
10. Provide basic recycler discovery and map functionality.
11. Provide practical e-waste safety guidance.
12. Support English and Hindi, with architecture ready for Marathi.
13. Produce a polished SIH-demo-ready mobile experience.

### 4.2 Non-goals for this milestone

The following are intentionally out of scope:

- Full recycler/buyer dashboard.
- Production-grade marketplace or bidding system.
- Real-time purchase-price guarantees.
- Production AI waste classification.
- Production AI hazard detection.
- Advanced Hindi/Marathi voice AI.
- Continuous background GPS tracking.
- Government reporting/EPR analytics.
- Full payment settlement workflow.
- Turn-by-turn navigation.
- Fabricating official recycler authorization.

---

## 5. Target User

### Primary persona: Informal e-waste collector

The application should assume:

- inexpensive Android hardware;
- limited RAM/storage;
- unreliable or intermittent mobile internet;
- occasional no-internet conditions;
- small screens;
- outdoor/sunlight use;
- limited typing ability;
- potentially low digital literacy;
- Hindi may be more comfortable than English.

The supplied requirements therefore call for icons, pictures, large buttons, familiar symbols, short text, and minimal typing rather than enterprise-style forms. fileciteturn0file0L96-L125

---

## 6. Product Principles

### 6.1 Offline first

The core collection workflow must work without internet. Offline is a normal operating state, not an error state.

### 6.2 Low-literacy UX

The collector should understand actions primarily through:

- large touch targets;
- icons;
- pictures;
- short labels;
- familiar symbols;
- simple language.

### 6.3 Technical honesty

Demo data, indicative prices, mock AI, demo recyclers, and future capabilities must be clearly labeled. The product must never imply that an unimplemented capability is production-ready. fileciteturn0file0L1718-L1740

### 6.4 Traceability by default

Every collection should be uniquely identifiable and retain enough metadata to support future chain-of-custody workflows.

### 6.5 Low-resource operation

Avoid continuous GPS, unnecessary animation, oversized images, large bundles, and continuously running AI.

---

## 7. Core User Journey

```text
Open App
   ↓
Collector Home
   ↓
Add Collection
   ↓
Take / Select Photo
   ↓
Select Material
   ↓
Enter Weight / Quantity
   ↓
See Estimated Value
   ↓
Add More Items
   ↓
Capture Location
   ↓
Create Lot
   ↓
Generate Lot ID + QR
   ↓
Save Locally
   ↓
If Offline → Pending Sync
   ↓
Connectivity Restored
   ↓
Automatic Synchronization
   ↓
Synced
   ↓
Available for Future Formal Recycling Workflow
```

This is the central product flow and should be the primary UX tested during the SIH demonstration. fileciteturn0file0L174-L243

---

## 8. Functional Requirements

### FR-01 — Collector onboarding

The system shall provide a simple phone-based onboarding/login flow.

Requirements:

- phone number input;
- OTP-oriented authentication architecture;
- clearly marked demo OTP mode if real SMS infrastructure is unavailable;
- persistent collector profile;
- no claim that demo OTP is real production authentication.

### FR-02 — Home dashboard

The home screen shall display:

- collector name;
- profile/avatar;
- online/offline state;
- pending synchronization count;
- Add Collection;
- My Collections;
- Price Check;
- Find Recycler;
- Safety;
- simple bottom navigation.

Suggested navigation:

```text
Home | Collections | Add | Map | Profile
```

The Add action should be visually prominent. fileciteturn0file0L247-L290

### FR-03 — Add collection

The collector shall be able to:

- take a photograph;
- choose an image from the gallery;
- attach multiple photographs;
- select a material visually;
- enter approximate weight;
- enter quantity/count;
- choose a unit;
- review estimated value;
- add more items;
- create a lot.

### FR-04 — Photo capture

Supported image flow:

1. Capture or select image.
2. Compress image.
3. Store locally.
4. Associate with collection UUID.
5. Display thumbnail.
6. Upload when connectivity returns.
7. Display upload/sync status.

Suggested photo purposes:

- overview;
- close-up;
- hazardous component;
- material detail.

### FR-05 — Material selection

Provide visual cards for:

- Mobile / Smartphone;
- Laptop;
- Computer / Monitor;
- Battery;
- Charger / Cable;
- PCB / Circuit Board;
- Electronic Appliance;
- Other E-waste;
- Not sure / Unclassified E-waste.

The collector must not be forced to type material names.

### FR-06 — Optional AI classification interface

The product shall expose an abstraction for future classification:

```text
classifyWaste(image)
```

The current prototype may use manual selection, a mock classifier, or simple placeholder inference.

The UI should be capable of displaying:

```text
Possible match: Laptop PCB
Confidence: 87%
```

The collector must always be able to override a prediction. fileciteturn0file0L535-L569

### FR-07 — Weight and quantity

The collector shall be able to record:

- approximate weight;
- quantity;
- unit.

Examples:

- 1.5 kg;
- 3 pieces.

### FR-08 — Indicative price

The product shall provide an API-backed material price list.

Example categories:

- Mobile PCB;
- Laptop PCB;
- Copper cable;
- Aluminium;
- Iron/steel casing;
- Plastic casing;
- Lithium-ion battery;
- Mixed e-waste.

Every price must show:

- material;
- indicative rate;
- unit;
- last updated;
- prototype/demo label where applicable.

The system shall not present sample values as official live market prices. fileciteturn0file0L681-L713

### FR-09 — Value estimation

For supported rate-based materials:

```text
Estimated value = weight × indicative rate
```

The UI must label the result **Estimated value**, not guaranteed purchase price.

### FR-10 — Lot creation

A collector shall be able to combine multiple items into a lot.

A lot should display:

- human-readable lot ID;
- items;
- total weight;
- total estimated value;
- photo count;
- location state;
- timestamp;
- synchronization status.

### FR-11 — Unique lot identity

Each lot shall have:

- client-generated UUID;
- server ID when synchronized;
- human-readable ID such as `KC-2026-8F4A92`.

IDs must remain collision-safe when generated offline.

### FR-12 — QR code

Every completed lot shall generate a QR representation.

The QR should contain only:

- secure lot reference;
- or secure verification URL/token.

It must not contain unnecessary personal information.

The collector shall be able to:

- display the QR;
- save it;
- share it later.

### FR-13 — GPS/location

The app shall request device/browser geolocation when creating a lot.

Store where available:

- latitude;
- longitude;
- accuracy radius;
- capture timestamp.

If location is unavailable, collection creation must continue with:

> Location unavailable

The app must not attempt to access raw cell-tower data from the browser. fileciteturn0file0L854-L878

### FR-14 — Map

Use Leaflet + OpenStreetMap.

The map shall show:

- approximate collector location;
- nearby recycler/demo locations;
- collection points/hubs;
- approximate distance.

Demo organizations must be clearly labeled as demo data unless independently verified.

### FR-15 — Recycler discovery

Collector-side discovery shall show:

- recycler/collection-center name;
- approximate distance;
- accepted materials;
- operational status;
- map view;
- details.

Future backend fields should allow verification information.

### FR-16 — Collection history

History cards shall show:

- Lot ID;
- date;
- material;
- weight;
- estimated value;
- sync status.

The collector can open each lot for full details.

### FR-17 — Offline queue

The product shall visibly show pending records, for example:

> 3 collections waiting to sync

Selecting the queue should show each pending lot and its state.

### FR-18 — Automatic synchronization

The application shall:

1. detect restored connectivity;
2. test backend reachability;
3. begin synchronization;
4. upload records and images;
5. receive server acknowledgement;
6. update local state to SYNCED.

The process must be real rather than simulated with timers. fileciteturn0file0L321-L424

### FR-19 — Retry

Failed synchronization shall:

- preserve local data;
- display a useful error;
- retry using sensible backoff;
- expose an optional Sync Now action.

### FR-20 — Safety

Provide visual safety cards for:

- damaged/swollen batteries;
- CRT displays;
- exposed electrical components;
- unknown chemical contamination;
- broken components;
- wires/cables;
- sharp components.

Example battery guidance:

> Do not puncture, crush or burn damaged batteries.

### FR-21 — Voice architecture

Provide an abstraction:

```text
speakSafetyAlert(alertId, language)
```

The prototype may use device/browser text-to-speech where available. Future Hindi/Marathi/English voice systems should be pluggable without redesigning the product. fileciteturn0file0L605-L625

### FR-22 — Language

Minimum supported languages:

- English;
- Hindi.

The architecture must support future Marathi.

All user-facing text should use translation keys rather than hard-coded component strings.

### FR-23 — Profile

Profile shall show:

- collector name;
- collector ID;
- preferred language;
- appropriately masked phone number;
- collection count;
- total recorded weight;
- synchronization status.

Only necessary personal information should be collected.

### FR-24 — PWA

The application shall be installable and provide:

- service worker;
- manifest;
- cached application shell;
- offline opening;
- offline navigation;
- persistent local data.

---

## 9. Offline-First Requirements

Offline functionality is a core product feature.

The collector must be able to:

- open the app;
- create collections;
- take photographs;
- select materials;
- enter weight;
- capture location when available;
- generate local lot IDs;
- save lots;
- view history;
- continue creating additional lots.

Every local object should include:

```text
localId
serverId
createdAt
updatedAt
syncStatus
retryCount
lastSyncAttempt
syncError
```

Required synchronization states:

```text
PENDING
SYNCING
SYNCED
FAILED
```

Each collection should use a stable client UUID/idempotency key so retries cannot create duplicate lots. fileciteturn0file0L426-L450

---

## 10. Traceability Requirements

The product should expose a lot timeline.

Current prototype states may include:

```text
COLLECTED
    ↓
LOT CREATED
    ↓
SYNCED
```

Future states can be modeled but disabled:

```text
OFFER RECEIVED
    ↓
HANDOVER
    ↓
RECYCLER ACCEPTED
    ↓
PAYMENT RECORDED
```

The data created by the collector prototype must be sufficient for future chain-of-custody, offers, settlement, EPR-related records, and government analytics. fileciteturn0file0L826-L850

---

## 11. Safety, Privacy, and Trust

### Privacy

- Do not expose exact personal location unnecessarily.
- Avoid unnecessary PII.
- Future recycler-facing views should expose only operationally necessary location information.
- QR data must not include unnecessary personal information.

### Trust

- Sample prices must be labeled.
- Demo recyclers must be labeled.
- Mock AI must be labeled.
- Future functionality must not be presented as implemented.

---

## 12. Accessibility

The product shall support:

- large touch targets;
- readable typography;
- high contrast;
- icon + text combinations;
- English;
- Hindi;
- future Marathi;
- optional text-to-speech;
- clear error messages.

Status must never depend only on color.

Use:

```text
✓ Synced
⏳ Pending
⚠ Failed
```

in addition to visual styling. fileciteturn0file0L1377-L1403

---

## 13. Performance Requirements

Target conditions:

- low RAM;
- slow CPU;
- slow/intermittent network;
- limited storage.

Product expectations:

- compressed images;
- lazy loading;
- small JavaScript bundle;
- minimal animation;
- no continuous AI;
- no continuous GPS;
- cached static assets;
- paginated history;
- lightweight icons;
- no full-database browser loading.

---

## 14. Error Handling

The product must handle:

- camera permission denied;
- location permission denied;
- offline state;
- backend unavailable;
- oversized images;
- upload failure;
- invalid weight;
- invalid material;
- sync conflict;
- expired authentication;
- local storage failure.

Errors should explain what happened and what will happen next.

Example:

> Internet is unavailable. Your collection has been saved on this phone and will sync automatically.

---

## 15. Demo Mode

An optional SIH Demo Mode should support a complete presentation flow:

1. Login.
2. Home.
3. Add collection.
4. Take/upload image.
5. Select material.
6. Enter weight.
7. Capture location.
8. View estimated value.
9. Create lot.
10. Generate QR.
11. Disable internet.
12. Create another lot.
13. Show pending synchronization.
14. Restore internet.
15. Automatically synchronize.
16. Open history.
17. Open lot details.
18. Show map.
19. Show safety guidance.

The demonstration must not depend on fragile external services. fileciteturn0file0L1301-L1327

---

## 16. Success Metrics

### Core success metrics

- Collector can create a complete lot without internet.
- Offline records survive browser/app restart.
- Offline images survive restart.
- Pending records automatically synchronize after connectivity returns.
- Duplicate retries do not create duplicate lots.
- Backend receives synchronized records.
- Collector can retrieve a lot using its ID/QR.
- Collector can understand indicative value.
- Collector can access safety guidance.
- Collector can discover nearby demo/verified recycling locations.
- English and Hindi flows work.
- Main workflow can be completed comfortably on a mobile-sized screen.

### SIH proof points

1. Low-literacy UX.
2. Real offline-first operation.
3. Automatic sync.
4. Traceability.
5. Fair-value indication.
6. Safety.
7. Location.
8. Formal-recycling readiness.

These are explicitly identified as the major presentation priorities in the supplied specification. fileciteturn0file0L1744-L1782

---

## 17. Definition of Done

The product is complete only when the supplied acceptance checklist is satisfied:

- [ ] Collector onboarding/login works.
- [ ] Home works.
- [ ] Collection creation works.
- [ ] Camera/photo upload works.
- [ ] Multiple images can be attached.
- [ ] Material can be selected.
- [ ] Weight/count can be entered.
- [ ] Estimated value is calculated.
- [ ] Lot can be created.
- [ ] Unique lot ID exists.
- [ ] QR code works.
- [ ] Location can be captured.
- [ ] Map works.
- [ ] Nearby recycler/demo locations appear.
- [ ] Collection history works.
- [ ] Safety guidance works.
- [ ] English works.
- [ ] Hindi works.
- [ ] PWA opens offline.
- [ ] Collections can be created offline.
- [ ] Images can be stored offline.
- [ ] Offline records survive restart.
- [ ] Pending sync queue exists.
- [ ] Automatic synchronization works.
- [ ] Failed synchronization retries.
- [ ] Duplicate synchronization does not duplicate lots.
- [ ] Backend receives synchronized records.
- [ ] Sync status is visible.
- [ ] API errors are handled.
- [ ] Camera/location failures are handled.
- [ ] Mobile layout works.
- [ ] Prototype data is clearly distinguished from official data.
- [ ] No secrets/API keys are exposed.
- [ ] End-to-end demo works without manually editing the database.

---

## 18. Product Roadmap

### Phase 1 — Foundation

- project setup;
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
- offline queue;
- sync engine;
- retry;
- image synchronization.

### Phase 4 — Traceability

- lot IDs;
- QR;
- timestamps;
- GPS;
- history;
- status timeline.

### Phase 5 — Map

- Leaflet;
- current approximate location;
- recycler markers;
- distance.

### Phase 6 — Economics

- material rates;
- estimated value;
- basic price history/trends.

### Phase 7 — Safety

- visual cards;
- rule-based warnings;
- voice abstraction;
- future AI integration points.

### Phase 8 — Polish

- Hindi;
- English;
- responsive design;
- accessibility;
- errors/loading/empty states;
- demo mode.

The phase order follows the supplied development plan. fileciteturn0file0L1593-L1666

---

## 19. Future Scope

The architecture should support:

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

Future modules may include:

- recycler lot queue;
- QR scanning;
- actual-weight reconciliation;
- acceptance/rejection;
- offers;
- settlement;
- digital receipts;
- EPR records;
- chain-of-custody history;
- government analytics;
- waste classification;
- hazard detection;
- voice alerts;
- recycler recommendation.

The current milestone should create the data foundation for these modules without implementing the recycler dashboard now. fileciteturn0file0L1451-L1506
