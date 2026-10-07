// 蔡莎拉專屬店鋪：共用設定與小工具（單案頁 /p/<id> 與店鋪 /cases 共用）
import listings from '../data/listings.json';
import manifest from '../data/photo-manifest.json';
import manifestSb from '../data/photo-manifest-sb.json';
import overrides from '../data/overrides.json';
import archive from '../data/archive.json';
import archiveStatus from '../data/archive-status.json';
import { cleanTitle } from './notes';

export { AGENT } from './agent';

// 圖庫（Cloudflare R2）公開網址；每件照片路徑 cases/yc<官網id>/NN.webp
export const PHOTO_BASE = 'https://pub-61c50068c9924c239dfb2d0e0ec9bbd2.r2.dev/cases';

// 新案件的照片備份存在 Supabase Storage（每天早上雲端自動補），路徑 yc<官網id>/NN.jpg
export const SB_PHOTO_BASE = 'https://dlfleszjcfeickibjcee.supabase.co/storage/v1/object/public/case-photos';

type Item = (typeof listings)[number] & { detail?: Record<string, any> };

/** 照片優先序（目前實作第 3 層：圖庫的官網備份；沒有備份就直接用官網網址） */
export function photosOf(item: Item): string[] {
  const n = (manifest as Record<string, number>)[item.id] || 0;
  if (n > 0) return Array.from({ length: n }, (_, i) => `${PHOTO_BASE}/yc${item.id}/${String(i + 1).padStart(2, '0')}.webp`);
  const m = (manifestSb as Record<string, number>)[item.id] || 0;
  if (m > 0) return Array.from({ length: m }, (_, i) => `${SB_PHOTO_BASE}/yc${item.id}/${String(i + 1).padStart(2, '0')}.jpg`);
  return item.images?.length ? item.images : item.image ? [item.image] : [];
}

/** 銷售頁存檔：官網已撤下、但我們留著凍結內容的案件（只給莎拉手動分享，不進店鋪清單、不進搜尋引擎） */
export function archivedCases(): Item[] {
  const live = new Set((listings as Item[]).map((it) => it.id));
  return Object.values(archive as Record<string, Item>).filter((it) => !live.has(it.id));
}

/** 存檔頁寫「已成交」還是「已下架」：只有後台標「已成交」才寫已成交（每天同步，頁面上也會即時再查一次） */
export function archiveLabel(id: string): '已成交' | '已下架' {
  return (archiveStatus as Record<string, string>)[id] === '已成交' ? '已成交' : '已下架';
}

/** 全部案件（同一個官網 id 只留一筆） */
export function allCases(): Item[] {
  const byId = new Map<string, Item>();
  for (const it of listings as Item[]) if (!byId.has(it.id)) byId.set(it.id, it);
  return [...byId.values()];
}

/** 區域：從地址取「○○區」 */
export function districtOf(item: Item): string {
  return item.address?.match(/[市縣](.{1,3}?[區鄉鎮市])/)?.[1] ?? '其他';
}

/** 粗分類，給店鋪篩選用 */
export function kindOf(item: Item): '住宅' | '透天' | '店面辦公' | '廠房' | '土地' {
  const t = item.type || '';
  if (t.includes('土地')) return '土地';
  if (t.includes('廠房')) return '廠房';
  if (t.includes('店面') || t.includes('辦公')) return '店面辦公';
  if (t.includes('透天')) return '透天';
  return '住宅';
}

export function priceText(p?: number | null): string {
  if (!p) return '價格洽詢';
  return p >= 10000 ? `${(p / 10000).toFixed(2).replace(/\.?0+$/, '')} 億` : `${p.toLocaleString('en-US')} 萬`;
}

/** 路段：去掉「縣市＋區」，只留路名（地址本來就只到路段，不放門牌） */
export function roadOf(item: Item): string {
  return (item.address || '').replace(/^[^市縣]*[市縣][^區鄉鎮市]{1,3}[區鄉鎮市]/, '');
}

/** 對外顯示的案名：個別案件有莎拉親自改的（overrides.json）就用她的；否則用官網完整案名，並洗掉浮誇詞與符號 */
export function titleOf(item: Item): string {
  const o = (overrides as Record<string, { title?: string }>)[item.id]?.title;
  if (o) return o;
  const full = item.detail?.title as string | undefined;
  const n = item.name || '';
  const raw = /[…]|\.\.\.$/.test(n) && full ? full : n || full || '待售物件';
  return cleanTitle(raw);
}

/** 價格拆成大字數字與單位，例如 1598 → ['1,598','萬']，12500 → ['1.25','億'] */
export function priceParts(p?: number | null): [string, string] {
  if (!p) return ['價格洽詢', ''];
  return p >= 10000
    ? [(p / 10000).toFixed(2).replace(/\.?0+$/, ''), '億']
    : [p.toLocaleString('en-US'), '萬'];
}

/** 特色文字前面的項目符號（⭕●★1. 等）拿掉，版面統一用打勾圖示 */
export function cleanFeature(line: string): string {
  return line.replace(/^[\s⭕●○◎★☆■□◆◇▲△✔✅✓•・\-–—]+/, '').replace(/^\d+[.、)）]\s*/, '').trim();
}

/** 案號顯示：YC1913920 → 1913920 */
export function caseNoShort(no?: string | null): string {
  return (no || '').replace(/^YC/i, '');
}
