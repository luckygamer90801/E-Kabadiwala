# Kabadiwala Connect (कबाड़ीवाला कनेक्ट)
### Smart India Hackathon 2026 — Problem Statement SIH26229
> **"Bringing the Informal Collector into the Formal Recycling Chain"**

---

## 🌟 Executive Summary

**Kabadiwala Connect** is a mobile-first, offline-first Progressive Web App (PWA) designed specifically for informal e-waste collectors (kabadiwalas) on low-end Android devices. It bridges the last-mile collection network with authorized formal recycling channels by providing:
1. **Low-Literacy Field UX**: Large visual cards, photos, minimal typing, Hindi & English UI, and voice guidance.
2. **True Offline-First Persistence**: Powered by IndexedDB (Dexie.js); collectors can capture photos, record weights, generate Lot IDs, and view QR codes with **zero internet connectivity**.
3. **Automatic & Idempotent Synchronization**: As soon as connectivity returns, collections and compressed photos automatically sync to the MongoDB backend without creating duplicates.
4. **End-to-End Traceability**: Unique human-readable lot numbers (`KC-2026-XXXXXX`), QR representations, and a 7-stage chain-of-custody timeline.
5. **Indicative Fair Pricing**: Benchmark pricing and instant value estimation to empower informal collectors with fair market value transparency.
6. **Formal Recycler Discovery**: Interactive Leaflet & OpenStreetMap view showing distance to authorized aggregation centers.
7. **Hazardous E-Waste Safety**: Visual cards, Do's & Don'ts, and text-to-speech audio alerts (Hindi & English) for dangerous items (lithium batteries, burning cables, CRT lead glass).

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│           Mobile PWA Frontend (Port 3000)              │
│  React 18 + TypeScript + Vite + Tailwind CSS           │
│                                                        │
│  • Offline Persistence: IndexedDB (Dexie.js)           │
│  • Client-Side Compression: Canvas JPEG/WebP           │
│  • Maps: Leaflet + OpenStreetMap                       │
│  • Traceability: QR Code Generation (qrcode.react)     │
│  • i18n: English + Devanagari Hindi + Marathi ready    │
│  • Voice Guidance: Web Speech Synthesis API            │
│  • AI Abstraction: classifyWaste() & Hazard Detection  │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST (Proxy /api)
                           ▼
┌────────────────────────────────────────────────────────┐
│            REST Backend Server (Port 5000)             │
│  Node.js + Express + TypeScript                        │
│                                                        │
│  • Database: MongoDB (with Mongoose ORM)               │
│  • Fallback Engine: Embedded MongoDB Auto-Start        │
│  • Idempotency Engine: Unique client UUID keys         │
│  • Multipart Storage: Multer photo uploads (/uploads)  │
│  • Endpoints: /api/lots, /api/sync, /api/prices,       │
│               /api/materials, /api/recyclers, /safety  │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start Backend Server
```powershell
cd server
npm.cmd install
npm.cmd run dev
```
*The backend connects to MongoDB at `mongodb://127.0.0.1:27017/kabadiwala_connect`. If a standalone MongoDB instance is not already running, it automatically boots an embedded MongoDB instance for zero-configuration startup.*

### 2. Start Frontend PWA
```powershell
cd client
npm.cmd install
npm.cmd run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser in responsive mobile mode.*

---

## 🎯 SIH 2026 Live Demonstration Script

### Step 1: Open Home Dashboard
- Open [http://localhost:3000](http://localhost:3000).
- Observe the greeting `"Namaste, Ramesh 👋"`, online status pill 🟢, and statistics cards (Total Lots, Weight, Value).

### Step 2: Create Online Collection
- Tap **"ADD COLLECTION"**.
- Take or upload a photo (or choose from gallery).
- Observe the **AI Match** pill (e.g. *Laptop PCB - 88% Match*).
- Select a material (e.g. *Mobile PCB* or *Laptop Motherboard*).
- Enter weight using the quick increment buttons (e.g., `+1.0kg` -> `2.5 kg`).
- Note the live benchmark calculation: `₹900`.
- Tap **"CREATE LOT"**.
- Notice the **Success Screen**: Unique Lot ID (`KC-2026-XXXXXX`), QR Code, and status `✓ Synced directly to the formal recycling network`.
- Tap **"View Lot Details"** to inspect the 7-stage chain-of-custody timeline.

### Step 3: The Airplane Mode Demonstration
- Tap the **Airplane Mode toggle** in the navbar (or open Profile -> toggle *Simulate Airplane Mode*).
- Observe the status change to 🟠 **"Offline — Saved Locally"**.
- Tap **"ADD"** to create an offline collection.
- Select **"Lithium-ion Battery"** (notice the red hazard warning card).
- Set weight to `1.5 kg`.
- Tap **"CREATE LOT"**.
- The app saves the lot and photos into **IndexedDB**.
- The screen shows: `"Saved on phone. Will automatically sync when internet returns."`
- Open the **"Lots"** tab: see the pending lot marked with ⏳ **Waiting for Sync** and the offline queue alert banner.
- Close or refresh the browser: the lot remains safely saved on the phone!

### Step 4: Restoring Internet & Auto-Sync
- Tap the **Airplane Mode toggle** to turn it OFF.
- The sync engine immediately detects connectivity, pings `/api/health`, and initiates background batch upload.
- Observe the status change from ⏳ `Waiting for Sync` to 🟢 `✓ Synced`.
- The backend MongoDB database now contains the exact synchronized lot without any duplicate entries!

### Step 5: Recycler Discovery & Map
- Tap **"Map"** in the bottom navigation.
- See your approximate current location pin 📍 and nearby formal authorized recycling centers ♻️ on OpenStreetMap.
- View facility distances in kilometers, accepted materials, operating hours, and phone call action.

### Step 6: Safety Guidance with Voice Audio
- Tap **"Safety Guide"**.
- Browse visual safety cards for swollen batteries, burning cables, CRT implosion hazards, and sharp PCBs.
- Tap the **speaker icon 🔊** to listen to the safety guidelines spoken aloud in Devanagari Hindi or English via browser speech synthesis.

### Step 7: Language Switch
- Tap the language button in the navbar to switch between **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
