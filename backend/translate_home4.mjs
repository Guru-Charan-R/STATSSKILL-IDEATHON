import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'node:fs';
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const raw = fs.readFileSync('../frontend/src/pages/homeContent.js','utf8');
const html = raw.replace(/^export const homeHtml = `/, '').replace(/`;\s*$/, '');
const langMap = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };
const target = process.argv[2] || 'ta';
const langName = langMap[target];
const checkpoint = `../frontend/src/.checkpoint_${target}.json`;

// load checkpoint
let doneChunks = [];
let out = '';
if (fs.existsSync(checkpoint)) {
  const cp = JSON.parse(fs.readFileSync(checkpoint,'utf8'));
  doneChunks = cp.done || [];
  out = cp.out || '';
  console.log('resuming, done chunks:', doneChunks.length);
}

// split into ~2500 char chunks at </div> boundaries
function splitChunks(s, max = 2500) {
  const chunks = [];
  let cur = '';
  // split by tags
  const parts = s.split(/(<\/div>|<\/section>|<\/p>|<\/h[1-6]>)/);
  for (let i = 0; i < parts.length; i++) {
    cur += parts[i];
    if (cur.length >= max || i === parts.length - 1) {
      chunks.push(cur);
      cur = '';
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}
const chunks = splitChunks(html);
console.log('total chunks:', chunks.length);

async function translateChunk(sec, retries = 4) {
  if (!sec.trim() || !/[A-Za-z]{3}/.test(sec)) return sec;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.GROQ_MODEL,
        messages: [
          { role: 'system', content: `Translate all visible English text in the HTML to ${langName}. Preserve all HTML tags, attributes, classes, ids, structure exactly. Do not translate code, URLs, numbers, or technical identifiers. Return ONLY translated HTML, no markdown.` },
          { role: 'user', content: sec }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });
      return completion.choices[0].message.content;
    } catch (e) {
      console.log(`  retry ${attempt+1}:`, e.message.slice(0, 60));
      await new Promise(r => setTimeout(r, 22000));
    }
  }
  console.log('  FAILED, keeping English');
  return sec;
}

for (let i = 0; i < chunks.length; i++) {
  if (doneChunks.includes(i)) { console.log('skip chunk', i); continue; }
  console.log('translating chunk', i+1, '/', chunks.length, 'len', chunks[i].length);
  const t = await translateChunk(chunks[i]);
  out += t;
  doneChunks.push(i);
  fs.writeFileSync(checkpoint, JSON.stringify({ done: doneChunks, out }));
  await new Promise(r => setTimeout(r, 20000));
}
fs.writeFileSync(`../frontend/src/pages/homeContent.${target}.js`, `export const homeHtml = \`${out.replace(/`/g,'\\`').replace(/\$\{/g,'\\${')}\`;\n`);
fs.unlinkSync(checkpoint);
console.log('Done, output length', out.length);