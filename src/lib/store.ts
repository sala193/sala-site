// 蔡莎拉專屬店鋪：共用設定與小工具（單案頁 /p/<id> 與店鋪 /cases 共用）
import listings from '../data/listings.json';
import manifest from '../data/photo-manifest.json';

// 經紀人固定標蔡莎拉（跟永慶工具分享頁一致：不管哪一店接的案子，一律標這組）
export const AGENT = {
  name: '蔡茹儀',
  brand: '蔡莎拉',
  phone: '0986-793-193',
  tel: '0986793193',
  line: 'https://line.me/ti/p/@saLa193',
  lineId: '@saLa193',
  headshot: '/images/sala-headshot.png',
  bio: '我是莎拉，深耕鶯歌、鳳鳴與八德生活圈。這間房子的細節、周邊行情與看屋安排，都可以直接問我。',
  store: '永慶鶯歌建國捷運加盟店',
  company: '廣輝不動產有限公司',
  // 依不動產經紀業管理條例第21條第2項，廣告需標示經紀業與人員登記資料
  broker: '經紀人：簡梅芳（111）新北經字第003924號',
  agent: '營業員：蔡茹儀（100）登字第181761號',
};

// 圖庫（Cloudflare R2）公開網址；每件照片路徑 cases/yc<官網id>/NN.webp
export const PHOTO_BASE = 'https://pub-61c50068c9924c239dfb2d0e0ec9bbd2.r2.dev/cases';

type Item = (typeof listings)[number] & { detail?: Record<string, any> };

/** 照片優先序（目前實作第 3 層：圖庫的官網備份；沒有備份就直接用官網網址） */
export function photosOf(item: Item): string[] {
  const n = (manifest as Record<string, number>)[item.id] || 0;
  if (n > 0) return Array.from({ length: n }, (_, i) => `${PHOTO_BASE}/yc${item.id}/${String(i + 1).padStart(2, '0')}.webp`);
  return item.images?.length ? item.images : item.image ? [item.image] : [];
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

/** 完整案名：列表頁案名被截斷（以…結尾）時，改用詳情頁的完整案名 */
export function titleOf(item: Item): string {
  const full = item.detail?.title as string | undefined;
  const n = item.name || '';
  return /[…]|\.\.\.$/.test(n) && full ? full : n || full || '待售物件';
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
