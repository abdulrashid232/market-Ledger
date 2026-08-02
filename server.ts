import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'google/gemma-4-e2b';

function getLMStudioClient(): OpenAI {
  return new OpenAI({
    baseURL: LM_STUDIO_BASE_URL,
    apiKey: 'lm-studio',
  });
}


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/analyze-ledger', async (req, res) => {
  try {
    const { notes, currency = 'GHS', vendorName = 'Vendor', businessType = 'Market Stall', stockProducts = [] } = req.body;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({ error: 'Vendor notes text is required' });
    }

    const client = getLMStudioClient();

    const systemInstruction = `You are an expert market vendor business consultant, financial analyst, and bookkeeper specializing in informal market commerce (e.g. West African, East African, and local community marketplaces).
Your task is to take raw, messy, unstructured end-of-day notes written or spoken by a vendor and transform them into a precise, mathematically consistent, structured daily report.

CURRENCY: ${currency}

CRITICAL RULES:
1. Extract ALL sales line items mentioned. Calculate item totalRevenue = quantitySold * unitPrice where possible, or infer from context. Ensure the overall totalRevenue equals the sum of all individual sales item totalRevenues (or the stated gross cash sales).
2. Extract ALL expenses (transport, market tolls, supplier bills, bags/packaging, food, utilities). Sum them up into totalExpenses.
3. Calculate netProfit = totalRevenue - totalExpenses.
4. Extract Inventory Movement & Status:
   - Identify items sold, remaining stock, low stock items, spoiled/damaged items, or items needing urgent restock.
   - Categorize status as: 'in_stock', 'low_stock', 'restock_needed', or 'spoiled_damaged'.
5. Extract Customer Feedback & Feedback Intelligence:
   - Identify explicit customer complaints, compliments, pricing concerns, or requested products not currently stocked.
   - Categorize severity as 'low', 'medium', or 'high', and provide a practical, realistic suggested response action.
6. Extract Stock Received / Restocked Today:
   - Identify any new stock RECEIVED or DELIVERED from suppliers today (e.g. "received 20 bags rice", "got 5 gallons palm oil from depot", "new delivery of 10 crates tomatoes").
   - Put these in the "restocks" array with the quantity received and unit cost if mentioned.
   - Do NOT include items the vendor plans to buy tomorrow — only stock actually received today.
7. Generate 3-5 High-Value Actionable Business Insights:
   - Concrete, highly practical advice tailored for small market vendors (e.g., supplier negotiation tactics, pricing adjustments, stocking new requested items, preventing spoilage, bundling fast and slow movers).
8. Generate Tomorrow's Actionable To-Do List:
   - Priority items to execute first thing tomorrow morning.

Be realistic, practical, and highly empathetic to market vendors.

${stockProducts.length > 0 ? `STOCK CATALOGUE (registered products — use these EXACT names in the "itemName" field of sales when the item matches):
${stockProducts.map((p: any) => `- "${p.name}" | unit: ${p.unit} | category: ${p.category} | current stock: ${p.currentStock} ${p.unit}`).join('\n')}

When an item sold clearly matches a catalogue product, use the catalogue's exact name. If a sold item has NO match in the catalogue, still include it in sales — and set its "notes" field to "Not in stock catalogue — add to Stock Manager".
Similarly for restocks: if a received item matches a catalogue product, use the catalogue's exact name.` : ''}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "summaryHeadline": "string",
  "totalRevenue": number,
  "totalExpenses": number,
  "netProfit": number,
  "sales": [{ "itemName": "string", "quantitySold": number, "unitPrice": number, "totalRevenue": number, "category": "string", "notes": "string" }],
  "expenses": [{ "description": "string", "cost": number, "category": "string", "notes": "string" }],
  "restocks": [{ "itemName": "string", "quantityReceived": number, "unitCost": number, "notes": "string" }],
  "inventory": [{ "itemName": "string", "status": "in_stock|low_stock|restock_needed|spoiled_damaged", "estimatedRemaining": "string", "restockQuantityNeeded": "string", "notes": "string" }],
  "feedback": [{ "customerComment": "string", "category": "complaint|praise|inquiry|price_concern", "severity": "low|medium|high", "suggestedAction": "string" }],
  "insights": [{ "title": "string", "description": "string", "category": "pricing|inventory|customer_service|operations|supplier", "impact": "high|medium|low" }],
  "tasks": [{ "task": "string", "priority": "high|medium|low" }]
}`;

    const response = await client.chat.completions.create({
      model: LM_STUDIO_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Raw Vendor Notes:\n"""\n${notes}\n"""` },
      ],
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ledger_report',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summaryHeadline: { type: 'string' },
              totalRevenue: { type: 'number' },
              totalExpenses: { type: 'number' },
              netProfit: { type: 'number' },
              sales: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    itemName: { type: 'string' },
                    quantitySold: { type: 'number' },
                    unitPrice: { type: 'number' },
                    totalRevenue: { type: 'number' },
                    category: { type: 'string' },
                    notes: { type: 'string' },
                  },
                  required: ['itemName', 'totalRevenue'],
                },
              },
              expenses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    cost: { type: 'number' },
                    category: { type: 'string' },
                    notes: { type: 'string' },
                  },
                  required: ['description', 'cost'],
                },
              },
              restocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    itemName: { type: 'string' },
                    quantityReceived: { type: 'number' },
                    unitCost: { type: 'number' },
                    notes: { type: 'string' },
                  },
                  required: ['itemName', 'quantityReceived'],
                },
              },
              inventory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    itemName: { type: 'string' },
                    status: { type: 'string', enum: ['in_stock', 'low_stock', 'restock_needed', 'spoiled_damaged'] },
                    estimatedRemaining: { type: 'string' },
                    restockQuantityNeeded: { type: 'string' },
                    notes: { type: 'string' },
                  },
                  required: ['itemName', 'status'],
                },
              },
              feedback: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    customerComment: { type: 'string' },
                    category: { type: 'string', enum: ['complaint', 'praise', 'inquiry', 'price_concern'] },
                    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                    suggestedAction: { type: 'string' },
                  },
                  required: ['customerComment', 'category', 'suggestedAction'],
                },
              },
              insights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string', enum: ['pricing', 'inventory', 'customer_service', 'operations', 'supplier'] },
                    impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                  },
                  required: ['title', 'description', 'category', 'impact'],
                },
              },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  },
                  required: ['task', 'priority'],
                },
              },
            },
            required: ['summaryHeadline', 'totalRevenue', 'totalExpenses', 'netProfit', 'sales', 'expenses', 'restocks', 'inventory', 'feedback', 'insights', 'tasks'],
          },
        },
      } as any,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(content);

    // Recalculate totals server-side — local models often fail at arithmetic
    if (Array.isArray(parsedData.sales)) {
      parsedData.sales = parsedData.sales.map((s: any) => {
        const qty = Number(s.quantitySold) || 1;
        const unit = Number(s.unitPrice) || 0;
        const computed = qty * unit;
        // Use computed value if the model returned 0 but qty*unitPrice is valid
        if (computed > 0 && (!s.totalRevenue || s.totalRevenue === 0)) {
          s.totalRevenue = computed;
        }
        return s;
      });
      parsedData.totalRevenue = parsedData.sales.reduce((sum: number, s: any) => sum + (Number(s.totalRevenue) || 0), 0);
    }

    if (Array.isArray(parsedData.expenses)) {
      parsedData.totalExpenses = parsedData.expenses.reduce((sum: number, e: any) => sum + (Number(e.cost) || 0), 0);
    }

    parsedData.netProfit = (Number(parsedData.totalRevenue) || 0) - (Number(parsedData.totalExpenses) || 0);

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error analyzing ledger notes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process vendor notes with local LM Studio.',
    });
  }
});

// LM Studio status check — returns server info and loaded models
app.get('/api/lm-studio-status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${LM_STUDIO_BASE_URL}/models`, {
      signal: controller.signal,
      headers: { Authorization: 'Bearer lm-studio' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ connected: false, error: `LM Studio responded with ${response.status}` });
    }

    const data = await response.json() as any;
    const models: string[] = (data.data || []).map((m: any) => m.id);

    return res.json({
      connected: true,
      baseUrl: LM_STUDIO_BASE_URL,
      configuredModel: LM_STUDIO_MODEL,
      modelLoaded: models.includes(LM_STUDIO_MODEL),
      availableModels: models,
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      baseUrl: LM_STUDIO_BASE_URL,
      configuredModel: LM_STUDIO_MODEL,
      error: err.name === 'AbortError' ? 'Connection timed out — is LM Studio running?' : err.message,
    });
  }
});

// ── Helper: map DB row → DailyLedgerReport ────────────────────────────────
function rowToReport(row: any) {
  return {
    id: row.id,
    date: row.date,
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    rawNotes: row.raw_notes,
    vendorName: row.vendor_name,
    businessType: row.business_type,
    summaryHeadline: row.summary_headline,
    totalRevenue: row.total_revenue,
    totalExpenses: row.total_expenses,
    netProfit: row.net_profit,
    cashInDrawer: row.cash_in_drawer,
    cashDiscrepancy: row.cash_discrepancy,
    sales: JSON.parse(row.sales),
    expenses: JSON.parse(row.expenses),
    inventory: JSON.parse(row.inventory),
    feedback: JSON.parse(row.feedback),
    insights: JSON.parse(row.insights),
    tasks: JSON.parse(row.tasks),
    createdAt: row.created_at,
  };
}

// ── Helper: map DB row → StockProduct ─────────────────────────────────────
function rowToProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentStock: row.current_stock,
    lowStockThreshold: row.low_stock_threshold,
    unitCost: row.unit_cost,
    unitPrice: row.unit_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Helper: map DB row → StockTransaction ─────────────────────────────────
function rowToTransaction(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantity: row.quantity,
    unitCost: row.unit_cost,
    notes: row.notes,
    reportId: row.report_id,
    date: row.date,
    createdAt: row.created_at,
  };
}

// ── Fuzzy product matcher ──────────────────────────────────────────────────
function fuzzyFindProduct(products: any[], itemName: string) {
  const name = itemName.toLowerCase();
  return products.find((p: any) => {
    const prodName = p.name.toLowerCase();
    const minLen = Math.min(prodName.length, name.length, 4);
    return (
      prodName.slice(0, minLen) === name.slice(0, minLen) ||
      name.includes(prodName) ||
      prodName.includes(name)
    );
  });
}

// ── Reports API ────────────────────────────────────────────────────────────

app.get('/api/reports', (_req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
  res.json(rows.map(rowToReport));
});

app.post('/api/reports', (req, res) => {
  const r = req.body;
  db.prepare(`
    INSERT INTO reports (id, date, currency, currency_symbol, raw_notes, vendor_name, business_type,
      summary_headline, total_revenue, total_expenses, net_profit, cash_in_drawer, cash_discrepancy,
      sales, expenses, inventory, feedback, insights, tasks, created_at)
    VALUES (@id, @date, @currency, @currency_symbol, @raw_notes, @vendor_name, @business_type,
      @summary_headline, @total_revenue, @total_expenses, @net_profit, @cash_in_drawer, @cash_discrepancy,
      @sales, @expenses, @inventory, @feedback, @insights, @tasks, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date,
      currency = excluded.currency,
      currency_symbol = excluded.currency_symbol,
      raw_notes = excluded.raw_notes,
      vendor_name = excluded.vendor_name,
      business_type = excluded.business_type,
      summary_headline = excluded.summary_headline,
      total_revenue = excluded.total_revenue,
      total_expenses = excluded.total_expenses,
      net_profit = excluded.net_profit,
      cash_in_drawer = excluded.cash_in_drawer,
      cash_discrepancy = excluded.cash_discrepancy,
      sales = excluded.sales,
      expenses = excluded.expenses,
      inventory = excluded.inventory,
      feedback = excluded.feedback,
      insights = excluded.insights,
      tasks = excluded.tasks
  `).run({
    id: r.id,
    date: r.date,
    currency: r.currency,
    currency_symbol: r.currencySymbol,
    raw_notes: r.rawNotes,
    vendor_name: r.vendorName ?? null,
    business_type: r.businessType ?? null,
    summary_headline: r.summaryHeadline,
    total_revenue: r.totalRevenue,
    total_expenses: r.totalExpenses,
    net_profit: r.netProfit,
    cash_in_drawer: r.cashInDrawer ?? null,
    cash_discrepancy: r.cashDiscrepancy ?? null,
    sales: JSON.stringify(r.sales ?? []),
    expenses: JSON.stringify(r.expenses ?? []),
    inventory: JSON.stringify(r.inventory ?? []),
    feedback: JSON.stringify(r.feedback ?? []),
    insights: JSON.stringify(r.insights ?? []),
    tasks: JSON.stringify(r.tasks ?? []),
    created_at: r.createdAt,
  });
  res.json({ success: true });
});

app.delete('/api/reports/:id', (req, res) => {
  db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Stock Products API ─────────────────────────────────────────────────────

app.get('/api/stock/products', (_req, res) => {
  const rows = db.prepare('SELECT * FROM stock_products ORDER BY created_at DESC').all();
  res.json(rows.map(rowToProduct));
});

app.post('/api/stock/products', (req, res) => {
  const p = req.body;
  db.prepare(`
    INSERT INTO stock_products (id, name, category, unit, current_stock, low_stock_threshold,
      unit_cost, unit_price, created_at, updated_at)
    VALUES (@id, @name, @category, @unit, @current_stock, @low_stock_threshold,
      @unit_cost, @unit_price, @created_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      unit = excluded.unit,
      current_stock = excluded.current_stock,
      low_stock_threshold = excluded.low_stock_threshold,
      unit_cost = excluded.unit_cost,
      unit_price = excluded.unit_price,
      updated_at = excluded.updated_at
  `).run({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    current_stock: p.currentStock,
    low_stock_threshold: p.lowStockThreshold,
    unit_cost: p.unitCost,
    unit_price: p.unitPrice,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  });
  res.json({ success: true });
});

app.delete('/api/stock/products/:id', (req, res) => {
  db.prepare('DELETE FROM stock_products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Stock Transactions API ─────────────────────────────────────────────────

app.get('/api/stock/transactions', (_req, res) => {
  const rows = db.prepare('SELECT * FROM stock_transactions ORDER BY created_at DESC').all();
  res.json(rows.map(rowToTransaction));
});

app.post('/api/stock/transactions', (req, res) => {
  const t = req.body;
  db.prepare(`
    INSERT INTO stock_transactions (id, product_id, product_name, type, quantity, unit_cost,
      notes, report_id, date, created_at)
    VALUES (@id, @product_id, @product_name, @type, @quantity, @unit_cost,
      @notes, @report_id, @date, @created_at)
  `).run({
    id: t.id,
    product_id: t.productId,
    product_name: t.productName,
    type: t.type,
    quantity: t.quantity,
    unit_cost: t.unitCost ?? null,
    notes: t.notes ?? null,
    report_id: t.reportId ?? null,
    date: t.date,
    created_at: t.createdAt,
  });
  res.json({ success: true });
});

// ── Restock a product ──────────────────────────────────────────────────────

app.post('/api/stock/restock', (req, res) => {
  const { productId, quantity, unitCost, date, notes } = req.body;
  const row = db.prepare('SELECT * FROM stock_products WHERE id = ?').get(productId) as any;
  if (!row) return res.status(404).json({ error: 'Product not found' });

  const newStock = row.current_stock + quantity;
  const now = Date.now();
  db.prepare('UPDATE stock_products SET current_stock = ?, unit_cost = ?, updated_at = ? WHERE id = ?')
    .run(newStock, unitCost > 0 ? unitCost : row.unit_cost, now, productId);

  db.prepare(`
    INSERT INTO stock_transactions (id, product_id, product_name, type, quantity, unit_cost, notes, date, created_at)
    VALUES (?, ?, ?, 'restock', ?, ?, ?, ?, ?)
  `).run(
    `tx-${now}-${Math.random().toString(36).slice(2)}`,
    productId, row.name, quantity, unitCost,
    notes || `Restocked ${quantity} ${row.unit}`,
    date, now
  );

  res.json({ success: true });
});

// ── Adjust stock ───────────────────────────────────────────────────────────

app.post('/api/stock/adjust', (req, res) => {
  const { productId, newStock, notes, date } = req.body;
  const row = db.prepare('SELECT * FROM stock_products WHERE id = ?').get(productId) as any;
  if (!row) return res.status(404).json({ error: 'Product not found' });

  const diff = newStock - row.current_stock;
  const clamped = Math.max(0, newStock);
  const now = Date.now();
  db.prepare('UPDATE stock_products SET current_stock = ?, updated_at = ? WHERE id = ?')
    .run(clamped, now, productId);

  db.prepare(`
    INSERT INTO stock_transactions (id, product_id, product_name, type, quantity, notes, date, created_at)
    VALUES (?, ?, ?, 'adjustment', ?, ?, ?, ?)
  `).run(
    `tx-${now}-${Math.random().toString(36).slice(2)}`,
    productId, row.name, diff,
    notes || 'Manual stock adjustment',
    date, now
  );

  res.json({ success: true });
});

// ── Deduct sales from stock ────────────────────────────────────────────────

app.post('/api/stock/deduct-sales', (req, res) => {
  const { sales, reportId, date } = req.body as {
    sales: Array<{ itemName: string; quantitySold: number }>;
    reportId: string;
    date: string;
  };

  const products = (db.prepare('SELECT * FROM stock_products').all() as any[]).map(rowToProduct);
  const deducted: Array<{ productName: string; deducted: number; unit: string }> = [];
  const unmatched: string[] = [];

  const updateStmt = db.prepare('UPDATE stock_products SET current_stock = ?, updated_at = ? WHERE id = ?');
  const insertTx = db.prepare(`
    INSERT INTO stock_transactions (id, product_id, product_name, type, quantity, notes, report_id, date, created_at)
    VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?)
  `);

  const deductAll = db.transaction(() => {
    for (const sale of sales) {
      const qty = Number(sale.quantitySold) || 0;
      if (qty <= 0) continue;
      const product = fuzzyFindProduct(products, sale.itemName);
      if (product) {
        const newStock = Math.max(0, product.currentStock - qty);
        const now = Date.now();
        updateStmt.run(newStock, now, product.id);
        product.currentStock = newStock;
        insertTx.run(
          `tx-${now}-${Math.random().toString(36).slice(2)}`,
          product.id, product.name, -qty,
          `Auto-deducted: sold ${qty} ${product.unit} (from notes: "${sale.itemName}")`,
          reportId, date, now
        );
        deducted.push({ productName: product.name, deducted: qty, unit: product.unit });
      } else {
        unmatched.push(sale.itemName);
      }
    }
  });

  deductAll();
  res.json({ deducted, unmatched });
});

// ── Process AI restocks ────────────────────────────────────────────────────

app.post('/api/stock/process-restocks', (req, res) => {
  const { restocks, date } = req.body as {
    restocks: Array<{ itemName: string; quantityReceived: number; unitCost?: number; notes?: string }>;
    date: string;
  };

  const products = (db.prepare('SELECT * FROM stock_products').all() as any[]).map(rowToProduct);
  const restocked: Array<{ productName: string; quantity: number; unit: string }> = [];
  const unmatched: string[] = [];

  const updateStmt = db.prepare('UPDATE stock_products SET current_stock = ?, unit_cost = ?, updated_at = ? WHERE id = ?');
  const insertTx = db.prepare(`
    INSERT INTO stock_transactions (id, product_id, product_name, type, quantity, unit_cost, notes, date, created_at)
    VALUES (?, ?, ?, 'restock', ?, ?, ?, ?, ?)
  `);

  const processAll = db.transaction(() => {
    for (const item of restocks) {
      const qty = Number(item.quantityReceived) || 0;
      if (qty <= 0) continue;
      const product = fuzzyFindProduct(products, item.itemName);
      if (product) {
        const newStock = product.currentStock + qty;
        const newCost = Number(item.unitCost) || product.unitCost;
        const now = Date.now();
        updateStmt.run(newStock, newCost, now, product.id);
        product.currentStock = newStock;
        insertTx.run(
          `tx-${now}-${Math.random().toString(36).slice(2)}`,
          product.id, product.name, qty, newCost,
          item.notes || `Restocked ${qty} ${product.unit}`,
          date, now
        );
        restocked.push({ productName: product.name, quantity: qty, unit: product.unit });
      } else {
        unmatched.push(item.itemName);
      }
    }
  });

  processAll();
  res.json({ restocked, unmatched });
});

// ── Audio generation is not supported with a local Gemma 4 text model
app.post('/api/generate-audio-summary', (req, res) => {
  res.status(501).json({
    error: 'Audio generation (TTS) is not supported with the local Gemma 4 model. This feature requires a cloud TTS service.',
  });
});

// Audio transcription is not supported with a local Gemma 4 text model
app.post('/api/transcribe-audio', (req, res) => {
  res.status(501).json({
    error: 'Audio transcription is not supported with the local Gemma 4 model. Consider using a local Whisper model or a cloud transcription service.',
  });
});

// Vite server integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sika Dwa] Express server running on http://0.0.0.0:${PORT}`);
    console.log(`[LM Studio] Connecting to: ${LM_STUDIO_BASE_URL} | Model: ${LM_STUDIO_MODEL}`);
  });
}

startServer();
