import React from 'react';
import { Store, FileSpreadsheet, BarChart3, Calculator, Sparkles } from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCIES } from '../lib/constants';

interface NavbarProps {
  activeTab: 'new' | 'history' | 'till' | 'presets';
  setActiveTab: (tab: 'new' | 'history' | 'till' | 'presets') => void;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCurrency,
  setSelectedCurrency,
}) => {
  return (
    <header className="bg-amber-950 border-b border-amber-900/60 text-amber-50 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-amber-950 font-bold shadow-sm shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight text-amber-100 font-sans">
                  Market Vendor <span className="text-amber-400">Daily Ledger</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-900/80 text-amber-300 border border-amber-800">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Gemma / Gemini AI
                </span>
              </div>
              <p className="text-xs text-amber-300/80">
                Raw End-of-Day Notes → Instant Inventory, Revenue & Business Advice
              </p>
            </div>
          </div>

          {/* Controls: Currency & Tab Navigation */}
          <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
            
            {/* Currency Selector */}
            <div className="flex items-center space-x-1.5 bg-amber-900/70 border border-amber-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-amber-300/80 font-medium hidden sm:inline">Currency:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-semibold text-amber-100 focus:outline-none cursor-pointer"
                aria-label="Select Currency"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-amber-950 text-amber-100">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-amber-900/50 p-1 rounded-xl border border-amber-800/80 space-x-1 shrink-0">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'new'
                    ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                    : 'text-amber-200 hover:text-white hover:bg-amber-900/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>New Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                    : 'text-amber-200 hover:text-white hover:bg-amber-900/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>History & Trends</span>
              </button>

              <button
                onClick={() => setActiveTab('till')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'till'
                    ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                    : 'text-amber-200 hover:text-white hover:bg-amber-900/60'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Till Calculator</span>
                <span className="sm:hidden">Till</span>
              </button>
            </nav>

          </div>

        </div>
      </div>
    </header>
  );
};
