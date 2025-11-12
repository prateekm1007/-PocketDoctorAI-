// Minimal OpenAI proxy scaffold - created during Phase 6
const express = require('express');
const fetch = require('node-fetch');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// simple rate limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipCounters = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipCounters.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) { entry.count = 0; entry.start = now; }
  entry.count += 1;
  ipCounters.set(ip, entry);
  if (entry.count > MAX_REQUESTS_PER_WINDOW) return res.status(429).json({ error: 'Rate limit exceeded' });
  next();
}
const PROXY_API_KEY = process.env.PROXY_API_KEY || null;
function requireProxyKey(req, res, next) {
  if (!PROXY_API_KEY) return next();
  const provided = req.headers['x-proxy-api-key'];
  if (!provided || provided !== PROXY_API_KEY) return res.status(401).json({ error: 'Missing or invalid proxy API key' });
  next();
}

// non-streaming endpoint
app.post('/v1/chat', rateLimit, requireProxyKey, body('messages').isArray({ min: 1 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const apiKey = process.env.OPENAI_API_KEY || null;
  if (!apiKey) return res.status(500).json({ error: 'Server not configured with OPENAI_API_KEY' });
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: req.body.messages, max_tokens: 500 })
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('proxy error', err);
    return res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('OpenAI proxy listening'));
module.exports = app;


// Production-ready streaming proxy scaffold (best-effort). This attempts to open a streaming
// request to OpenAI's /v1/chat/completions with `stream: true` and pipes chunks as SSE to clients.
app.post('/v1/chat/stream', rateLimit, requireProxyKey, body('messages').isArray({ min: 1 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
  const apiKey = process.env.OPENAI_API_KEY || null;
  if (!apiKey) { return res.status(500).json({ error: 'Server not configured with OPENAI_API_KEY' }); }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  try {
    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: req.body.messages, stream: true, max_tokens: 800 })
    });

    if (!openaiResp.ok) {
      const txt = await openaiResp.text();
      res.write('event: error\ndata: ' + JSON.stringify({ status: openaiResp.status, body: txt }) + '\\n\\n');
      return res.end();
    }

    const reader = openaiResp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\n\n/);
      while (parts.length > 1) {
        const line = parts.shift();
        buffer = parts.join('\n\\n');
        if (!line) continue;
        const cleaned = line.replace(/^data:\s*/, '').trim();
        if (cleaned === '[DONE]') {
          res.write('event: done\ndata: {}\\n\\n');
          continue;
        }
        try {
          const parsed = JSON.parse(cleaned);
          res.write('data: ' + JSON.stringify(parsed) + '\\n\\n');
        } catch (err) {
          res.write('data: ' + JSON.stringify({ raw: cleaned }) + '\\n\\n');
        }
      }
    }

    res.write('event: done\ndata: {}\\n\\n');
    res.end();
  } catch (err) {
    console.error('streaming proxy error', err);
    res.write('event: error\ndata: ' + JSON.stringify({ error: err.message }) + '\\n\\n');
    res.end();
  }
});
