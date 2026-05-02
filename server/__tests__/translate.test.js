const request = require('supertest');
const { createApp } = require('../index');

describe('POST /api/translate missing cases', () => {
  let app;

  beforeAll(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { translations: [{ translatedText: 'Mock' }] },
      }),
    });
    app = createApp();
  });

  afterAll(() => {
    delete global.fetch;
  });

  it('Test that targetLanguage \'fr\' (not in allowed list) returns 400', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: ['hello'], targetLanguage: 'fr' });
    expect(res.status).toBe(400);
  });

  it('Test that an empty string in the texts array returns 400', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: [''], targetLanguage: 'hi' });
    expect(res.status).toBe(400);
  });

  it('Test that texts array with 51 items returns 400', async () => {
    const res = await request(app)
      .post('/api/translate')
      .send({ texts: Array(51).fill('test'), targetLanguage: 'hi' });
    expect(res.status).toBe(400);
  });
});
