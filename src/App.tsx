import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NoteInputSection } from './components/NoteInputSection';
import { ReportView } from './components/ReportView';
import { HistoryView } from './components/HistoryView';
import { TillCalculator } from './components/TillCalculator';
import { WhatsAppExportModal } from './components/WhatsAppExportModal';
import { CurrencyCode, DailyLedgerReport } from './types';
import { getSavedReports, saveReport, deleteReport } from './lib/ledgerStorage';
import { AlertCircle, Sparkles, Store, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'till' | 'presets'>('new');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('GHS');
  
  const [reports, setReports] = useState<DailyLedgerReport[]>([]);
  const [currentReport, setCurrentReport] = useState<DailyLedgerReport | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [whatsappModalReport, setWhatsappModalReport] = useState<DailyLedgerReport | null>(null);

  useEffect(() => {
    // Load historical reports on mount
    const saved = getSavedReports();
    setReports(saved);
    if (saved.length > 0 && !currentReport) {
      setCurrentReport(saved[0]);
    }
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
      const res = await fetch('/api/analyze-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process notes with Gemini API.');
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
      const updatedList = saveReport(newReport);
      setReports(updatedList);
      setIsAnalyzing(false);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while analyzing notes.');
      setIsAnalyzing(false);
    }
  };

  const handleUpdateCurrentReport = (updated: DailyLedgerReport) => {
    setCurrentReport(updated);
    const updatedList = saveReport(updated);
    setReports(updatedList);
  };

  const handleDeleteReport = (id: string) => {
    const updatedList = deleteReport(id);
    setReports(updatedList);
    if (currentReport?.id === id) {
      setCurrentReport(updatedList.length > 0 ? updatedList[0] : null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab === 'presets' ? 'new' : activeTab}
        setActiveTab={setActiveTab}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
      />

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
                  const updated = saveReport(rep);
                  setReports(updated);
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

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-amber-700" />
            <span className="font-bold text-stone-800">Market Vendor Daily Ledger</span>
            <span>• Powered by Gemma / Gemini 3.6 Flash</span>
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
