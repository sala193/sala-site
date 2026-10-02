/**
 * check-store.mjs —— 店鋪頁驗收（建置後執行：node scripts/check-store.mjs）
 *  1. 罐頭詞（滿租、秒殺、頂奢、金雞母、屋主含淚）：區分「官網原文」與「我們生成」，我們生成的必須 0
 *  2. 大樓／華廈／公寓不可出現「室內有電梯」
 *  3. 統計 VR 頁數、標籤用量
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const listings = JSON.parse(readFileSync(path.join(root, 'src/data/listings.json'), 'utf-8'));
const byId = new Map(listings.map((x) => [x.id, x]));
const BAD = ['滿租', '秒殺', '頂奢', '金雞母', '屋主含淚'];

const text = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, '\n').replace(/<style[\s\S]*?<\/style>/g, '\n')
  .replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&');

let pages = 0, vrPages = 0, elevBad = 0;
const official = {}; const generated = {}; const tags = {};
const generatedEx = [];
for (const id of readdirSync(path.join(root, 'dist/p'))) {
  const it = byId.get(id);
  if (!it) continue;
  pages++;
  const t = text(readFileSync(path.join(root, 'dist/p', id, 'index.html'), 'utf-8'));
  const src = `${it.name || ''} ${it.detail?.title || ''} ${(it.detail?.features || []).join(' ')}`;
  for (const w of BAD) {
    if (!t.includes(w)) continue;
    if (src.includes(w)) official[w] = (official[w] || 0) + 1;
    else { generated[w] = (generated[w] || 0) + 1; generatedEx.push(`${id}:${w}`); }
  }
  if (t.includes('室內有電梯') && /大樓|華廈|公寓/.test(it.type || '')) elevBad++;
  if (t.includes('720° VR 環景')) vrPages++;
  for (const k of ['室內有電梯', '大地坪', '宜收租', '租客穩定']) if (t.includes(k)) tags[k] = (tags[k] || 0) + 1;
}
console.log(JSON.stringify({ pages, vrPages, 官網原文含罐頭詞的頁數: official, 我們生成含罐頭詞: generated, 大樓類出現室內有電梯: elevBad, 標籤用量: tags }, null, 1));
if (Object.keys(generated).length || elevBad) { console.error('❌ 驗收未過', generatedEx.slice(0, 10)); process.exit(1); }
console.log('✅ 我們生成的內容：罐頭詞 0、大樓類「室內有電梯」0');
