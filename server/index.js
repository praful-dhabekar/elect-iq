const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');
const logger = require('./logger');
const path = require('path');
require('dotenv').config();

/** @type {string[]} Allowlist of ISO-639-1 language codes for translation. */
const ALLOWED_TARGET_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'te', 'mr'];

/**
 * Validates the request body for the /api/chat endpoint.
 * Pure function — unit-testable without Express.
 * @param {object} body - The request body.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateChatInput(body) {
  if (!body || !body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return { valid: false, error: 'A non-empty message string is required.' };
  }
  return { valid: true };
}

/**
 * Validates the request body for the /api/translate endpoint.
 * Pure function — unit-testable without Express or hitting the real API.
 * @param {object} body - The request body.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateTranslateInput(body) {
  if (!body) return { valid: false, error: 'Invalid request' };
  const { texts, targetLanguage } = body;
  if (
    !Array.isArray(texts) || texts.length === 0 || texts.length > 50 ||
    !texts.every(t => typeof t === 'string') ||
    !ALLOWED_TARGET_LANGUAGES.includes(targetLanguage)
  ) {
    return { valid: false, error: 'Invalid request' };
  }
  return { valid: true };
}

/**
 * Creates and configures the Express application.
 * Extracted as a factory function for testability — tests can import createApp()
 * without starting the server or needing real env vars.
 * @param {object} [deps] - Injectable dependencies for testing.
 * @param {object} [deps.ai] - Gemini AI client instance.
 * @returns {import('express').Express}
 */
function createApp(deps = {}) {
  const app = express();

  // --- Security Middlewares ---
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://www.gstatic.com"],
        connectSrc: [
          "'self'", 
          "https://identitytoolkit.googleapis.com", 
          "https://securetoken.googleapis.com", 
          "https://firestore.googleapis.com",
          "https://translation.googleapis.com"
        ],
        frameSrc: ["'self'", "https://*.firebaseapp.com"],
      },
    },
  }));
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '10kb' }));

  /** Global API rate limiter: 100 requests per 15 minutes per IP. */
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, legacyHeaders: false,
  });
  app.use('/api/', apiLimiter);

  /** Tighter translation limiter: 10 requests per minute per IP. */
  const translateLimiter = rateLimit({
    windowMs: 60 * 1000, max: 10,
    standardHeaders: true, legacyHeaders: false,
  });

  // Initialize Gemini AI Client (injectable for tests)
  const ai = deps.ai || new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  /**
   * POST /api/chat
   * Securely proxies chat requests to Gemini AI without exposing the API key.
   * Streams the response back to the client for low-latency UX.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  app.post('/api/chat', async (req, res) => {
    const validation = validateChatInput(req.body);
    if (!validation.valid) {
      logger.warn('Chat API called without a valid message');
      return res.status(400).json({ error: validation.error });
    }
    try {
      const { message, systemPrompt } = req.body;
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
   * Proxies translation requests to Google Cloud Translation API v2.
   * Input validation is synchronous and unit-testable without hitting the real API.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  app.post('/api/translate', translateLimiter, async (req, res) => {
    const validation = validateTranslateInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const { texts, targetLanguage } = req.body;
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
      logger.error(`Translation API Error: ${error.message}`);
      res.status(500).json({ error: 'Translation failed' });
    }
  });

  // Serve static frontend build in production
  app.use(express.static(path.join(__dirname, 'public')));

  // SPA catch-all — Express 5 requires named wildcard params
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}

// --- Export for testing, start server only when run directly ---
module.exports = { createApp, validateChatInput, validateTranslateInput, ALLOWED_TARGET_LANGUAGES };

if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(`ElectIQ Server running on port ${PORT}`);
  });
}
