import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DailyLedgerReport, CurrencyCode } from '../types';
import { formatMoney } from '../lib/constants';
import { BarChart3, Calendar, Trash2, Eye, TrendingUp, DollarSign, Package, FileText } from 'lucide-react';

interface HistoryViewProps {
  reports: DailyLedgerReport[];
  selectedCurrency: CurrencyCode;
  onSelectReport: (report: DailyLedgerReport) => void;
  onDeleteReport: (reportId: string) => void;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

export const HistoryView: React.FC<HistoryViewProps> = ({
  reports,
  selectedCurrency,
  onSelectReport,
  onDeleteReport,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Calculate totals across reports
  const totalRevSum = reports.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalExpSum = reports.reduce((acc, r) => acc + r.totalExpenses, 0);
  const totalNetProfit = totalRevSum - totalExpSum;
  const avgProfitPerDay = reports.length > 0 ? totalNetProfit / reports.length : 0;

  // Prepare chart data for Revenue vs Expense trend
  const trendData = [...reports]
    .reverse()
    .map((r) => ({
      date: r.date,
      Revenue: r.totalRevenue,
      Expense: r.totalExpenses,
      Profit: r.netProfit,
    }));

  // Prepare chart data for Sales Category distribution
  const categoryMap: Record<string, number> = {};
  reports.forEach((r) => {
    r.sales.forEach((s) => {
      const cat = s.category || 'General Goods';
      categoryMap[cat] = (categoryMap[cat] || 0) + s.totalRevenue;
    });
  });

  const categoryPieData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  const filteredReports = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.date.includes(q) ||
      r.summaryHeadline.toLowerCase().includes(q) ||
      r.rawNotes.toLowerCase().includes(q) ||
      (r.vendorName && r.vendorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Total Historical Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {formatMoney(totalRevSum, selectedCurrency)}
          </p>
          <p className="text-xs text-stone-500 mt-1">{reports.length} Daily Ledgers Recorded</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Total Historical Expenses</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {formatMoney(totalExpSum, selectedCurrency)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Market tolls, freight & stock</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Net Accumulated Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className={`text-2xl font-black mt-2 ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatMoney(totalNetProfit, selectedCurrency)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Avg {formatMoney(avgProfitPerDay, selectedCurrency)} / day
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Logged Reports</span>
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {reports.length}
          </p>
          <p className="text-xs text-stone-500 mt-1">Saved in local storage</p>
        </div>

      </div>

      {/* Visual Charts */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue & Expense Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              Daily Revenue vs Expense Trends
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => formatMoney(Number(val) || 0, selectedCurrency)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E7E5E4', fontSize: '12px' }}
                  />
                  <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Category Distribution Pie Chart (1 col) */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              Revenue by Product Category
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatMoney(Number(val) || 0, selectedCurrency)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Historical Ledgers List Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              Saved Historical Daily Ledgers
            </h3>
            <p className="text-xs text-stone-500">Click any report to view or edit full details</p>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search date, vendor or notes..."
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs w-full sm:w-64 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {filteredReports.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-8 text-center">
            No matching daily ledger reports found.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-stone-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-900 text-sm">{r.date}</span>
                    {r.vendorName && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                        {r.vendorName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-emerald-900">{r.summaryHeadline}</p>
                  <p className="text-[11px] text-stone-500 line-clamp-1 italic">"{r.rawNotes}"</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-700">
                      +{formatMoney(r.totalRevenue, r.currency || selectedCurrency)}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      Net: {formatMoney(r.netProfit, r.currency || selectedCurrency)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectReport(r)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 cursor-pointer transition-all shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => onDeleteReport(r.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
