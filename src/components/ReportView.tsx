import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  MessageSquare,
  Lightbulb,
  CheckSquare,
  Volume2,
  Share2,
  Save,
  Printer,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ListFilter,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { DailyLedgerReport, CurrencyCode, SalesItem, ExpenseItem, InventoryItem, DailyTask } from '../types';
import { formatMoney } from '../lib/constants';

interface ReportViewProps {
  report: DailyLedgerReport;
  onUpdateReport: (updated: DailyLedgerReport) => void;
  onSaveToHistory: (report: DailyLedgerReport) => void;
  onOpenWhatsAppExport: (report: DailyLedgerReport) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onUpdateReport,
  onSaveToHistory,
  onOpenWhatsAppExport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'inventory' | 'feedback' | 'insights' | 'tasks'>('sales');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'restock' | 'low' | 'spoiled'>('all');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Audio Debrief state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const currency = report.currency || 'GHS';

  // Toggle inventory item check
  const toggleInventoryCheck = (id: string) => {
    const updatedInventory = report.inventory.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onUpdateReport({ ...report, inventory: updatedInventory });
  };

  // Toggle task completion
  const toggleTaskCompletion = (id: string) => {
    const updatedTasks = report.tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    onUpdateReport({ ...report, tasks: updatedTasks });
  };

  // Add custom manual sales item
  const handleAddSalesItem = () => {
    const newItem: SalesItem = {
      id: `sales-${Date.now()}`,
      itemName: 'Custom Market Item',
      quantitySold: 1,
      unitPrice: 10,
      totalRevenue: 10,
      category: 'General Goods',
    };
    const updatedSales = [...report.sales, newItem];
    const newTotalRev = updatedSales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const newNetProfit = newTotalRev - report.totalExpenses;
    onUpdateReport({
      ...report,
      sales: updatedSales,
      totalRevenue: newTotalRev,
      netProfit: newNetProfit,
    });
  };

  // Play Audio Debrief
  const handlePlayAudioDebrief = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    const textToRead = `Here is your daily ledger summary for ${report.date}. Total revenue made was ${formatMoney(
      report.totalRevenue,
      currency
    )}. Expenses were ${formatMoney(report.totalExpenses, currency)}. Net profit is ${formatMoney(
      report.netProfit,
      currency
    )}. Summary: ${report.summaryHeadline}. Top action item: ${
      report.insights[0]?.description || 'Check inventory and restock for tomorrow.'
    }`;

    try {
      const res = await fetch('/api/generate-audio-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textPrompt: textToRead }),
      });

      const data = await res.json();
      if (data.success && data.audioBase64) {
        // Convert base64 PCM to Audio object or AudioContext
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          fallbackSpeechSynth(textToRead);
        };
        await audio.play();
      } else {
        fallbackSpeechSynth(textToRead);
      }
    } catch (err) {
      fallbackSpeechSynth(textToRead);
    }
  };

  const fallbackSpeechSynth = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  const handleSave = () => {
    onSaveToHistory(report);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const filteredInventory = report.inventory.filter((item) => {
    if (inventoryFilter === 'restock') return item.status === 'restock_needed';
    if (inventoryFilter === 'low') return item.status === 'low_stock';
    if (inventoryFilter === 'spoiled') return item.status === 'spoiled_damaged';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Executive Summary Card Banner */}
      <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 text-stone-100 rounded-2xl p-6 shadow-md border border-amber-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-amber-800/60 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                Daily Report • {report.date}
              </span>
              {report.vendorName && (
                <span className="text-xs text-stone-300 font-medium">
                  Vendor: <strong>{report.vendorName}</strong> ({report.businessType || 'Market Vendor'})
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-amber-100 mt-2 tracking-tight">
              {report.summaryHeadline}
            </h2>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePlayAudioDebrief}
              disabled={isPlayingAudio}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-all"
              title="Listen to Audio Debrief"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-amber-400' : ''}`} />
              <span>{isPlayingAudio ? 'Playing Debrief...' : 'Listen Audio Summary'}</span>
            </button>

            <button
              onClick={() => onOpenWhatsAppExport(report)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 cursor-pointer transition-all shadow-sm"
            >
              {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Saved to History!' : 'Save Ledger'}</span>
            </button>
          </div>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          
          <div className="bg-amber-950/60 border border-amber-800/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {formatMoney(report.totalRevenue, currency)}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {report.sales.length} sales line items
            </p>
          </div>

          <div className="bg-amber-950/60 border border-amber-800/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-300 mt-1">
              {formatMoney(report.totalExpenses, currency)}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {report.expenses.length} expense items
            </p>
          </div>

          <div className="bg-amber-950/60 border border-amber-800/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>Net Profit</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <p className={`text-2xl font-black mt-1 ${report.netProfit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {formatMoney(report.netProfit, currency)}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {report.totalRevenue > 0
                ? `${((report.netProfit / report.totalRevenue) * 100).toFixed(0)}% profit margin`
                : 'Net outcome'}
            </p>
          </div>

          <div className="bg-amber-950/60 border border-amber-800/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
              <span>Restock Alerts</span>
              <Package className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-black text-orange-300 mt-1">
              {report.inventory.filter((i) => i.status === 'restock_needed' || i.status === 'low_stock').length} Items
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Action items flagged
            </p>
          </div>

        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-stone-200 p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'sales'
              ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Sales & Expenses ({report.sales.length + report.expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'inventory'
              ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4 text-orange-600" />
          <span>Inventory Checklist ({report.inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('feedback')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'feedback'
              ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Customer Voice ({report.feedback.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('insights')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'insights'
              ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>AI Business Advice ({report.insights.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tasks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'tasks'
              ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-purple-600" />
          <span>Tomorrow's To-Dos ({report.tasks.length})</span>
        </button>
      </div>

      {/* Sub-Tab Content */}

      {/* SUB-TAB 1: Sales & Expenses */}
      {activeSubTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sales Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
                Itemized Sales Revenue
              </h3>
              <button
                onClick={handleAddSalesItem}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sale</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 uppercase text-[10px] text-stone-500 font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Item Description</th>
                    <th className="py-2.5 px-2">Qty</th>
                    <th className="py-2.5 px-2">Unit Price</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {report.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {sale.itemName}
                        {sale.notes && <p className="text-[11px] text-stone-500 font-normal">{sale.notes}</p>}
                      </td>
                      <td className="py-3 px-2 font-medium text-stone-800">
                        {sale.quantitySold || 1}
                      </td>
                      <td className="py-3 px-2 text-stone-600">
                        {sale.unitPrice ? formatMoney(sale.unitPrice, currency) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700">
                          {sale.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700">
                        {formatMoney(sale.totalRevenue, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between items-center text-xs font-bold text-stone-900">
              <span>Gross Sales Sum</span>
              <span className="text-emerald-700 font-black text-base">
                {formatMoney(report.totalRevenue, currency)}
              </span>
            </div>
          </div>

          {/* Expenses Breakdown (1 col) */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                  <TrendingDown className="w-4 h-4" />
                </span>
                Business Expenses
              </h3>
            </div>

            <div className="space-y-3">
              {report.expenses.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No business expenses reported for today.</p>
              ) : (
                report.expenses.map((exp) => (
                  <div key={exp.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{exp.description}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-100">
                        {exp.category}
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-600">
                      -{formatMoney(exp.cost, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between items-center text-xs font-bold text-stone-900">
              <span>Total Expenses</span>
              <span className="text-rose-600 font-black text-base">
                {formatMoney(report.totalExpenses, currency)}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: Inventory Checklist */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Interactive Inventory & Restock Checklist
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Tick items off as you prepare or order stock for tomorrow morning.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 text-xs bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setInventoryFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${inventoryFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'}`}
              >
                All ({report.inventory.length})
              </button>
              <button
                onClick={() => setInventoryFilter('restock')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${inventoryFilter === 'restock' ? 'bg-red-500 text-white shadow-2xs' : 'text-stone-600'}`}
              >
                Restock Urgent
              </button>
              <button
                onClick={() => setInventoryFilter('low')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${inventoryFilter === 'low' ? 'bg-amber-500 text-white shadow-2xs' : 'text-stone-600'}`}
              >
                Low Stock
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredInventory.map((item) => {
              let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              let badgeLabel = 'In Stock';

              if (item.status === 'restock_needed') {
                badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                badgeLabel = 'Restock Needed';
              } else if (item.status === 'low_stock') {
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                badgeLabel = 'Low Stock';
              } else if (item.status === 'spoiled_damaged') {
                badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
                badgeLabel = 'Spoiled / Damaged';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => toggleInventoryCheck(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    item.checked
                      ? 'bg-stone-50 border-stone-200 opacity-60 line-through'
                      : 'bg-white border-stone-200 hover:border-amber-300 shadow-2xs'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!item.checked}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-400 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 text-sm">{item.itemName}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                      {item.estimatedRemaining && (
                        <span>Remaining: <strong>{item.estimatedRemaining}</strong></span>
                      )}
                      {item.restockQuantityNeeded && (
                        <span className="text-rose-700 font-semibold">
                          Need Order: <strong>{item.restockQuantityNeeded}</strong>
                        </span>
                      )}
                    </div>

                    {item.notes && <p className="mt-1 text-xs text-stone-500">{item.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Customer Voice & Feedback Intelligence */}
      {activeSubTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Customer Feedback & Intelligence
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Parsed from raw vendor notes with actionable response advice to retain customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.feedback.length === 0 ? (
              <p className="text-xs text-stone-500 italic col-span-2">No customer feedback was noted today.</p>
            ) : (
              report.feedback.map((fb) => {
                let catBadge = 'bg-stone-100 text-stone-800';
                if (fb.category === 'complaint') catBadge = 'bg-rose-100 text-rose-800';
                if (fb.category === 'praise') catBadge = 'bg-emerald-100 text-emerald-800';
                if (fb.category === 'price_concern') catBadge = 'bg-amber-100 text-amber-800';

                return (
                  <div key={fb.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${catBadge}`}>
                        {fb.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-stone-500 uppercase">
                        Severity: {fb.severity}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-stone-900">
                      "{fb.customerComment}"
                    </p>

                    <div className="pt-2 border-t border-stone-200/80">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Suggested Vendor Action:</span>
                      <p className="text-xs font-medium text-amber-900 mt-0.5 flex items-start gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>{fb.suggestedAction}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AI Business Advice */}
      {activeSubTab === 'insights' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              Actionable Business Advice & Growth Tips
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Gemma / Gemini tailored recommendations to increase sales, reduce waste, and negotiate supplier deals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.insights.map((ins) => (
              <div
                key={ins.id}
                className="p-5 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 to-orange-50/30 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 uppercase">
                    {ins.category}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500 uppercase">
                    Impact: {ins.impact}
                  </span>
                </div>

                <h4 className="font-bold text-stone-900 text-base">{ins.title}</h4>
                <p className="text-xs text-stone-700 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Tomorrow's To-Dos */}
      {activeSubTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              Tomorrow Morning Priority To-Dos
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Action items generated from today's ledger to start tomorrow prepared.
            </p>
          </div>

          <div className="space-y-2">
            {report.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTaskCompletion(task.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  task.completed
                    ? 'bg-stone-50 border-stone-200 line-through opacity-60'
                    : 'bg-white border-stone-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-stone-900">{task.task}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    task.priority === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : task.priority === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {task.priority} Priority
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
