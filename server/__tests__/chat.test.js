const request = require('supertest');
const { createApp } = require('../index');

describe('POST /api/chat missing cases', () => {
  let app;

  beforeAll(() => {
    const mockAi = {
      models: {
        generateContentStream: jest.fn().mockImplementation(async function* () {
          yield { text: 'Mock response' };
        }),
      },
    };
    app = createApp({ ai: mockAi });
  });

  it('Test that a message of exactly 500 characters returns 200', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'a'.repeat(500) });
    expect(res.status).toBe(200);
  });

  it('Test that a message of 501 characters returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('Test that whitespace-only message returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '   ' });
    expect(res.status).toBe(400);
  });
});
