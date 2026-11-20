import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'node:fs';
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const raw = fs.readFileSync('../frontend/src/pages/homeContent.js','utf8');
const html = raw.replace(/^export const homeHtml = `/, '').replace(/`;\s*$/, '');
const langMap = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };
const target = process.argv[2] || 'ta';
const langName = langMap[target];

// split by </section> to keep complete sections
const parts = html.split(/(?=<section)/);
console.log('sections:', parts.length);

async function translateSection(sec, retries = 5) {
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
        max_tokens: 8000
      });
      return completion.choices[0].message.content;
    } catch (e) {
      const wait = 25000;
      console.log(`  retry ${attempt+1} after ${wait}ms:`, e.message.slice(0, 80));
      await new Promise(r => setTimeout(r, wait));
    }
  }
  console.log('  FAILED section, keeping English');
  return sec;
}

let out = '';
for (let i = 0; i < parts.length; i++) {
  console.log('translating section', i+1, '/', parts.length, 'len', parts[i].length);
  const t = await translateSection(parts[i]);
  out += t;
  await new Promise(r => setTimeout(r, 20000));
}
fs.writeFileSync(`../frontend/src/pages/homeContent.${target}.js`, `export const homeHtml = \`${out.replace(/`/g,'\\`').replace(/\$\{/g,'\\${')}\`;\n`);
console.log('Done, output length', out.length);