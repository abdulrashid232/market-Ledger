import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client lazily
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in process.env');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
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

    const ai = getGenAIClient();

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

Be realistic, practical, and highly empathetic to market vendors.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Raw Vendor Notes:\n"""\n${notes}\n"""`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryHeadline: {
              type: Type.STRING,
              description: "A clear, encouraging 1-2 sentence executive summary of today's business performance."
            },
            totalRevenue: {
              type: Type.NUMBER,
              description: "Total revenue calculated from sales in numerical format."
            },
            totalExpenses: {
              type: Type.NUMBER,
              description: "Total expenses calculated in numerical format."
            },
            netProfit: {
              type: Type.NUMBER,
              description: "Net profit calculated as totalRevenue - totalExpenses."
            },
            sales: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  quantitySold: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalRevenue: { type: Type.NUMBER },
                  category: {
                    type: Type.STRING,
                    description: "One of: Produce, Grains & Staple, Meat & Fish, Oils & Spices, Textiles & Apparel, General Goods, Services, Other"
                  },
                  notes: { type: Type.STRING }
                },
                required: ["itemName", "totalRevenue"]
              }
            },
            expenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  cost: { type: Type.NUMBER },
                  category: {
                    type: Type.STRING,
                    description: "One of: Transport & Freight, Restock / Wholesale, Market Toll & Fees, Packaging & Bags, Personal & Food, Utilities & Airtime, Other"
                  },
                  notes: { type: Type.STRING }
                },
                required: ["description", "cost"]
              }
            },
            inventory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  status: {
                    type: Type.STRING,
                    description: "One of: in_stock, low_stock, restock_needed, spoiled_damaged"
                  },
                  estimatedRemaining: { type: Type.STRING },
                  restockQuantityNeeded: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["itemName", "status"]
              }
            },
            feedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  customerComment: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description: "One of: complaint, praise, inquiry, price_concern"
                  },
                  severity: {
                    type: Type.STRING,
                    description: "One of: low, medium, high"
                  },
                  suggestedAction: { type: Type.STRING }
                },
                required: ["customerComment", "category", "suggestedAction"]
              }
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description: "One of: pricing, inventory, customer_service, operations, supplier"
                  },
                  impact: {
                    type: Type.STRING,
                    description: "One of: high, medium, low"
                  }
                },
                required: ["title", "description", "category", "impact"]
              }
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    description: "One of: high, medium, low"
                  }
                },
                required: ["task", "priority"]
              }
            }
          },
          required: [
            "summaryHeadline",
            "totalRevenue",
            "totalExpenses",
            "netProfit",
            "sales",
            "expenses",
            "inventory",
            "feedback",
            "insights",
            "tasks"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error analyzing ledger notes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process vendor notes with Gemini API.'
    });
  }
});

// API Route: Generate Text-to-Speech audio summary for vendor debrief
app.post('/api/generate-audio-summary', async (req, res) => {
  try {
    const { textPrompt } = req.body;
    if (!textPrompt) {
      return res.status(400).json({ error: 'Text prompt is required for audio generation' });
    }

    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Say warmly and clearly in a helpful business assistant voice: ${textPrompt}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Audio generation produced empty output' });
    }

    res.json({ success: true, audioBase64: base64Audio });
  } catch (error: any) {
    console.error('Error generating audio summary:', error);
    res.status(500).json({ error: error.message || 'Failed to generate audio summary' });
  }
});

// API Route: Transcribe & Translate Multilingual Audio (Twi, Hausa, Dagbani, English, Pidgin)
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'auto' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio recording base64 data is required' });
    }

    const ai = getGenAIClient();

    let langHint = 'The audio may be spoken in Twi (Akan), Hausa, Dagbani, Ghanaian Pidgin, or English.';
    if (language === 'twi') {
      langHint = 'The audio is spoken in native Twi (Akan). Listen closely to Ghanaian market terms (e.g. sika, cedis, gari, rice, tomatoes, transport).';
    } else if (language === 'hausa') {
      langHint = 'The audio is spoken in native Hausa. Listen closely to West African market vendor vocabulary and financial numbers.';
    } else if (language === 'dagbani') {
      langHint = 'The audio is spoken in native Dagbani (Northern Ghana language). Listen carefully to local vendor numbers, goods, and expenses.';
    } else if (language === 'pidgin') {
      langHint = 'The audio is spoken in West African / Ghanaian Pidgin English.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBase64,
          },
        },
        `You are an expert multilingual speech transcriber and translator for African market vendors.
${langHint}

TASK:
1. Transcribe the vendor's spoken dictation.
2. Translate any non-English speech (Twi, Hausa, Dagbani, Pidgin) into clear, natural English notes suitable for structured bookkeeping.
3. Keep all prices, quantities, product names, customer comments, and expenses intact.
4. Output ONLY the clean transcribed/translated text statement (1-3 sentences or paragraphs). Do not add preamble or markdown wrapper.`
      ],
    });

    const transcript = response.text ? response.text.trim() : '';
    return res.json({ success: true, transcript });
  } catch (error: any) {
    console.error('Error transcribing audio dictation:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to transcribe audio' });
  }
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
  });
}

startServer();
