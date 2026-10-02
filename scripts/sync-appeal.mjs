// 把莎拉在後台勾的「特色亮點」抓下來，存成 src/data/appeal.json（官網案號 → 勾選的詞）。
// 讀的是 Supabase 的公開函式 store_appeal_features（只回傳案號與詞，沒有任何私人資料）。
// 抓不到就保留舊檔，不讓官網壞掉。
import { writeFileSync, existsSync } from 'node:fs';

const API = 'https://dlfleszjcfeickibjcee.supabase.co/rest/v1/rpc/store_appeal_features';
const KEY = 'sb_publishable_TFAFZE-d5n0ElisMATr9rw_ku8be1xT'; // 公開的 publishable key（後台網頁本來就公開帶著）
const OUT = new URL('../src/data/appeal.json', import.meta.url);

try {
  const res = await fetch(API, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n');
  console.log(`特色亮點：${Object.keys(data).length} 間有勾選`);
} catch (e) {
  console.warn('抓不到特色亮點，保留舊檔：', e.message);
  if (!existsSync(OUT)) writeFileSync(OUT, '{}\n');
}
