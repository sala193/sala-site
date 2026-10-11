// 類似物件：單案頁最下面「類似的房子」用。
// 排序（莎拉 2026-10-11 定案）：同社區最優先 → 同行政區其他社區／無社區；
// 每一層裡依序比：總價越接近 → 房數一樣 → 有車位 → 屋齡越接近 → 坪數越接近。
// 同區的要符合「中等」標準：同類型、房數差 1 間內、屋齡差 10 年內；沒有房數或屋齡的（土地、廠房等）改看坪數上下 30％。
// 同社區的不看房數屋齡。最多 6 間，湊不到 3 間整塊不顯示。資料不夠就不放，不猜。
// 純函式、不碰檔案，方便測試；地區／類型的判斷由呼叫端傳進來（跟店鋪頁用同一組）。

export type SimItem = {
  id: string
  address?: string | null
  type?: string | null
  rooms?: string | null
  age?: number | null
  buildingPing?: number | null
  landPing?: number | null
  price?: number | null
  detail?: Record<string, any> | null
}

export type Geo = {
  districtOf: (i: any) => string
  kindOf: (i: any) => string
}

export type Similar<T> = { item: T; reason: 'community' | 'district' }

const MAX_ROOM_DIFF = 1
const MAX_AGE_DIFF = 10
const MAX_SIZE_RATIO = 0.3

const roomsOf = (i: SimItem): number | null => {
  const m = /^(\d+)房/.exec(i.rooms || '')
  return m ? Number(m[1]) : null
}
// 官網只有「有車位」才會寫車位；沒寫的不知道有沒有，所以只拿「有」當條件，不猜「沒有」
const hasParking = (i: SimItem): boolean => Boolean(i.detail?.parking)
const sizeOf = (i: SimItem): number | null => i.buildingPing || i.landPing || null
const communityOf = (i: SimItem): string => String(i.detail?.community || '').trim()

function meetsStandard(a: SimItem, b: SimItem): boolean {
  const ra = roomsOf(a)
  if (ra !== null && a.age != null) {
    const rb = roomsOf(b)
    return rb !== null && b.age != null && Math.abs(rb - ra) <= MAX_ROOM_DIFF && Math.abs(b.age - a.age) <= MAX_AGE_DIFF
  }
  const sa = sizeOf(a)
  const sb = sizeOf(b)
  return Boolean(sa && sb && Math.abs(sb - sa) / sa <= MAX_SIZE_RATIO)
}

// 越小越像；依序比：總價 → 房數一樣 → 有車位 → 屋齡 → 坪數
function closeness(a: SimItem, b: SimItem): number[] {
  const ra = roomsOf(a)
  const rb = roomsOf(b)
  const sa = sizeOf(a)
  const sb = sizeOf(b)
  return [
    a.price && b.price ? Math.abs(a.price - b.price) / a.price : 999,
    ra !== null && ra === rb ? 0 : 1,
    hasParking(a) && !hasParking(b) ? 1 : 0,
    a.age != null && b.age != null ? Math.abs(a.age - b.age) : 999,
    sa && sb ? Math.abs(sa - sb) / sa : 999,
  ]
}

function byCloseness<T extends SimItem>(self: T) {
  return (x: T, y: T): number => {
    const kx = closeness(self, x)
    const ky = closeness(self, y)
    for (let i = 0; i < kx.length; i++) if (kx[i] !== ky[i]) return kx[i] - ky[i]
    return x.id < y.id ? -1 : 1 // 完全一樣時固定順序，每次打包結果才不會跳來跳去
  }
}

export function similarCases<T extends SimItem>(self: T, all: T[], geo: Geo, limit = 6, min = 3): Similar<T>[] {
  const community = communityOf(self)
  const district = geo.districtOf(self)
  const kind = geo.kindOf(self)
  const tier1: T[] = []
  const tier2: T[] = []
  const seen = new Set<string>([self.id])
  for (const b of all) {
    if (seen.has(b.id)) continue
    seen.add(b.id)
    if (community && communityOf(b) === community) {
      tier1.push(b)
      continue
    }
    if (geo.districtOf(b) === district && geo.kindOf(b) === kind && meetsStandard(self, b)) tier2.push(b)
  }
  const cmp = byCloseness(self)
  const out: Similar<T>[] = [
    ...tier1.sort(cmp).map((item) => ({ item, reason: 'community' as const })),
    ...tier2.sort(cmp).map((item) => ({ item, reason: 'district' as const })),
  ]
  return out.length < min ? [] : out.slice(0, limit)
}
