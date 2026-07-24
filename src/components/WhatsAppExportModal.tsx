import React, { useState } from 'react';
import { Share2, Copy, Check, X, MessageSquare } from 'lucide-react';
import { DailyLedgerReport } from '../types';
import { formatMoney } from '../lib/constants';

interface WhatsAppExportModalProps {
  report: DailyLedgerReport | null;
  onClose: () => void;
}

export const WhatsAppExportModal: React.FC<WhatsAppExportModalProps> = ({
  report,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!report) return null;

  const currency = report.currency || 'GHS';

  // Construct formatted plain text report for WhatsApp / SMS
  const formattedText = `📊 *MARKET VENDOR DAILY REPORT* (${report.date})
*Vendor:* ${report.vendorName || 'Vendor'} | *Stall:* ${report.businessType || 'Market Stall'}

💰 *FINANCIAL SUMMARY*
• Revenue: ${formatMoney(report.totalRevenue, currency)}
• Expenses: ${formatMoney(report.totalExpenses, currency)}
• Net Profit: *${formatMoney(report.netProfit, currency)}*

📦 *TOP RESTRUCT & STOCK ALERTS*
${report.inventory
  .filter((i) => i.status === 'restock_needed' || i.status === 'low_stock')
  .map((i) => `• ${i.itemName} (${i.status.replace('_', ' ')}) - Need: ${i.restockQuantityNeeded || 'Restock'}`)
  .join('\n') || '• Stock levels optimal'}

💡 *DAILY SUMMARY*
"${report.summaryHeadline}"

📝 *TOMORROW'S TASKS*
${report.tasks.map((t) => `[ ] ${t.task}`).join('\n')}

_Generated via Market Vendor Daily Ledger AI_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            Share Ledger via WhatsApp / Message
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600">
          Below is a clean WhatsApp-formatted daily summary ready to copy or send directly to business partners, suppliers, or shop managers:
        </p>

        {/* Text Preview */}
        <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-xs font-mono text-stone-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
          {formattedText}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-800 hover:bg-stone-200 cursor-pointer transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open in WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
