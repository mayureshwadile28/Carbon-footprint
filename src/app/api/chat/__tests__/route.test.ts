/**
 * @jest-environment node
 */
import { POST } from '../route';

// Mock GoogleGenerativeAI
const mockSendMessageStream = jest.fn();
const mockStartChat = jest.fn(() => ({ sendMessageStream: mockSendMessageStream }));
const mockGetGenerativeModel = jest.fn(() => ({ startChat: mockStartChat }));

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    SchemaType: { OBJECT: 'OBJECT', STRING: 'STRING' },
  };
});

function createRequest(body: object, ip = '127.0.0.1') {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('Chat API Route', () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Returns 400 for empty message', async () => {
    const req = createRequest({ message: '' }, '192.168.1.1');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Returns 400 for message > 2000 chars', async () => {
    const req = createRequest({ message: 'a'.repeat(2001) }, '192.168.1.2');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Returns 400 for non-string message', async () => {
    const req = createRequest({ message: 123 }, '192.168.1.3');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Returns 400 for invalid profile (array)', async () => {
    const req = createRequest({ message: 'hi', profile: [] }, '192.168.1.4');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Returns 400 for invalid actions (string)', async () => {
    const req = createRequest({ message: 'hi', actions: 'invalid' }, '192.168.1.5');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Returns 400 for invalid history (string)', async () => {
    const req = createRequest({ message: 'hi', history: 'invalid' }, '192.168.1.6');
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Returns 429 after rate limit exceeded', async () => {
    const ip = '192.168.1.7';
    // Max requests is 10. Make 10 valid requests
    for (let i = 0; i < 10; i++) {
      mockSendMessageStream.mockResolvedValueOnce({
        stream: (async function* () {})(),
      });
      const req = createRequest({ message: 'hi' }, ip);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
    
    // 11th should be 429
    const req11 = createRequest({ message: 'hi' }, ip);
    const res11 = await POST(req11);
    expect(res11.status).toBe(429);
  });

  it('Returns 200 for valid request with mocked AI', async () => {
    mockSendMessageStream.mockResolvedValueOnce({
      stream: (async function* () {
        yield { text: () => 'Hello', functionCalls: () => null };
        yield { text: () => ' World', functionCalls: () => null };
      })(),
    });

    const req = createRequest({ message: 'Hello' }, '192.168.1.8');
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Should return a stream
    expect(res.body).toBeTruthy();
    
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }
    expect(result).toBe('Hello World');
  });

  it('Returns 403 for cross-origin requests', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.9',
        'origin': 'https://evil.com',
      },
      body: JSON.stringify({ message: 'hi' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('Returns 200 with tool call chunks', async () => {
    mockSendMessageStream.mockResolvedValueOnce({
      stream: (async function* () {
        yield { text: () => '', functionCalls: () => [{ name: 'logAction', args: { actionId: 'bike_commute' } }] };
      })(),
    });

    const req = createRequest({ message: 'I biked' }, '192.168.1.10');
    const res = await POST(req);
    expect(res.status).toBe(200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }
    expect(result).toContain('"type":"tool_call"');
    expect(result).toContain('"actionId":"bike_commute"');
    expect(result).toContain('--END_TOOL_CALL--');
  });

  it('Handles errors from Gemini API gracefully', async () => {
    mockSendMessageStream.mockRejectedValueOnce(new Error('API Down'));

    const req = createRequest({ message: 'Hello' }, '192.168.1.11');
    const res = await POST(req);
    // Should catch the error and return 500
    expect(res.status).toBe(500);
  });
});
