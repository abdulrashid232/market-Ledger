import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, DollarSign } from 'lucide-react';
import { CurrencyCode } from '../types';
import { formatMoney, CURRENCIES } from '../lib/constants';

interface TillCalculatorProps {
  selectedCurrency: CurrencyCode;
  expectedNetCash?: number;
}

const DENOMINATIONS_MAP: Record<CurrencyCode, number[]> = {
  GHS: [200, 100, 50, 20, 10, 5, 2, 1, 0.5],
  NGN: [1000, 500, 200, 100, 50, 20, 10, 5],
  KES: [1000, 500, 200, 100, 50, 20, 10, 5],
  USD: [100, 50, 20, 10, 5, 2, 1, 0.25, 0.1, 0.05],
  EUR: [100, 50, 20, 10, 5, 2, 1, 0.5],
  GBP: [50, 20, 10, 5, 2, 1, 0.5],
  ZAR: [200, 100, 50, 20, 10, 5, 2, 1],
};

export const TillCalculator: React.FC<TillCalculatorProps> = ({
  selectedCurrency,
  expectedNetCash = 0,
}) => {
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [targetAmount, setTargetAmount] = useState<number>(expectedNetCash);

  const denominations = DENOMINATIONS_MAP[selectedCurrency] || DENOMINATIONS_MAP.GHS;

  const handleCountChange = (value: number, count: number) => {
    setCounts((prev) => ({
      ...prev,
      [value]: Math.max(0, count),
    }));
  };

  const resetCounts = () => {
    setCounts({});
  };

  const calculatedTotal = denominations.reduce((sum, denom) => {
    const qty = counts[denom] || 0;
    return sum + denom * qty;
  }, 0);

  const discrepancy = calculatedTotal - targetAmount;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
              <Calculator className="w-5 h-5 text-emerald-700" />
            </span>
            Cash Till & Drawer Reconciliation
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Count physical banknotes and coins in your cash box to verify against your expected daily report sales.
          </p>
        </div>

        <button
          onClick={resetCounts}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Till</span>
        </button>
      </div>

      {/* Target Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
          <label className="block text-[11px] font-bold text-stone-500 uppercase">
            Expected Net Revenue Target:
          </label>
          <div className="mt-1 flex items-center space-x-1">
            <span className="text-xs font-bold text-stone-500">{CURRENCIES[selectedCurrency]?.symbol}</span>
            <input
              type="number"
              value={targetAmount || ''}
              onChange={(e) => setTargetAmount(Number(e.target.value) || 0)}
              className="font-black text-xl text-stone-900 bg-transparent focus:outline-none w-full"
              placeholder="0"
            />
          </div>
        </div>

        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
          <label className="block text-[11px] font-bold text-stone-500 uppercase">
            Calculated Physical Cash:
          </label>
          <p className="font-black text-xl text-emerald-700 mt-1">
            {formatMoney(calculatedTotal, selectedCurrency)}
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${
          Math.abs(discrepancy) < 0.01
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : discrepancy > 0
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <label className="block text-[11px] font-bold uppercase tracking-wider opacity-80">
            Status / Discrepancy:
          </label>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-black text-xl">
              {discrepancy >= 0 ? `+${formatMoney(discrepancy, selectedCurrency)}` : formatMoney(discrepancy, selectedCurrency)}
            </span>
            {Math.abs(discrepancy) < 0.01 ? (
              <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Match
              </span>
            ) : discrepancy > 0 ? (
              <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                Surplus Cash
              </span>
            ) : (
              <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Cash Shortage
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Denominations Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-stone-900 text-sm">
          Enter Note & Coin Counts ({selectedCurrency}):
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {denominations.map((denom) => {
            const count = counts[denom] || 0;
            const subtotal = denom * count;

            return (
              <div
                key={denom}
                className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between"
              >
                <div>
                  <span className="font-extrabold text-stone-900 text-base">
                    {formatMoney(denom, selectedCurrency)}
                  </span>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Subtotal: {formatMoney(subtotal, selectedCurrency)}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleCountChange(denom, count - 1)}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 flex items-center justify-center cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={count || ''}
                    onChange={(e) => handleCountChange(denom, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-12 text-center font-bold text-sm bg-white border border-stone-300 rounded-lg py-1 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleCountChange(denom, count + 1)}
                    className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold text-emerald-950 flex items-center justify-center cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
