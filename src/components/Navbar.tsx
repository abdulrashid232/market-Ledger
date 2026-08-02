import React from 'react';
import { Store, FileSpreadsheet, BarChart3, Calculator, Sparkles, Package, Settings } from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCIES } from '../lib/constants';

interface NavbarProps {
  activeTab: 'new' | 'history' | 'till' | 'stock' | 'setup' | 'presets';
  setActiveTab: (tab: 'new' | 'history' | 'till' | 'stock' | 'setup' | 'presets') => void;
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
    <header className="bg-emerald-950 border-b border-emerald-900/60 text-emerald-50 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-emerald-950 font-bold shadow-sm shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight text-emerald-100 font-sans">
                  Sika Dwa <span className="text-emerald-400">Ledger</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/80 text-emerald-300 border border-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Gemma 4 AI
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                Sika Dwa — Raw Notes → Instant Revenue, Inventory & Business Advice
              </p>
            </div>
          </div>

          {/* Controls: Currency & Tab Navigation */}
          <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
            
            {/* Currency Selector */}
            <div className="flex items-center space-x-1.5 bg-emerald-900/70 border border-emerald-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-emerald-300/80 font-medium hidden sm:inline">Currency:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-semibold text-emerald-100 focus:outline-none cursor-pointer"
                aria-label="Select Currency"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-emerald-950 text-emerald-100">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-emerald-900/50 p-1 rounded-xl border border-emerald-800/80 space-x-1 shrink-0">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'new'
                    ? 'bg-emerald-500 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>New Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-emerald-500 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>History & Trends</span>
              </button>

              <button
                onClick={() => setActiveTab('till')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'till'
                    ? 'bg-emerald-500 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Till Calculator</span>
                <span className="sm:hidden">Till</span>
              </button>

              <button
                onClick={() => setActiveTab('stock')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'stock'
                    ? 'bg-emerald-500 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Stock</span>
              </button>

              <button
                onClick={() => setActiveTab('setup')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'setup'
                    ? 'bg-emerald-500 text-emerald-950 shadow-sm font-bold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Setup</span>
              </button>
            </nav>

          </div>

        </div>
      </div>
    </header>
  );
};
