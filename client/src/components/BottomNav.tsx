import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Home, Layers, Plus, MapPin, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { t, pendingLotsCount } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg py-1 px-3 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${
            currentTab === 'home' ? 'text-brand-700 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5">{t('nav.home')}</span>
        </button>

        {/* Collections */}
        <button
          onClick={() => onSelectTab('collections')}
          className={`flex flex-col items-center flex-1 py-1 relative transition-colors ${
            currentTab === 'collections' ? 'text-brand-700 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <Layers className={`w-5 h-5 ${currentTab === 'collections' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pendingLotsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {pendingLotsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">{t('nav.collections')}</span>
        </button>

        {/* Center Prominent Add Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => onSelectTab('add')}
            className={`w-14 h-14 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex flex-col items-center justify-center shadow-lg shadow-brand-600/40 transform active:scale-95 transition-transform border-4 border-white ${
              currentTab === 'add' ? 'ring-4 ring-brand-300' : ''
            }`}
            title={t('home.addCollection')}
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        {/* Map */}
        <button
          onClick={() => onSelectTab('map')}
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${
            currentTab === 'map' ? 'text-brand-700 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <MapPin className={`w-5 h-5 ${currentTab === 'map' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5">{t('nav.map')}</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${
            currentTab === 'profile' ? 'text-brand-700 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5">{t('nav.profile')}</span>
        </button>
      </div>
    </nav>
  );
};
