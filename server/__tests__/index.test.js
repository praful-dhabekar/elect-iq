/**
 * Server-side unit and integration tests for ElectIQ API.
 *
 * Tests cover:
 *  - Pure validation functions (unit tests — no network, no Express)
 *  - Express route behaviour via supertest (integration tests)
 *  - Edge cases: empty bodies, type mismatches, boundary values
 *
 * Run: npm test
 */
const { validateChatInput, validateTranslateInput, ALLOWED_TARGET_LANGUAGES, createApp } = require('../index');

// ──────────────────────────────────────────────
// Unit Tests — Pure Validation Functions
// ──────────────────────────────────────────────

describe('validateChatInput', () => {
  it('rejects null body', () => {
    expect(validateChatInput(null).valid).toBe(false);
  });

  it('rejects undefined message', () => {
    expect(validateChatInput({}).valid).toBe(false);
  });

  it('rejects empty string message', () => {
    expect(validateChatInput({ message: '' }).valid).toBe(false);
  });

  it('rejects whitespace-only message', () => {
    expect(validateChatInput({ message: '   ' }).valid).toBe(false);
  });

  it('rejects non-string message (number)', () => {
    expect(validateChatInput({ message: 123 }).valid).toBe(false);
  });

  it('rejects non-string message (array)', () => {
    expect(validateChatInput({ message: ['hello'] }).valid).toBe(false);
  });

  it('accepts valid message', () => {
    expect(validateChatInput({ message: 'What is a ballot?' }).valid).toBe(true);
  });

  it('accepts message with extra fields (systemPrompt)', () => {
    const result = validateChatInput({ message: 'Hello', systemPrompt: 'Be brief.' });
    expect(result.valid).toBe(true);
  });
});

describe('validateTranslateInput', () => {
  it('rejects null body', () => {
    expect(validateTranslateInput(null).valid).toBe(false);
  });

  it('rejects missing texts field', () => {
    expect(validateTranslateInput({ targetLanguage: 'hi' }).valid).toBe(false);
  });

  it('rejects empty texts array', () => {
    expect(validateTranslateInput({ texts: [], targetLanguage: 'hi' }).valid).toBe(false);
  });

  it('rejects texts with non-string items', () => {
    expect(validateTranslateInput({ texts: [123], targetLanguage: 'hi' }).valid).toBe(false);
  });

  it('rejects texts array exceeding 50 items', () => {
    const texts = Array(51).fill('hello');
    expect(validateTranslateInput({ texts, targetLanguage: 'hi' }).valid).toBe(false);
  });

  it('rejects unsupported target language', () => {
    expect(validateTranslateInput({ texts: ['hello'], targetLanguage: 'fr' }).valid).toBe(false);
  });

  it('rejects missing targetLanguage', () => {
    expect(validateTranslateInput({ texts: ['hello'] }).valid).toBe(false);
  });

  it('accepts valid input with single text', () => {
    const result = validateTranslateInput({ texts: ['hello'], targetLanguage: 'hi' });
    expect(result.valid).toBe(true);
  });

  it('accepts valid input with multiple texts', () => {
    const result = validateTranslateInput({ texts: ['hello', 'world'], targetLanguage: 'bn' });
    expect(result.valid).toBe(true);
  });

  it('accepts exactly 50 texts (boundary)', () => {
    const texts = Array(50).fill('hello');
    expect(validateTranslateInput({ texts, targetLanguage: 'ta' }).valid).toBe(true);
  });

  it.each(ALLOWED_TARGET_LANGUAGES)('accepts allowed language: %s', (lang) => {
    const result = validateTranslateInput({ texts: ['test'], targetLanguage: lang });
    expect(result.valid).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Integration Tests — Express Routes via supertest
// ──────────────────────────────────────────────

const request = require('supertest');

describe('POST /api/chat', () => {
  let app;

  beforeAll(() => {
    // Inject a mock AI client to avoid real Gemini calls
    const mockAi = {
      models: {
        generateContentStream: jest.fn().mockImplementation(async function* () {
          yield { text: 'Mock response from Gemini' };
        }),
      },
    };
    app = createApp({ ai: mockAi });
  });

  it('returns 400 for missing message', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for empty string message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-string message', async () => {
    const res = await request(app).post('/api/chat').send({ message: 42 });
    expect(res.status).toBe(400);
  });

  it('streams a successful response for valid input', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is a constituency?' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('Mock response');
  });
});

describe('POST /api/translate', () => {
  let app;

  beforeAll(() => {
    // Mock global fetch to avoid real Cloud Translation calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { translations: [{ translatedText: 'नमस्ते' }] },
      }),
    });
    app = createApp();
  });

  afterAll(() => {
    delete global.fetch;
  });

  it('returns 400 for missing body fields', async () => {
    const res = await request(app).post('/api/translate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request');
  });

  it('returns 400 for unsupported language', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: ['hello'], targetLanguage: 'fr' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty texts array', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: [], targetLanguage: 'hi' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for too many texts (>50)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: Array(51).fill('x'), targetLanguage: 'hi' });
    expect(res.status).toBe(400);
  });

  it('returns translated text for valid input', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: ['hello'], targetLanguage: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body.translations).toEqual(['नमस्ते']);
  });

  it('returns 500 when translation API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: ['hello'], targetLanguage: 'hi' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Translation failed');
  });
});
