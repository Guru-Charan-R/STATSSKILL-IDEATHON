import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'node:fs';
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const raw = fs.readFileSync('../frontend/src/pages/homeContent.js','utf8');
const html = raw.replace(/^export const homeHtml = `/, '').replace(/`;\s*$/, '');
const langMap = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };
const target = process.argv[2] || 'ta';
const langName = langMap[target];

// split by sections
const parts = html.split(/(?=<!-- BEGIN:)/);
console.log('sections:', parts.length);

async function translateSection(sec) {
  if (!sec.trim()) return sec;
  // skip if no letters
  if (!/[A-Za-z]{3}/.test(sec)) return sec;
  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL,
    messages: [
      { role: 'system', content: `Translate all visible English text in the HTML to ${langName}. Preserve all HTML tags, attributes, classes, ids, structure exactly. Do not translate code, URLs, numbers, or technical identifiers. Return ONLY translated HTML.` },
      { role: 'user', content: sec }
    ],
    temperature: 0.2,
    max_tokens: 8000
  });
  return completion.choices[0].message.content;
}

let out = '';
for (let i = 0; i < parts.length; i++) {
  console.log('translating section', i+1, '/', parts.length, 'len', parts[i].length);
  try {
    const t = await translateSection(parts[i]);
    out += t;
  } catch (e) {
    console.log('ERR section', i, e.message);
    out += parts[i];
  }
  await new Promise(r => setTimeout(r, 1500));
}
fs.writeFileSync(`../frontend/src/pages/homeContent.${target}.js`, `export const homeHtml = \`${out.replace(/`/g,'\\`').replace(/\$\{/g,'\\${')}\`;\n`);
console.log('Done, output length', out.length);