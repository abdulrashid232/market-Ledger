import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

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
    apiKey: 'lm-studio', // LM Studio does not require a real API key
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Route: Analyze raw vendor notes into structured ledger
app.post('/api/analyze-ledger', async (req, res) => {
  try {
    const { notes, currency = 'GHS', vendorName = 'Vendor', businessType = 'Market Stall' } = req.body;

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
6. Generate 3-5 High-Value Actionable Business Insights:
   - Concrete, highly practical advice tailored for small market vendors (e.g., supplier negotiation tactics, pricing adjustments, stocking new requested items, preventing spoilage, bundling fast and slow movers).
7. Generate Tomorrow's Actionable To-Do List:
   - Priority items to execute first thing tomorrow morning.

Be realistic, practical, and highly empathetic to market vendors.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "summaryHeadline": "string",
  "totalRevenue": number,
  "totalExpenses": number,
  "netProfit": number,
  "sales": [{ "itemName": "string", "quantitySold": number, "unitPrice": number, "totalRevenue": number, "category": "string", "notes": "string" }],
  "expenses": [{ "description": "string", "cost": number, "category": "string", "notes": "string" }],
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
            required: ['summaryHeadline', 'totalRevenue', 'totalExpenses', 'netProfit', 'sales', 'expenses', 'inventory', 'feedback', 'insights', 'tasks'],
          },
        },
      } as any,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(content);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error analyzing ledger notes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process vendor notes with local LM Studio.',
    });
  }
});

// Audio generation is not supported with a local Gemma 4 text model
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
    console.log(`[Market Vendor Daily Ledger] Express server running on http://0.0.0.0:${PORT}`);
    console.log(`[LM Studio] Connecting to: ${LM_STUDIO_BASE_URL} | Model: ${LM_STUDIO_MODEL}`);
  });
}

startServer();
