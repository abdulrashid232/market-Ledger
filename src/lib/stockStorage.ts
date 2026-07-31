import { StockProduct, StockTransaction } from '../types';

// ── Products ─────────────────────────────────────────────────────────────────

export async function getStockProducts(): Promise<StockProduct[]> {
  try {
    const res = await fetch('/api/stock/products');
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('Failed to load stock products:', err);
    return [];
  }
}

export async function saveStockProduct(product: StockProduct): Promise<void> {
  await fetch('/api/stock/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
}

export async function deleteStockProduct(id: string): Promise<void> {
  await fetch(`/api/stock/products/${id}`, { method: 'DELETE' });
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getStockTransactions(): Promise<StockTransaction[]> {
  try {
    const res = await fetch('/api/stock/transactions');
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('Failed to load stock transactions:', err);
    return [];
  }
}

// ── Restock ───────────────────────────────────────────────────────────────────

export async function restockProduct(
  productId: string,
  quantity: number,
  unitCost: number,
  date: string,
  notes?: string
): Promise<void> {
  await fetch('/api/stock/restock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, unitCost, date, notes }),
  });
}

// ── Manual Adjustment ─────────────────────────────────────────────────────────

export async function adjustStockProduct(
  productId: string,
  newStock: number,
  notes: string,
  date: string
): Promise<void> {
  await fetch('/api/stock/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, newStock, notes, date }),
  });
}

// ── AI Restock Processing ─────────────────────────────────────────────────────

export interface AIRestockItem {
  itemName: string;
  quantityReceived: number;
  unitCost?: number;
  notes?: string;
}

export interface RestockSummary {
  restocked: Array<{ productName: string; quantity: number; unit: string }>;
  unmatched: string[];
}

export async function processAIRestocks(
  restocks: AIRestockItem[],
  date: string
): Promise<RestockSummary> {
  try {
    const res = await fetch('/api/stock/process-restocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restocks, date }),
    });
    if (!res.ok) return { restocked: [], unmatched: [] };
    return res.json();
  } catch (err) {
    console.error('Failed to process AI restocks:', err);
    return { restocked: [], unmatched: [] };
  }
}

// ── Deduct sales from stock ───────────────────────────────────────────────────

export interface DeductionResult {
  productName: string;
  deducted: number;
  unit: string;
}

export interface DeductionSummary {
  deducted: DeductionResult[];
  unmatched: string[];
}

export async function deductSalesFromStock(
  sales: Array<{ itemName: string; quantitySold: number }>,
  reportId: string,
  date: string
): Promise<DeductionSummary> {
  try {
    const res = await fetch('/api/stock/deduct-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales, reportId, date }),
    });
    if (!res.ok) return { deducted: [], unmatched: [] };
    return res.json();
  } catch (err) {
    console.error('Failed to deduct sales from stock:', err);
    return { deducted: [], unmatched: [] };
  }
}
