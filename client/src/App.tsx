import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';
import { BanAlertBanner } from './components/BanAlertBanner.tsx';
import { RoleSelectionModal } from './components/RoleSelectionModal.tsx';
import { BuyerAuthModal } from './components/BuyerAuthModal.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { AddCollectionPage } from './pages/AddCollectionPage.tsx';
import { CollectionsPage } from './pages/CollectionsPage.tsx';
import { LotDetailPage } from './pages/LotDetailPage.tsx';
import { MapPage } from './pages/MapPage.tsx';
import { PricePage } from './pages/PricePage.tsx';
import { SafetyPage } from './pages/SafetyPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { SyncDebugPage } from './pages/SyncDebugPage.tsx';
import { BuyerApp } from './pages/BuyerApp.tsx';

export const MainApp: React.FC = () => {
  const { userRole, setUserRole, isBuyerAuthenticated } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const navigateTo = (tab: string, lotId?: string) => {
    if (lotId) setSelectedLotId(lotId);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If role is Buyer and authenticated, render full Buyer Interface
  if (userRole === 'buyer' && isBuyerAuthenticated) {
    return (
      <BuyerApp onSwitchToCollector={() => setUserRole('collector')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* 1. App-Start Role Selection Modal (As soon as app starts, ask if you are collector or buyer) */}
      <RoleSelectionModal isOpen={userRole === null} />

      {/* 2. Authentic Buyer Authentication Modal (If buyer is chosen, properly authenticate & map shop location) */}
      <BuyerAuthModal
        isOpen={userRole === 'buyer' && !isBuyerAuthenticated}
        onClose={() => setUserRole('collector')}
      />

      {/* Mobile Shell Wrapper for Collector */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-2xl relative">
        {/* Sticky Top Header */}
        <Navbar onOpenDebug={() => navigateTo('debug')} />

        {/* Community Report Ban Alert Banner */}
        <BanAlertBanner />

        {/* Offline Persistent Bar */}
        <OfflineBanner />

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 pt-3 pb-20 overflow-y-auto">
          {currentTab === 'home' && (
            <HomePage onNavigate={navigateTo} />
          )}

          {currentTab === 'add' && (
            <AddCollectionPage
              onDone={(newLotId) => {
                if (newLotId) {
                  navigateTo('lot_detail', newLotId);
                } else {
                  navigateTo('collections');
                }
              }}
              onCancel={() => navigateTo('home')}
            />
          )}

          {currentTab === 'collections' && (
            <CollectionsPage
              onSelectLot={(lotId) => navigateTo('lot_detail', lotId)}
              onAddNew={() => navigateTo('add')}
            />
          )}

          {currentTab === 'lot_detail' && (
            <LotDetailPage
              lotId={selectedLotId || ''}
              onBack={() => navigateTo('collections')}
            />
          )}

          {currentTab === 'map' && <MapPage />}

          {currentTab === 'prices' && <PricePage />}

          {currentTab === 'safety' && <SafetyPage />}

          {currentTab === 'profile' && (
            <ProfilePage onOpenDebug={() => navigateTo('debug')} />
          )}

          {currentTab === 'debug' && (
            <SyncDebugPage onBack={() => navigateTo('profile')} />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => navigateTo(tab)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
