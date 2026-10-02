// 從 Supabase 的公開函式抓兩份資料，存進 src/data：
//  ‧ appeal.json：莎拉在後台勾的特色亮點（官網案號 → 詞）
//  ‧ copy.json：莎拉定稿的短評金句（官網案號 → 三個版本＋預設用哪一個）
// 兩個函式都只回傳公開要用的內容，沒有任何私人資料。抓不到就保留舊檔，不讓官網壞掉。
import { writeFileSync, existsSync } from 'node:fs';

const BASE = 'https://dlfleszjcfeickibjcee.supabase.co/rest/v1/rpc';
const KEY = 'sb_publishable_TFAFZE-d5n0ElisMATr9rw_ku8be1xT'; // 公開的 publishable key（後台網頁本來就公開帶著）

async function grab(fn, file, label) {
  const out = new URL(`../src/data/${file}`, import.meta.url);
  try {
    const res = await fetch(`${BASE}/${fn}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const data = await res.json();
    writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
    console.log(`${label}：${Object.keys(data).length} 間`);
  } catch (e) {
    console.warn(`抓不到${label}，保留舊檔：`, e.message);
    if (!existsSync(out)) writeFileSync(out, '{}\n');
  }
}

await grab('store_appeal_features', 'appeal.json', '特色亮點');
await grab('store_copy_all', 'copy.json', '定稿金句');
