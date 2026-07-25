import { StockProduct, StockTransaction } from '../types';

const STOCK_PRODUCTS_KEY = 'market_ledger_stock_products_v1';
const STOCK_TRANSACTIONS_KEY = 'market_ledger_stock_transactions_v1';

// ── Products ────────────────────────────────────────────────────────────────

export function getStockProducts(): StockProduct[] {
  try {
    const raw = localStorage.getItem(STOCK_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStockProduct(product: StockProduct): StockProduct[] {
  const products = getStockProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  let updated: StockProduct[];
  if (idx >= 0) {
    updated = [...products];
    updated[idx] = { ...product, updatedAt: Date.now() };
  } else {
    updated = [product, ...products];
  }
  localStorage.setItem(STOCK_PRODUCTS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteStockProduct(id: string): StockProduct[] {
  const updated = getStockProducts().filter((p) => p.id !== id);
  localStorage.setItem(STOCK_PRODUCTS_KEY, JSON.stringify(updated));
  return updated;
}

// ── Transactions ────────────────────────────────────────────────────────────

export function getStockTransactions(): StockTransaction[] {
  try {
    const raw = localStorage.getItem(STOCK_TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistTransaction(tx: StockTransaction): void {
  const txs = getStockTransactions();
  localStorage.setItem(STOCK_TRANSACTIONS_KEY, JSON.stringify([tx, ...txs]));
}

// ── Restock ─────────────────────────────────────────────────────────────────

export function restockProduct(
  productId: string,
  quantity: number,
  unitCost: number,
  date: string,
  notes?: string
): StockProduct[] {
  const products = getStockProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return products;

  product.currentStock += quantity;
  product.updatedAt = Date.now();
  if (unitCost > 0) product.unitCost = unitCost;

  localStorage.setItem(STOCK_PRODUCTS_KEY, JSON.stringify(products));

  persistTransaction({
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    productName: product.name,
    type: 'restock',
    quantity,
    unitCost,
    notes: notes || `Restocked ${quantity} ${product.unit}`,
    date,
    createdAt: Date.now(),
  });

  return products;
}

// ── Manual Adjustment ────────────────────────────────────────────────────────

export function adjustStockProduct(
  productId: string,
  newStock: number,
  notes: string,
  date: string
): StockProduct[] {
  const products = getStockProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return products;

  const diff = newStock - product.currentStock;
  product.currentStock = Math.max(0, newStock);
  product.updatedAt = Date.now();

  localStorage.setItem(STOCK_PRODUCTS_KEY, JSON.stringify(products));

  persistTransaction({
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    productName: product.name,
    type: 'adjustment',
    quantity: diff,
    notes: notes || 'Manual stock adjustment',
    date,
    createdAt: Date.now(),
  });

  return products;
}

// ── Auto-deduct from daily sales ─────────────────────────────────────────────

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

export function processAIRestocks(
  restocks: AIRestockItem[],
  date: string
): RestockSummary {
  const products = getStockProducts();
  const restocked: RestockSummary['restocked'] = [];
  const unmatched: string[] = [];

  for (const item of restocks) {
    const qty = Number(item.quantityReceived) || 0;
    if (qty <= 0) continue;

    const restockName = item.itemName.toLowerCase();
    const product = products.find((p) => {
      const prodName = p.name.toLowerCase();
      const minLen = Math.min(prodName.length, restockName.length, 4);
      return (
        prodName.slice(0, minLen) === restockName.slice(0, minLen) ||
        restockName.includes(prodName) ||
        prodName.includes(restockName)
      );
    });

    if (product) {
      restockProduct(product.id, qty, Number(item.unitCost) || 0, date, item.notes);
      restocked.push({ productName: product.name, quantity: qty, unit: product.unit });
    } else {
      unmatched.push(item.itemName);
    }
  }

  return { restocked, unmatched };
}

export interface DeductionResult {
  productName: string;
  deducted: number;
  unit: string;
}

export interface DeductionSummary {
  deducted: DeductionResult[];
  unmatched: string[]; // itemNames from sales with no matching product
}

export function deductSalesFromStock(
  sales: Array<{ itemName: string; quantitySold: number }>,
  reportId: string,
  date: string
): DeductionSummary {
  const products = getStockProducts();
  const deducted: DeductionResult[] = [];
  const unmatched: string[] = [];

  for (const sale of sales) {
    const qty = Number(sale.quantitySold) || 0;
    if (qty <= 0) continue;

    const saleName = sale.itemName.toLowerCase();

    // Match: catalogue name is contained in sale name, or vice versa (min 4 chars to avoid false positives)
    const product = products.find((p) => {
      const prodName = p.name.toLowerCase();
      const minLen = Math.min(prodName.length, saleName.length, 4);
      return (
        prodName.slice(0, minLen) === saleName.slice(0, minLen) ||
        saleName.includes(prodName) ||
        prodName.includes(saleName)
      );
    });

    if (product) {
      product.currentStock = Math.max(0, product.currentStock - qty);
      product.updatedAt = Date.now();

      persistTransaction({
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        productId: product.id,
        productName: product.name,
        type: 'sale',
        quantity: -qty,
        reportId,
        notes: `Auto-deducted: sold ${qty} ${product.unit} (from notes: "${sale.itemName}")`,
        date,
        createdAt: Date.now(),
      });

      deducted.push({ productName: product.name, deducted: qty, unit: product.unit });
    } else {
      unmatched.push(sale.itemName);
    }
  }

  if (deducted.length > 0) {
    localStorage.setItem(STOCK_PRODUCTS_KEY, JSON.stringify(products));
  }

  return { deducted, unmatched };
}
