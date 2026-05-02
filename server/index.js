const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');
const logger = require('./logger');
require('dotenv').config();

const path = require('path');
const app = express();

/**
 * Security Middlewares
 * Why: Prevent common web vulnerabilities (XSS, Clickjacking, Brute Force).
 */
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Tighter limiter for translation — 10 requests per minute per IP
const translateLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
});

const ALLOWED_TARGET_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'te', 'mr'];

/**
 * Initialize Gemini AI Client (new @google/genai SDK).
 * Why: The old SDK passed systemInstruction incorrectly causing 400 errors.
 */
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * POST /api/chat
 * @param req.body {{ message: string, systemPrompt?: string }}
 * Why: Securely proxies chat requests to Gemini without exposing the API key.
 */
app.post('/api/chat', async (req, res) => {
  const { message, systemPrompt } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('Chat API called without a valid message');
    return res.status(400).json({ error: 'A non-empty message string is required.' });
  }
  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: message.trim(),
      config: { ...(systemPrompt && { systemInstruction: systemPrompt }) },
    });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    for await (const chunk of response) {
      if (chunk.text) res.write(chunk.text);
    }
    res.end();
  } catch (error) {
    logger.error(`Gemini API Error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to communicate with AI service.' });
  }
});

/**
 * POST /api/translate
 * @param req.body {{ texts: string[], targetLanguage: string }}
 * Validation is synchronous — unit-testable without hitting the real API.
 * Why: Keeps API key server-side; validates and rate-limits before calling Cloud Translation.
 */
app.post('/api/translate', translateLimiter, async (req, res) => {
  const { texts, targetLanguage } = req.body;

  // Synchronous input validation (unit-testable as a pure check)
  if (
    !Array.isArray(texts) || texts.length === 0 || texts.length > 50 ||
    !texts.every(t => typeof t === 'string') ||
    !ALLOWED_TARGET_LANGUAGES.includes(targetLanguage)
  ) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const apiKey = process.env.TRANSLATION_API_KEY;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, target: targetLanguage, format: 'text' }),
    });
    if (!response.ok) throw new Error(`Translation API responded with ${response.status}`);
    const data = await response.json();
    const translations = data.data.translations.map(t => t.translatedText);
    res.json({ translations });
  } catch (error) {
    // No internal details exposed — only a generic error
    logger.error(`Translation API Error: ${error.message}`);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Serve static files from the 'public' directory (where the build will be copied)
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the frontend for any non-API requests (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`ElectIQ Server running on port ${PORT}`);
});
