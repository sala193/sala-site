// 店鋪頁 /cases 的篩選（莎拉 2026-10-11 定案）：可以多選。
// 同一類裡是「或」（2房＋3房＝2 房或 3 房；電梯＋公寓＝兩種都看），不同類之間是「且」（3房＋車位＋電梯＝三個條件都要符合）。
// 房數：2房、3房、4房以上；車位：官網有載明車位（沒寫的不知道有沒有，不猜）；
// 型態：電梯（電梯大樓＋華廈）、公寓、透天，另外「進階」裡有廠房、土地，以及總價區間（最低～最高，單位萬，含頭尾）。
// 純函式、不碰檔案，方便測試；店鋪頁的程式和測試共用這一份。

export type Flags = {
  rooms: number | null // 房數；官網沒寫（土地、廠房等）是 null
  price: number | null // 總價（萬）；沒有就是 null
  parking: boolean
  elevator: boolean
  apartment: boolean
  townhouse: boolean
  factory: boolean
  land: boolean
}

export type TypeKey = 'elevator' | 'apartment' | 'townhouse' | 'factory' | 'land'
export type RoomKey = '2' | '3' | '4+'

export type Selection = {
  rooms: Set<RoomKey>
  parking: boolean
  types: Set<TypeKey>
  priceMin: number | null // 萬；null＝不限
  priceMax: number | null
}

export const emptySelection = (): Selection => ({ rooms: new Set(), parking: false, types: new Set(), priceMin: null, priceMax: null })

// 總價下拉選單的檔位（萬）；依目前 271 間的分布訂：中位數約 1,500 萬、最高到 12 億
export const PRICE_STEPS = [500, 800, 1000, 1200, 1500, 2000, 3000, 5000, 10000]
export const priceLabel = (n: number): string => (n >= 10000 ? `${n / 10000} 億` : `${n.toLocaleString('en-US')} 萬`)

type Source = { type?: string | null; rooms?: string | null; price?: number | null; detail?: Record<string, any> | null }

/** 從一筆案件資料算出各個條件（都只看官網有寫的欄位） */
export function flagsOf(item: Source): Flags {
  const t = item.type || ''
  const m = /^(\d+)房/.exec(item.rooms || '')
  return {
    rooms: m ? Number(m[1]) : null,
    price: item.price ? item.price : null,
    parking: Boolean(item.detail?.parking),
    elevator: /電梯大樓|華廈/.test(t),
    apartment: /公寓/.test(t),
    townhouse: /透天/.test(t),
    factory: /廠房/.test(t),
    land: /土地/.test(t),
  }
}

/** 最低、最高填反了（最低比最高大）就當成對調，不讓客人看到空白頁 */
export function priceRange(s: Selection): [number | null, number | null] {
  const { priceMin: lo, priceMax: hi } = s
  return lo !== null && hi !== null && lo > hi ? [hi, lo] : [lo, hi]
}

export function matches(f: Flags, s: Selection): boolean {
  if (s.rooms.size) {
    if (f.rooms === null) return false
    const key: string = f.rooms >= 4 ? '4+' : String(f.rooms)
    if (!s.rooms.has(key as RoomKey)) return false
  }
  if (s.parking && !f.parking) return false
  if (s.types.size && ![...s.types].some((k) => f[k])) return false
  const [lo, hi] = priceRange(s)
  if (lo !== null || hi !== null) {
    if (f.price === null) return false
    if (lo !== null && f.price < lo) return false
    if (hi !== null && f.price > hi) return false
  }
  return true
}

/** 有選任何條件嗎（決定要不要顯示「清除」） */
export const hasSelection = (s: Selection): boolean =>
  s.rooms.size > 0 || s.parking || s.types.size > 0 || s.priceMin !== null || s.priceMax !== null
