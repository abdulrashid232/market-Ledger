import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'market-ledger.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    currency TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    raw_notes TEXT NOT NULL,
    vendor_name TEXT,
    business_type TEXT,
    summary_headline TEXT NOT NULL,
    total_revenue REAL NOT NULL DEFAULT 0,
    total_expenses REAL NOT NULL DEFAULT 0,
    net_profit REAL NOT NULL DEFAULT 0,
    cash_in_drawer REAL,
    cash_discrepancy REAL,
    sales TEXT NOT NULL DEFAULT '[]',
    expenses TEXT NOT NULL DEFAULT '[]',
    inventory TEXT NOT NULL DEFAULT '[]',
    feedback TEXT NOT NULL DEFAULT '[]',
    insights TEXT NOT NULL DEFAULT '[]',
    tasks TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock REAL NOT NULL DEFAULT 0,
    low_stock_threshold REAL NOT NULL DEFAULT 0,
    unit_cost REAL NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL,
    notes TEXT,
    report_id TEXT,
    date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

// Seed stock products if the DB is empty
const productCount = (db.prepare('SELECT COUNT(*) as count FROM stock_products').get() as { count: number }).count;
if (productCount === 0) {
  const now = Date.now();
  const insertProduct = db.prepare(`
    INSERT INTO stock_products (id, name, category, unit, current_stock, low_stock_threshold, unit_cost, unit_price, created_at, updated_at)
    VALUES (@id, @name, @category, @unit, @current_stock, @low_stock_threshold, @unit_cost, @unit_price, @created_at, @updated_at)
  `);

  const products = [
    { id: 'prod-1', name: 'Perfumed Royal Feast Rice (50kg)', category: 'Grains & Staple', unit: 'bags', current_stock: 20, low_stock_threshold: 5, unit_cost: 380, unit_price: 480 },
    { id: 'prod-2', name: 'Yellow Gari Bag (10kg)', category: 'Grains & Staple', unit: 'bags', current_stock: 15, low_stock_threshold: 5, unit_cost: 18, unit_price: 25 },
    { id: 'prod-3', name: 'Frytol Palm Oil (Gallon)', category: 'Oils & Spices', unit: 'gallons', current_stock: 8, low_stock_threshold: 3, unit_cost: 85, unit_price: 110 },
    { id: 'prod-4', name: 'Techiman Fresh Tomatoes (Crate)', category: 'Produce', unit: 'crates', current_stock: 10, low_stock_threshold: 4, unit_cost: 90, unit_price: 120 },
    { id: 'prod-5', name: 'Bawku Onions (Sack)', category: 'Produce', unit: 'sacks', current_stock: 12, low_stock_threshold: 3, unit_cost: 150, unit_price: 190 },
    { id: 'prod-6', name: 'Ripe Plantain Bunches', category: 'Produce', unit: 'bunches', current_stock: 30, low_stock_threshold: 10, unit_cost: 25, unit_price: 38 },
    { id: 'prod-7', name: 'Ideal Canned Milk (Tin)', category: 'General Goods', unit: 'tins', current_stock: 48, low_stock_threshold: 12, unit_cost: 4, unit_price: 6 },
    { id: 'prod-8', name: 'Titus Sardines (Tin)', category: 'Meat & Fish', unit: 'tins', current_stock: 36, low_stock_threshold: 10, unit_cost: 8, unit_price: 12 },
    { id: 'prod-9', name: 'Dried Herrings (Koobi)', category: 'Meat & Fish', unit: 'kg', current_stock: 20, low_stock_threshold: 5, unit_cost: 30, unit_price: 45 },
    { id: 'prod-10', name: 'Groundnut Oil (2L Bottle)', category: 'Oils & Spices', unit: 'bottles', current_stock: 15, low_stock_threshold: 4, unit_cost: 40, unit_price: 55 },
    { id: 'prod-11', name: 'Brown Sugar (1kg)', category: 'General Goods', unit: 'kg', current_stock: 25, low_stock_threshold: 8, unit_cost: 7, unit_price: 10 },
    { id: 'prod-12', name: 'Polybags / Carriers (Bundle)', category: 'General Goods', unit: 'bundles', current_stock: 5, low_stock_threshold: 2, unit_cost: 12, unit_price: 18 },
  ];

  for (const p of products) {
    insertProduct.run({ ...p, created_at: now, updated_at: now });
  }
}

// Seed sample reports if the DB is empty
const reportCount = (db.prepare('SELECT COUNT(*) as count FROM reports').get() as { count: number }).count;
if (reportCount === 0) {
  const now = Date.now();
  const insertReport = db.prepare(`
    INSERT INTO reports (id, date, currency, currency_symbol, raw_notes, vendor_name, business_type,
      summary_headline, total_revenue, total_expenses, net_profit, sales, expenses, inventory,
      feedback, insights, tasks, created_at)
    VALUES (@id, @date, @currency, @currency_symbol, @raw_notes, @vendor_name, @business_type,
      @summary_headline, @total_revenue, @total_expenses, @net_profit, @sales, @expenses, @inventory,
      @feedback, @insights, @tasks, @created_at)
  `);

  insertReport.run({
    id: 'seed-report-1',
    date: '2026-07-30',
    currency: 'GHS',
    currency_symbol: '₵',
    raw_notes: 'Sold 10 bags of perfumed rice at 480 GHC each, 12 tins of milk for 72 GHC, 10 bags of yellow gari at 25 GHC each. Mrs. Mensah complained tomatoes had soft spots. Paid 60 GHC market toll and 40 GHC porter transport. Restock needed: 15 bags rice, 5 gallons palm oil.',
    vendor_name: 'Auntie Agnes',
    business_type: 'Rice & Provisions Stall',
    summary_headline: 'Strong rice sales driven by weekend demand, netting 4,822 GHC profit after minor toll and transport fees.',
    total_revenue: 5122,
    total_expenses: 100,
    net_profit: 5022,
    sales: JSON.stringify([
      { id: 's1', itemName: 'Perfumed Royal Feast Rice (50kg)', quantitySold: 10, unitPrice: 480, totalRevenue: 4800, category: 'Grains & Staple' },
      { id: 's2', itemName: 'Ideal Canned Milk (Tin)', quantitySold: 12, unitPrice: 6, totalRevenue: 72, category: 'General Goods' },
      { id: 's3', itemName: 'Yellow Gari Bag (10kg)', quantitySold: 10, unitPrice: 25, totalRevenue: 250, category: 'Grains & Staple' },
    ]),
    expenses: JSON.stringify([
      { id: 'e1', description: 'Market Sanitation & Toll Fee', cost: 60, category: 'Market Toll & Fees' },
      { id: 'e2', description: 'Porter Loading & Offloading', cost: 40, category: 'Transport & Freight' },
    ]),
    inventory: JSON.stringify([
      { id: 'i1', itemName: 'Perfumed Rice Bags', status: 'restock_needed', estimatedRemaining: '2 bags left', restockQuantityNeeded: '15 bags' },
      { id: 'i2', itemName: 'Frytol Palm Oil (Gallons)', status: 'low_stock', estimatedRemaining: '1 gallon', restockQuantityNeeded: '5 gallons' },
      { id: 'i3', itemName: 'Yellow Gari Bags', status: 'in_stock', estimatedRemaining: '8 bags left' },
    ]),
    feedback: JSON.stringify([
      { id: 'f1', customerComment: 'Mrs. Mensah reported soft spots and fast spoilage on wholesale tomatoes.', category: 'complaint', severity: 'medium', suggestedAction: 'Inspect supplier tomato crates individually before accepting delivery.' },
    ]),
    insights: JSON.stringify([
      { id: 'in1', title: 'Bundle High-Margin Staples', description: 'Offer 1 bag of rice + 1 tin of milk at a 5 GHC bundled discount to clear remaining milk inventory faster.', category: 'pricing', impact: 'high' },
      { id: 'in2', title: 'Supplier Quality Check', description: 'Request a fresh non-soft batch of tomatoes from Techiman supplier before paying full crate rate.', category: 'supplier', impact: 'high' },
    ]),
    tasks: JSON.stringify([
      { id: 't1', task: 'Call Techiman supplier at 7:00 AM for fresh tomato crates', priority: 'high', completed: true },
      { id: 't2', task: 'Restock 15 bags of perfumed rice from wholesale depot', priority: 'high', completed: false },
    ]),
    created_at: now - 86400000,
  });

  insertReport.run({
    id: 'seed-report-2',
    date: '2026-07-29',
    currency: 'GHS',
    currency_symbol: '₵',
    raw_notes: 'Sold 8 crates tomatoes at 120 GHC, 10 sacks onions at 190 GHC, 20 plantain bunches at 38 GHC. Customer complained prices increased. Paid 100 GHC truck offloading.',
    vendor_name: 'Uncle Kofi',
    business_type: 'Fresh Produce Vendor',
    summary_headline: 'High produce volume with steady demand; total revenue reached 3,620 GHC.',
    total_revenue: 3620,
    total_expenses: 100,
    net_profit: 3520,
    sales: JSON.stringify([
      { id: 's21', itemName: 'Techiman Fresh Tomatoes (Crate)', quantitySold: 8, unitPrice: 120, totalRevenue: 960, category: 'Produce' },
      { id: 's22', itemName: 'Bawku Onions (Sack)', quantitySold: 10, unitPrice: 190, totalRevenue: 1900, category: 'Produce' },
      { id: 's23', itemName: 'Ripe Plantain Bunches', quantitySold: 20, unitPrice: 38, totalRevenue: 760, category: 'Produce' },
    ]),
    expenses: JSON.stringify([
      { id: 'e21', description: 'Truck Offloading & Loading', cost: 100, category: 'Transport & Freight' },
    ]),
    inventory: JSON.stringify([
      { id: 'i21', itemName: 'Fresh Tomatoes', status: 'restock_needed', estimatedRemaining: '1 crate left', restockQuantityNeeded: '12 crates' },
      { id: 'i22', itemName: 'Onion Sacks', status: 'in_stock', estimatedRemaining: '5 sacks' },
    ]),
    feedback: JSON.stringify([
      { id: 'f21', customerComment: 'Buyer complained tomato price increased by 10 GHC since last week.', category: 'price_concern', severity: 'low', suggestedAction: 'Explain wholesale transportation cost increase gently to regular buyers.' },
    ]),
    insights: JSON.stringify([
      { id: 'in21', title: 'Diversify into Ginger & Garlic', description: 'Several buyers inquired about ginger; starting with a small 10kg bag could add 150 GHC daily profit.', category: 'inventory', impact: 'medium' },
    ]),
    tasks: JSON.stringify([
      { id: 't21', task: 'Purchase 12 crates of fresh tomatoes from early morning truck', priority: 'high', completed: false },
    ]),
    created_at: now - 172800000,
  });
}

export default db;
