import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { spinSlotMachine, runRtpSimulation } from './server/slotsMath.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = express();
  
  // Parse JSON bodies up to 10MB to accommodate sketches and canvas base64 data
  app.use(express.json({ limit: '10mb' }));

  // Slots Math Game API: Spin Endpoint
  app.post('/api/slots/spin', (req, res) => {
    try {
      const lineBet = Number(req.body.lineBet) || 5;
      const activeLines = Number(req.body.activeLines) || 20;

      if (lineBet <= 0 || activeLines <= 0 || activeLines > 20) {
        return res.status(400).json({ error: 'Invalid bet parameters.' });
      }

      const result = spinSlotMachine(lineBet, activeLines);
      res.json(result);
    } catch (err: any) {
      console.error('Slots Spin Endpoint Error:', err);
      res.status(500).json({ error: 'Failed to spin slot machine.' });
    }
  });

  // Slots Math Game API: Simulation / Verification Endpoint
  app.get('/api/slots/simulate', (req, res) => {
    try {
      const count = Number(req.query.count) || 25000;
      if (count <= 0 || count > 100000) {
        return res.status(400).json({ error: 'Simulation count must be between 1 and 100,000.' });
      }

      const simResult = runRtpSimulation(count);
      res.json(simResult);
    } catch (err: any) {
      console.error('Slots Simulation Endpoint Error:', err);
      res.status(500).json({ error: 'Failed to run math simulation.' });
    }
  });

  // Initialize Gemini client (server-side only)
  // Standard user agent set to 'aistudio-build' as required by telemetry
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not defined in the environment.');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Route: Multi-Modal Chat and Grounding Studio
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, useSearch, useMaps, latLng } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: 'Gemini API key is missing. Please configure it in Settings > Secrets.' 
        });
      }

      // Convert client messages to Gemini content format
      const contents = messages.map((m: any) => {
        const parts: any[] = [];

        // If there's an image attachment (base64 data)
        if (m.image?.data && m.image?.mimeType) {
          parts.push({
            inlineData: {
              data: m.image.data, // base64 string without content type prefix
              mimeType: m.image.mimeType,
            },
          });
        }

        // Add the text part
        parts.push({ text: m.text || '' });

        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts,
        };
      });

      // Prepare configuration tools & retrievals
      const config: any = {};
      const tools: any[] = [];

      // Google Grounding setup (Search and Maps are mutually exclusive)
      if (useSearch) {
        tools.push({ googleSearch: {} });
      } else if (useMaps) {
        tools.push({ googleMaps: {} });
        if (latLng && typeof latLng.latitude === 'number' && typeof latLng.longitude === 'number') {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: latLng.latitude,
                longitude: latLng.longitude,
              },
            },
          };
        }
      }

      if (tools.length > 0) {
        config.tools = tools;
      }

      // Using gemini-3.5-flash as the developer/free tool model for general text/multimodal tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config,
      });

      const text = response.text || '';
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

      res.json({
        text,
        groundingMetadata,
      });
    } catch (error: any) {
      console.error('Gemini Chat Error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during Gemini processing.' });
    }
  });

  // API Route: Text-To-Speech (TTS)
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: 'Gemini API key is missing. Please configure it in Settings > Secrets.' 
        });
      }

      // Synthesize audio using gemini-3.1-flash-tts-preview
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'Failed to generate audio from Gemini.' });
      }

      res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error('Gemini TTS Error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during speech synthesis.' });
    }
  });

  // Setup static serving or Vite middleware
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
