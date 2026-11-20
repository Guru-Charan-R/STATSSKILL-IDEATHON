import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'node:fs';
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const html = fs.readFileSync('../frontend/src/pages/homeContent.js','utf8').replace(/^export const homeHtml = `/, '').replace(/`;\s*$/, '');
const langMap = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };
const target = process.argv[2] || 'ta';
const langName = langMap[target];
console.log('Translating to', langName, 'input length', html.length);
const completion = await client.chat.completions.create({
  model: process.env.GROQ_MODEL,
  messages: [
    { role: 'system', content: `You are a professional translator. Translate all visible English text in the provided HTML to ${langName}. Preserve all HTML tags, attributes, class names, ids, and structure exactly. Do not translate code, URLs, or technical identifiers. Keep numbers as-is. Return ONLY the translated HTML, no markdown fences.` },
    { role: 'user', content: html }
  ],
  temperature: 0.2,
  max_tokens: 32000
});
const out = completion.choices[0].message.content;
fs.writeFileSync(`../frontend/src/pages/homeContent.${target}.js`, `export const homeHtml = \`${out.replace(/`/g,'\\`').replace(/\$\{/g,'\\${')}\`;\n`);
console.log('Done, output length', out.length);