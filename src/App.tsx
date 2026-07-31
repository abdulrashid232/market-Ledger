import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NoteInputSection } from './components/NoteInputSection';
import { ReportView } from './components/ReportView';
import { HistoryView } from './components/HistoryView';
import { TillCalculator } from './components/TillCalculator';
import { WhatsAppExportModal } from './components/WhatsAppExportModal';
import { CurrencyCode, DailyLedgerReport } from './types';
import { getSavedReports, saveReport, deleteReport } from './lib/ledgerStorage';
import { AlertCircle, Sparkles, Store, RefreshCw, CheckCircle2, Package } from 'lucide-react';
import { StockManager } from './components/StockManager';
import { SetupGuide } from './components/SetupGuide';
import { deductSalesFromStock, processAIRestocks, getStockProducts, DeductionResult } from './lib/stockStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'till' | 'stock' | 'setup' | 'presets'>('new');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('GHS');

  const [reports, setReports] = useState<DailyLedgerReport[]>([]);
  const [currentReport, setCurrentReport] = useState<DailyLedgerReport | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stockDeductions, setStockDeductions] = useState<DeductionResult[]>([]);
  const [stockUnmatched, setStockUnmatched] = useState<string[]>([]);
  const [stockRestocked, setStockRestocked] = useState<Array<{ productName: string; quantity: number; unit: string }>>([]);

  const [whatsappModalReport, setWhatsappModalReport] = useState<DailyLedgerReport | null>(null);

  useEffect(() => {
    // Load historical reports on mount
    getSavedReports().then((saved) => {
      setReports(saved);
      if (saved.length > 0) {
        setCurrentReport(saved[0]);
      }
    });
  }, []);

  const handleAnalyzeNotes = async (payload: {
    notes: string;
    currency: CurrencyCode;
    vendorName: string;
    businessType: string;
    date: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const stockProducts = await getStockProducts();
      const res = await fetch('/api/analyze-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stockProducts }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process notes with local Gemma 4.');
      }

      const parsed = data.data;

      const newReport: DailyLedgerReport = {
        id: `report-${Date.now()}`,
        date: payload.date || new Date().toISOString().split('T')[0],
        currency: payload.currency,
        currencySymbol: payload.currency === 'GHS' ? '₵' : payload.currency === 'NGN' ? '₦' : '$',
        rawNotes: payload.notes,
        vendorName: payload.vendorName,
        businessType: payload.businessType,
        summaryHeadline: parsed.summaryHeadline || 'Daily Vendor Ledger Summary',
        totalRevenue: Number(parsed.totalRevenue) || 0,
        totalExpenses: Number(parsed.totalExpenses) || 0,
        netProfit: Number(parsed.netProfit) || (Number(parsed.totalRevenue) - Number(parsed.totalExpenses)),
        sales: (parsed.sales || []).map((s: any, idx: number) => ({
          ...s,
          id: `s-${idx}-${Date.now()}`,
        })),
        expenses: (parsed.expenses || []).map((e: any, idx: number) => ({
          ...e,
          id: `e-${idx}-${Date.now()}`,
        })),
        inventory: (parsed.inventory || []).map((i: any, idx: number) => ({
          ...i,
          id: `i-${idx}-${Date.now()}`,
          checked: false,
        })),
        feedback: (parsed.feedback || []).map((f: any, idx: number) => ({
          ...f,
          id: `f-${idx}-${Date.now()}`,
        })),
        insights: (parsed.insights || []).map((ins: any, idx: number) => ({
          ...ins,
          id: `ins-${idx}-${Date.now()}`,
        })),
        tasks: (parsed.tasks || []).map((t: any, idx: number) => ({
          ...t,
          id: `t-${idx}-${Date.now()}`,
          completed: false,
        })),
        createdAt: Date.now(),
      };

      setCurrentReport(newReport);
      // Automatically save new report to history
      const updatedList = await saveReport(newReport);
      setReports(updatedList);

      // Auto-deduct sold quantities from stock catalogue
      const { deducted, unmatched } = await deductSalesFromStock(newReport.sales, newReport.id, newReport.date);
      if (deducted.length > 0) {
        setStockDeductions(deducted);
        setTimeout(() => setStockDeductions([]), 6000);
      }
      if (unmatched.length > 0) {
        setStockUnmatched(unmatched);
        setTimeout(() => setStockUnmatched([]), 10000);
      }

      // Auto-add restocked quantities detected in notes
      const aiRestocks = parsed.restocks || [];
      if (aiRestocks.length > 0) {
        const { restocked, unmatched: unmatchedRestocks } = await processAIRestocks(aiRestocks, newReport.date);
        if (restocked.length > 0) {
          setStockRestocked(restocked);
          setTimeout(() => setStockRestocked([]), 7000);
        }
        if (unmatchedRestocks.length > 0) {
          setStockUnmatched((prev) => [...prev, ...unmatchedRestocks]);
          setTimeout(() => setStockUnmatched([]), 10000);
        }
      }

      setIsAnalyzing(false);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while analyzing notes.');
      setIsAnalyzing(false);
    }
  };

  const handleUpdateCurrentReport = async (updated: DailyLedgerReport) => {
    setCurrentReport(updated);
    const updatedList = await saveReport(updated);
    setReports(updatedList);
  };

  const handleDeleteReport = async (id: string) => {
    const updatedList = await deleteReport(id);
    setReports(updatedList);
    if (currentReport?.id === id) {
      setCurrentReport(updatedList.length > 0 ? updatedList[0] : null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab === 'presets' ? 'new' : activeTab as any}
        setActiveTab={setActiveTab}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
      />

      {/* Stock auto-deduction success notification */}
      {stockDeductions.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-emerald-100 rounded-2xl shadow-xl p-4 max-w-sm space-y-1 border border-emerald-700">
          <p className="text-xs font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            Stock auto-updated from today's sales:
          </p>
          {stockDeductions.map((d, i) => (
            <p key={i} className="text-xs text-emerald-300">
              — {d.productName}: <strong>-{d.deducted} {d.unit}</strong>
            </p>
          ))}
        </div>
      )}

      {/* Stock restock notification */}
      {stockRestocked.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 bg-blue-900 text-blue-100 rounded-2xl shadow-xl p-4 max-w-sm space-y-1 border border-blue-700">
          <p className="text-xs font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            Stock updated from today's restocks:
          </p>
          {stockRestocked.map((r, i) => (
            <p key={i} className="text-xs text-blue-300">
              — {r.productName}: <strong>+{r.quantity} {r.unit}</strong>
            </p>
          ))}
        </div>
      )}

      {/* Unmatched items warning */}
      {stockUnmatched.length > 0 && (
        <div className={`fixed z-50 bg-amber-900 text-amber-100 rounded-2xl shadow-xl p-4 max-w-sm space-y-1 border border-amber-700 ${stockDeductions.length > 0 ? 'bottom-6 left-6' : 'bottom-6 right-6'}`}>
          <p className="text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Items sold but not in stock catalogue:
          </p>
          {stockUnmatched.map((name, i) => (
            <p key={i} className="text-xs text-amber-300">— {name}</p>
          ))}
          <p className="text-[10px] text-amber-400 pt-1 border-t border-amber-800">
            Go to Stock tab → Add Product to track these items.
          </p>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-start justify-between shadow-2xs">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Processing Error</h4>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: New Ledger & Active Report View */}
        {(activeTab === 'new' || activeTab === 'presets') && (
          <div className="space-y-8">
            
            {/* Input Form Section */}
            <NoteInputSection
              onAnalyze={handleAnalyzeNotes}
              isAnalyzing={isAnalyzing}
              selectedCurrency={selectedCurrency}
            />

            {/* Generated Report View */}
            {currentReport && (
              <ReportView
                report={currentReport}
                onUpdateReport={handleUpdateCurrentReport}
                onSaveToHistory={(rep) => {
                  saveReport(rep).then((updated) => setReports(updated));
                }}
                onOpenWhatsAppExport={(rep) => setWhatsappModalReport(rep)}
              />
            )}

          </div>
        )}

        {/* TAB 2: History & Visual Trends Analytics */}
        {activeTab === 'history' && (
          <HistoryView
            reports={reports}
            selectedCurrency={selectedCurrency}
            onSelectReport={(rep) => {
              setCurrentReport(rep);
              setActiveTab('new');
            }}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {/* TAB 3: Till Cash Reconciliation Calculator */}
        {activeTab === 'till' && (
          <TillCalculator
            selectedCurrency={selectedCurrency}
            expectedNetCash={currentReport?.netProfit || 0}
          />
        )}

        {/* TAB 4: Stock Inventory Manager */}
        {activeTab === 'stock' && (
          <StockManager selectedCurrency={selectedCurrency} />
        )}

        {/* TAB 5: Setup Guide */}
        {activeTab === 'setup' && (
          <SetupGuide />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-amber-700" />
            <span className="font-bold text-stone-800">Market Vendor Daily Ledger</span>
            <span>• Powered by Gemma 4 (Local AI)</span>
          </div>
          <p className="text-stone-400">
            Empowering small local business owners and market vendors with instant bookkeeping.
          </p>
        </div>
      </footer>

      {/* WhatsApp Export Modal */}
      {whatsappModalReport && (
        <WhatsAppExportModal
          report={whatsappModalReport}
          onClose={() => setWhatsappModalReport(null)}
        />
      )}

    </div>
  );
}
