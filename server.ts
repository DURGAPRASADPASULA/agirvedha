import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface ChatContextPayload {
  activeSection?: string;
  locationName?: string;
  weatherSummary?: string;
  focusedProblem?: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

function extractGroundingSources(chunks: unknown): GroundingSource[] {
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const web = (chunk as { web?: { uri?: unknown; title?: unknown } }).web;
    if (!web || typeof web.uri !== 'string') continue;
    const uri = web.uri.trim();
    if (!/^https?:\/\//i.test(uri) || seen.has(uri)) continue;
    seen.add(uri);

    let fallbackTitle = uri;
    try {
      fallbackTitle = new URL(uri).hostname.replace(/^www\./, '');
    } catch {
      // Keep uri fallback
    }

    const title =
      typeof web.title === 'string' && web.title.trim().length > 0
        ? web.title.trim().slice(0, 120)
        : fallbackTitle;

    sources.push({ title, uri });
    if (sources.length >= 6) break;
  }

  return sources;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSystemInstruction(languageName: string, context?: ChatContextPayload): string {
  const contextLines: string[] = [];
  if (context?.activeSection) {
    contextLines.push(`- Active section in AgriVeda: ${context.activeSection}`);
  }
  if (context?.locationName) {
    contextLines.push(`- Farmer location hub: ${context.locationName}`);
  }
  if (context?.weatherSummary) {
    contextLines.push(`- Local weather snapshot: ${context.weatherSummary}`);
  }
  if (context?.focusedProblem) {
    contextLines.push(`- Specific crop/problem the user clicked on: ${context.focusedProblem}`);
  }

  const contextBlock =
    contextLines.length > 0
      ? `\nCurrent user app context:\n${contextLines.join('\n')}`
      : '';

  return [
    'You are AgriVeda AI Sahayak, an expert, empathetic Indian agricultural scientist and Krishi Vigyan Kendra (KVK) field advisor.',
    `Preferred UI language: ${languageName || 'English'}. Respond in ${languageName || 'English'} unless the farmer explicitly writes in another language, in which case match their language naturally.`,
    'Help Indian farmers, rural workers, and direct buyers solve practical problems across crop diseases, pests, yellow leaves, root rot, soil health, Kharif/Rabi/Zaid crop planning, irrigation, weather risk, Mandi pricing, MSP rates, government schemes (PM-KISAN, PMFBY, e-NAM), and direct farm selling.',
    'When Google Search grounding is enabled, verify live MSP figures, schemes, Mandi trends, or weather updates from up-to-date Indian agricultural sources.',
    'Structure answers clearly and concisely for mobile reading:',
    '1. Likely Cause / Quick Field Check (1-2 sentences).',
    '2. Organic / Low-Cost Action (neem oil, Trichoderma, sticky traps, drainage, spacing).',
    '3. Safe Chemical Option & Exact Dosage (g/L or ml/L of water, morning/evening spray timing, PPE safety note).',
    '4. When urgent or severe, advise checking with the nearest Krishi Vigyan Kendra or toll-free Kisan Call Centre (1800-180-1551).',
    'Keep responses focused, practical, honest, and concise (under ~220 words unless asked for more detail).',
    contextBlock,
  ]
    .filter(Boolean)
    .join('\n');
}

async function generateWithOptionalGrounding(
  ai: GoogleGenAI,
  params: {
    contents: string | Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    systemInstruction: string;
    useSearchGrounding: boolean;
  }
) {
  const { contents, systemInstruction, useSearchGrounding } = params;

  const callModel = (model: string, withSearch: boolean) =>
    ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        ...(withSearch ? { tools: [{ googleSearch: {} }] } : {}),
        ...(model === 'gemini-4-hydrogen'
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
      },
    });

  try {
    const response = await callModel('gemini-4-hydrogen', useSearchGrounding);
    return { response, searchFallbackUsed: false };
  } catch (err: unknown) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

    if (
      useSearchGrounding &&
      (msg.includes('429') ||
        msg.includes('resource_exhausted') ||
        msg.includes('quota') ||
        msg.includes('search') ||
        msg.includes('tool'))
    ) {
      const response = await callModel('gemini-4-hydrogen', false);
      return { response, searchFallbackUsed: true };
    }

    if (msg.includes('404') || msg.includes('not_found')) {
      const response = await callModel('gemini-3.1-flash-lite', false);
      return { response, searchFallbackUsed: useSearchGrounding };
    }

    throw err;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, languageName, context, useSearchGrounding = true } = req.body as {
        messages?: ChatTurn[];
        languageName?: string;
        context?: ChatContextPayload;
        useSearchGrounding?: boolean;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Please enter a farming or crop question.' });
        return;
      }

      const cleanedMessages = messages
        .filter(
          (m): m is ChatTurn =>
            Boolean(m) &&
            (m.role === 'user' || m.role === 'model') &&
            typeof m.text === 'string' &&
            m.text.trim().length > 0
        )
        .slice(-14);

      if (cleanedMessages.length === 0) {
        res.status(400).json({ error: 'Message text cannot be empty.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Gemini AI key is not configured yet. Please set GEMINI_API_KEY in Settings > Secrets to activate live AI answers.',
        });
        return;
      }

      const systemInstruction = buildSystemInstruction(languageName || 'English', context);
      const contents = cleanedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text.trim() }],
      }));

      const { response, searchFallbackUsed } = await generateWithOptionalGrounding(ai, {
        contents,
        systemInstruction,
        useSearchGrounding,
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(502).json({
          error: 'The AI advisor returned an empty response. Please try asking again.',
        });
        return;
      }

      const sources = extractGroundingSources(
        response.candidates?.[0]?.groundingMetadata?.groundingChunks
      );

      res.json({
        reply: replyText,
        sources,
        groundingUnavailable: searchFallbackUsed,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[AgriVeda /api/chat error]', message);

      const lower = message.toLowerCase();
      if (
        lower.includes('403') ||
        lower.includes('400') ||
        lower.includes('permission') ||
        lower.includes('api_key') ||
        lower.includes('api key')
      ) {
        res.status(502).json({
          error:
            'Please check your GEMINI_API_KEY in Settings > Secrets to activate live AgriVeda AI responses.',
        });
        return;
      }
      if (lower.includes('429') || lower.includes('resource_exhausted')) {
        res.status(429).json({
          error: 'AI advisor is busy right now. Please wait a few seconds and try again.',
        });
        return;
      }

      res.status(500).json({
        error: 'Unable to get an AI response right now. Please try again shortly.',
        detail: message.slice(0, 180),
      });
    }
  });

  app.post('/api/search-advisory', async (req, res) => {
    try {
      const { query, languageName } = req.body as {
        query?: string;
        languageName?: string;
      };

      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      if (!trimmedQuery) {
        res.status(400).json({ error: 'Please enter a crop, MSP, or scheme search query.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Gemini AI key is not configured yet. Please set GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const { response, searchFallbackUsed } = await generateWithOptionalGrounding(ai, {
        contents: `Indian agriculture live web lookup (${languageName || 'English'}): ${trimmedQuery}`,
        systemInstruction: [
          'You are AgriVeda Market & Agricultural Policy Analyst for India.',
          `Respond in ${languageName || 'English'}.`,
          'Use Google Search grounding when available to provide accurate facts on Indian MSP rates (₹/quintal), APMC Mandi price trends, IMD weather advisories, or Indian farmer schemes (PM-KISAN, PMFBY, e-NAM).',
          'Keep the answer crisp (3–5 short bullet points, under 160 words) with exact ₹ figures or dates when known.',
        ].join('\n'),
        useSearchGrounding: true,
      });

      const summary = response.text?.trim();
      if (!summary) {
        res.status(502).json({ error: 'Live search returned no summary. Please rephrase.' });
        return;
      }

      const sources = extractGroundingSources(
        response.candidates?.[0]?.groundingMetadata?.groundingChunks
      );

      res.json({
        summary,
        sources,
        groundingUnavailable: searchFallbackUsed,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[AgriVeda /api/search-advisory error]', message);
      const lower = message.toLowerCase();
      if (lower.includes('429') || lower.includes('resource_exhausted')) {
        res.status(429).json({
          error: 'Search advisory is busy right now. Please wait a few seconds and try again.',
        });
        return;
      }
      res.status(500).json({
        error: 'Live web search lookup failed right now. Please try again shortly.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriVeda server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
