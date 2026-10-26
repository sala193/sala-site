/**
 * 更新「圖庫已有哪些案件照片」清單（src/data/photo-manifest.json）。
 * 電腦每天 06:30 會把官網新案件照片備份到圖庫（R2），這支程式只用公開網址探測，
 * 找出清單裡還沒有、但圖庫已有的案件，補進清單。只增不減，不需要任何金鑰。
 */
import fs from 'node:fs';

const R2 = 'https://pub-61c50068c9924c239dfb2d0e0ec9bbd2.r2.dev/cases';
const MAX = 15;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

const manifestPath = 'src/data/photo-manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const listings = JSON.parse(fs.readFileSync('src/data/listings.json', 'utf8'));
const items = Array.isArray(listings) ? listings : listings.items || listings.listings;

async function exists(id, n) {
  const url = `${R2}/yc${id}/${String(n).padStart(2, '0')}.webp`;
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA } });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function count(id) {
  let n = 0;
  while (n < MAX && (await exists(id, n + 1))) n += 1;
  return n;
}

let added = 0;
for (const it of items) {
  const id = String(it.id);
  if (manifest[id]) continue;
  const n = await count(id);
  if (n > 0) {
    manifest[id] = n;
    added += 1;
    console.log(`補進 ${id}：${n} 張`);
  }
}
if (added > 0) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
}
console.log(`完成：新增 ${added} 件，清單共 ${Object.keys(manifest).length} 件`);
