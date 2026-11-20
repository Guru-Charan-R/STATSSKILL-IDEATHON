const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

function langName(code) {
  return { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' }[code] || 'English';
}

// Shared formatting contract: the chat panel is a narrow plain-text bubble,
// so structured Markdown/LaTeX renders as unreadable raw symbols there.
const FORMAT_RULES = `

FORMATTING RULES (MANDATORY):
- Reply in plain text only.
- Do NOT use Markdown, HTML, tables, code fences, asterisks, hash headings, bullet symbols or LaTeX.
- Use short paragraphs and, if needed, a simple numbered list like "1. ...".
- Write formulas in ordinary words and symbols, for example "P(head) = 1/2 = 0.5".
- Keep the answer focused, around 120-180 words, and always finish the final sentence.
- Never output raw escape sequences such as \\n, \\[ or \\text.
`;

// non-streaming
router.post('/', optionalAuth, async (req, res) => {
  const { message, conversation_id, language, context } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

  // conversation
  let convId = conversation_id;
  if (!convId) {
    const info = db.prepare('INSERT INTO ai_conversations(user_id,title,context) VALUES (?,?,?)').run((req.user?.id || null), message.slice(0, 60), context || null);
    convId = info.lastInsertRowid;
  }
  db.prepare('INSERT INTO ai_messages(conversation_id,role,content) VALUES (?,?,?)').run(convId, 'user', message);

  const history = db.prepare('SELECT role,content FROM ai_messages WHERE conversation_id=? ORDER BY id').all(convId);

  const { Groq } = require('groq-sdk');
  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const lang = language || 'en';

  const system = `You are StatSkill AI, an AI assistant for India's Official Statistical System (MoSPI/NSSO). Help users understand statistics fundamentals, data analysis, sampling methods, survey methodology, census and data collection, data visualisation, government statistical reporting, CPI and PLFS topics. Explain difficult concepts in simple language with practical examples. Respond in ${langName(lang)}. Do not present general AI knowledge as verified official government guidance; suggest consulting official manuals.${FORMAT_RULES}${context ? ' Current context: ' + context : ''}`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role, content: m.content }))],
      temperature: 0.5,
      max_tokens: 1200
    });
    const answer = completion.choices?.[0]?.message?.content || '';
    db.prepare('INSERT INTO ai_messages(conversation_id,role,content) VALUES (?,?,?)').run(convId, 'assistant', answer);
    db.prepare("UPDATE ai_conversations SET updated_at=datetime('now') WHERE id=?").run(convId);
    res.json({ conversation_id: convId, answer });
  } catch (e) {
    res.status(500).json({ error: 'Groq request failed', detail: e.message });
  }
});

// streaming (SSE)
router.post('/stream', optionalAuth, async (req, res) => {
  const { message, conversation_id, language, context } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

  let convId = conversation_id;
  if (!convId) {
    const info = db.prepare('INSERT INTO ai_conversations(user_id,title,context) VALUES (?,?,?)').run((req.user?.id || null), message.slice(0, 60), context || null);
    convId = info.lastInsertRowid;
  }
  db.prepare('INSERT INTO ai_messages(conversation_id,role,content) VALUES (?,?,?)').run(convId, 'user', message);

  const history = db.prepare('SELECT role,content FROM ai_messages WHERE conversation_id=? ORDER BY id').all(convId);

  const { Groq } = require('groq-sdk');
  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const lang = language || 'en';
  const system = `You are StatSkill AI, an AI assistant for India's Official Statistical System (MoSPI/NSSO). Help users understand statistics fundamentals, data analysis, sampling methods, survey methodology, census and data collection, data visualisation, government statistical reporting, CPI and PLFS topics. Explain difficult concepts in simple language with practical examples. Respond in ${langName(lang)}.${FORMAT_RULES}${context ? ' Current context: ' + context : ''}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let full = '';
  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role, content: m.content }))],
      temperature: 0.5,
      max_tokens: 1200,
      stream: true
    });
    res.write(`data: ${JSON.stringify({ conversation_id: convId })}\n\n`);
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        full += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    db.prepare('INSERT INTO ai_messages(conversation_id,role,content) VALUES (?,?,?)').run(convId, 'assistant', full);
    db.prepare("UPDATE ai_conversations SET updated_at=datetime('now') WHERE id=?").run(convId);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  } finally {
    res.end();
  }
});

router.get('/conversations', optionalAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM ai_conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 50').all((req.user?.id || null));
  res.json({ conversations: rows });
});

router.get('/conversations/:id', optionalAuth, (req, res) => {
  const conv = db.prepare('SELECT * FROM ai_conversations WHERE id=? AND user_id=?').get(req.params.id, (req.user?.id || null));
  if (!conv) return res.status(404).json({ error: 'Not found' });
  const msgs = db.prepare('SELECT role,content,created_at FROM ai_messages WHERE conversation_id=? ORDER BY id').all(conv.id);
  res.json({ conversation: conv, messages: msgs });
});

module.exports = router;
