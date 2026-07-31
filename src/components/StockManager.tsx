import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
  X,
  ClipboardList,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { StockProduct, StockTransaction, CurrencyCode } from '../types';
import { formatMoney } from '../lib/constants';
import {
  getStockProducts,
  saveStockProduct,
  deleteStockProduct,
  getStockTransactions,
  restockProduct,
  adjustStockProduct,
} from '../lib/stockStorage';

interface StockManagerProps {
  selectedCurrency: CurrencyCode;
}

const CATEGORIES = [
  'Grains & Staple',
  'Produce',
  'Meat & Fish',
  'Oils & Spices',
  'Dairy & Beverages',
  'Textiles & Apparel',
  'General Goods',
  'Packaging',
  'Other',
];

const UNITS = ['bags', 'kg', 'crates', 'pieces', 'bottles', 'tins', 'gallons', 'bunches', 'sacks', 'boxes', 'litres', 'trays'];

const emptyForm = {
  name: '',
  category: 'Grains & Staple',
  unit: 'bags',
  currentStock: '',
  lowStockThreshold: '',
  unitCost: '',
  unitPrice: '',
};

function getStockStatus(product: StockProduct): 'out' | 'critical' | 'low' | 'ok' {
  if (product.currentStock === 0) return 'out';
  if (product.currentStock <= product.lowStockThreshold * 0.5) return 'critical';
  if (product.currentStock <= product.lowStockThreshold) return 'low';
  return 'ok';
}

function StockStatusBadge({ product }: { product: StockProduct }) {
  const status = getStockStatus(product);
  const config = {
    out:      { label: 'Out of Stock',  cls: 'bg-red-100 text-red-800 border-red-200' },
    critical: { label: 'Critical',      cls: 'bg-orange-100 text-orange-800 border-orange-200' },
    low:      { label: 'Low Stock',     cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    ok:       { label: 'In Stock',      cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  }[status];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.cls}`}>
      {config.label}
    </span>
  );
}

function StockBar({ product }: { product: StockProduct }) {
  const status = getStockStatus(product);
  const max = Math.max(product.lowStockThreshold * 2, product.currentStock, 1);
  const pct = Math.min(100, (product.currentStock / max) * 100);
  const color = { out: 'bg-red-500', critical: 'bg-orange-500', low: 'bg-amber-400', ok: 'bg-emerald-500' }[status];
  return (
    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const StockManager: React.FC<StockManagerProps> = ({ selectedCurrency }) => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'log'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'low' | 'critical' | 'out'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');

  // Inline restock state
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');

  // Inline adjust state
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([getStockProducts(), getStockTransactions()]).then(([prods, txs]) => {
      setProducts(prods);
      setTransactions(txs);
    });
  }, []);

  async function reload() {
    const [prods, txs] = await Promise.all([getStockProducts(), getStockTransactions()]);
    setProducts(prods);
    setTransactions(txs);
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalValue = products.reduce((s, p) => s + p.currentStock * p.unitCost, 0);
  const lowCount = products.filter((p) => ['low', 'critical', 'out'].includes(getStockStatus(p))).length;
  const outCount = products.filter((p) => getStockStatus(p) === 'out').length;

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || getStockStatus(p) === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Modal ────────────────────────────────────────────────────────────────
  function openAddModal() {
    setEditingProduct(null);
    setForm({ ...emptyForm });
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(product: StockProduct) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      currentStock: String(product.currentStock),
      lowStockThreshold: String(product.lowStockThreshold),
      unitCost: String(product.unitCost),
      unitPrice: String(product.unitPrice),
    });
    setFormError('');
    setShowModal(true);
  }

  function handleSaveProduct() {
    if (!form.name.trim()) { setFormError('Product name is required.'); return; }
    if (isNaN(Number(form.currentStock)) || Number(form.currentStock) < 0) { setFormError('Current stock must be a valid number.'); return; }
    if (isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0) { setFormError('Low stock threshold must be a valid number.'); return; }

    const product: StockProduct = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      currentStock: Number(form.currentStock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      unitCost: Number(form.unitCost) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      createdAt: editingProduct?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveStockProduct(product).then(() => reload());
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteStockProduct(id).then(() => reload());
  }

  // ── Restock ──────────────────────────────────────────────────────────────
  function handleRestock(productId: string) {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    setRestockingId(null);
    setRestockQty('');
    setRestockCost('');
    restockProduct(productId, qty, Number(restockCost) || 0, today).then(() => reload());
  }

  // ── Adjust ───────────────────────────────────────────────────────────────
  function handleAdjust(productId: string) {
    const qty = Number(adjustQty);
    if (isNaN(qty) || qty < 0) return;
    setAdjustingId(null);
    setAdjustQty('');
    setAdjustNotes('');
    adjustStockProduct(productId, qty, adjustNotes || 'Manual adjustment', today).then(() => reload());
  }

  const txTypeConfig = {
    sale:       { label: 'Sale',       icon: ArrowUpCircle,   cls: 'text-rose-600'    },
    restock:    { label: 'Restock',    icon: ArrowDownCircle, cls: 'text-emerald-600' },
    adjustment: { label: 'Adjustment', icon: SlidersHorizontal, cls: 'text-blue-600'  },
    spoilage:   { label: 'Spoilage',   icon: AlertTriangle,   cls: 'text-orange-600'  },
  };

  return (
    <div className="space-y-6">

      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Total Products</span>
            <Package className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">{products.length}</p>
          <p className="text-xs text-stone-500 mt-1">in your catalogue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Stock Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{formatMoney(totalValue, selectedCurrency)}</p>
          <p className="text-xs text-stone-500 mt-1">at cost price</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Low / Critical</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{lowCount}</p>
          <p className="text-xs text-stone-500 mt-1">items need attention</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{outCount}</p>
          <p className="text-xs text-stone-500 mt-1">items fully depleted</p>
        </div>
      </div>

      {/* Alert Banner */}
      {lowCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-3 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>{lowCount} product{lowCount > 1 ? 's' : ''}</strong> {lowCount > 1 ? 'are' : 'is'} at or below the low stock threshold. Restock before your next market day.
          </span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="bg-white rounded-xl border border-stone-200 p-1.5 flex gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4 text-amber-700" />
          Stock Overview ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'log' ? 'bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-amber-700" />
          Transaction Log ({transactions.length})
        </button>
      </div>

      {/* ── STOCK OVERVIEW TAB ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500 bg-white text-stone-700 font-medium"
              >
                <option value="all">All Status</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {/* Empty State */}
          {products.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="font-bold text-stone-500">No products in your stock catalogue yet.</p>
              <p className="text-xs text-stone-400">Click "Add Product" to build your inventory. Once added, quantities will be auto-deducted whenever you analyze a daily ledger.</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                Add First Product
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((product) => {
                const isRestocking = restockingId === product.id;
                const isAdjusting = adjustingId === product.id;
                const status = getStockStatus(product);

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl border shadow-2xs p-5 space-y-4 transition-all ${
                      status === 'out' ? 'border-red-200' : status === 'critical' ? 'border-orange-200' : status === 'low' ? 'border-amber-200' : 'border-stone-200/90'
                    }`}
                  >
                    {/* Product Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-stone-900 text-sm leading-tight truncate">{product.name}</h3>
                        <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded mt-1 inline-block">
                          {product.category}
                        </span>
                      </div>
                      <StockStatusBadge product={product} />
                    </div>

                    {/* Stock Level */}
                    <div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className={`text-3xl font-black ${status === 'out' ? 'text-red-600' : status === 'critical' ? 'text-orange-600' : status === 'low' ? 'text-amber-700' : 'text-stone-900'}`}>
                            {product.currentStock}
                          </span>
                          <span className="text-xs text-stone-500 ml-1.5 font-medium">{product.unit}</span>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          Min: {product.lowStockThreshold} {product.unit}
                        </span>
                      </div>
                      <StockBar product={product} />
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-4 text-xs text-stone-600 border-t border-stone-100 pt-3">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-semibold">Buy Price</span>
                        <span className="font-bold text-stone-800">{formatMoney(product.unitCost, selectedCurrency)}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-semibold">Sell Price</span>
                        <span className="font-bold text-emerald-700">{formatMoney(product.unitPrice, selectedCurrency)}</span>
                      </div>
                      {product.unitPrice > 0 && product.unitCost > 0 && (
                        <div>
                          <span className="text-stone-400 block text-[10px] uppercase font-semibold">Margin</span>
                          <span className="font-bold text-blue-700">
                            {(((product.unitPrice - product.unitCost) / product.unitPrice) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Inline Restock Form */}
                    {isRestocking && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-emerald-900">Restock {product.name}</p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={restockQty}
                            onChange={(e) => setRestockQty(e.target.value)}
                            placeholder={`Qty (${product.unit})`}
                            className="flex-1 text-xs border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <input
                            type="number"
                            min="0"
                            value={restockCost}
                            onChange={(e) => setRestockCost(e.target.value)}
                            placeholder="Unit cost"
                            className="flex-1 text-xs border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestock(product.id)}
                            disabled={!restockQty || Number(restockQty) <= 0}
                            className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Confirm Restock
                          </button>
                          <button
                            onClick={() => { setRestockingId(null); setRestockQty(''); setRestockCost(''); }}
                            className="px-3 text-xs font-bold bg-white border border-stone-200 text-stone-600 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Adjust Form */}
                    {isAdjusting && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-blue-900">Set Exact Stock — {product.name}</p>
                        <input
                          type="number"
                          min="0"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          placeholder={`New total (${product.unit})`}
                          className="w-full text-xs border border-blue-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={adjustNotes}
                          onChange={(e) => setAdjustNotes(e.target.value)}
                          placeholder="Reason (e.g. physical count)"
                          className="w-full text-xs border border-blue-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdjust(product.id)}
                            disabled={adjustQty === ''}
                            className="flex-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Set Stock
                          </button>
                          <button
                            onClick={() => { setAdjustingId(null); setAdjustQty(''); setAdjustNotes(''); }}
                            className="px-3 text-xs font-bold bg-white border border-stone-200 text-stone-600 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isRestocking && !isAdjusting && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => { setRestockingId(product.id); setAdjustingId(null); setAdjustQty(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Restock
                        </button>
                        <button
                          onClick={() => { setAdjustingId(product.id); setRestockingId(null); setRestockQty(''); setAdjustQty(String(product.currentStock)); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Adjust
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No search results */}
          {products.length > 0 && filtered.length === 0 && (
            <div className="text-center py-10 text-xs text-stone-400">
              No products match your search or filter.
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTION LOG TAB ───────────────────────────────────────────── */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-700" />
              Stock Movement History
            </h3>
            <p className="text-xs text-stone-500 mt-1">All stock changes — sales deductions, restocks, and manual adjustments.</p>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-8 text-center">No stock transactions recorded yet. Transactions are created automatically when you analyze daily ledgers or restock products.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Date</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Qty Change</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map((tx) => {
                    const cfg = txTypeConfig[tx.type];
                    const Icon = cfg.icon;
                    return (
                      <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-3 text-stone-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-3 font-semibold text-stone-900">{tx.productName}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 font-bold ${cfg.cls}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-black">
                          <span className={tx.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.quantity >= 0 ? '+' : ''}{tx.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-500 max-w-xs truncate">{tx.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT PRODUCT MODAL ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-base">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Perfumed Rice Bags"
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                    placeholder="0"
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Low Stock Alert At</label>
                  <input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    placeholder="5"
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Buy Price (per unit)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Sell Price (per unit)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveProduct}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all text-sm cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
