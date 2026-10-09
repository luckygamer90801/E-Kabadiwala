import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { IndianRupee, Calculator, Info, Search, ArrowRight } from 'lucide-react';

export const PricePage: React.FC = () => {
  const { t, language, prices, materials } = useApp();
  const [calcMaterial, setCalcMaterial] = useState<string>('mobile_pcb');
  const [calcWeight, setCalcWeight] = useState<number>(2.5);
  const [search, setSearch] = useState<string>('');

  const activeRateObj = prices.find((p) => p.materialCode === calcMaterial);
  const activeRate = activeRateObj?.rate || 350;
  const calculatedTotal = Math.round(calcWeight * activeRate);

  const filteredPrices = prices.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.materialNameEn.toLowerCase().includes(q) ||
      p.materialNameHi.toLowerCase().includes(q) ||
      p.materialCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {t('prices.title')}
        </h2>
        <p className="text-xs text-gray-500">
          Official benchmark guide for informal collectors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calculator & Benchmark Info */}
        <div className="lg:col-span-5 space-y-4">
          {/* INTERACTIVE VALUE CALCULATOR WIDGET */}
          <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-950 text-white rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-300" />
              <h3 className="text-sm font-bold tracking-tight">
                {t('prices.calcTitle')}
              </h3>
            </div>

            {/* Material dropdown & Weight input */}
            <div className="grid grid-cols-2 gap-2 text-gray-900 text-xs">
              <div>
                <label className="text-[10px] text-emerald-200 uppercase font-semibold block mb-1">
                  Material
                </label>
                <select
                  value={calcMaterial}
                  onChange={(e) => setCalcMaterial(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-emerald-700 font-bold text-xs focus:outline-none"
                >
                  {prices.map((p) => (
                    <option key={p.materialCode} value={p.materialCode}>
                      {language === 'hi' ? p.materialNameHi : p.materialNameEn} (₹{p.rate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-emerald-200 uppercase font-semibold block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-white border border-emerald-700 font-bold text-xs focus:outline-none text-center"
                />
              </div>
            </div>

            {/* Calculated Output Box */}
            <div className="pt-2 border-t border-emerald-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-200 block">Estimated Benchmark</span>
                <span className="text-[10px] text-emerald-300/80">
                  {calcWeight} kg × ₹{activeRate}/kg
                </span>
              </div>
              <span className="text-2xl font-black text-amber-300 tracking-tight">
                ₹{calculatedTotal}
              </span>
            </div>
          </div>

          {/* Benchmark Disclaimer Notice */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-amber-900 shadow-sm">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Demo Benchmark Rates</span>
              <p className="text-[11px] leading-tight text-amber-800 mt-0.5">
                {t('prices.disclaimer')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: SEARCH & RATES TABLE */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search material rate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredPrices.map((item) => {
              const matMeta = materials.find((m) => m.code === item.materialCode);
              return (
                <div
                  key={item.materialCode}
                  className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{matMeta?.icon || '📦'}</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">
                        {language === 'hi' ? item.materialNameHi : item.materialNameEn}
                      </h4>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {item.sourceLabel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-brand-900 block">
                      ₹{item.rate}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">
                      per {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
