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
  rent: boolean // 出租案件（後台來的）；出售案件都是 false
  age: number | null // 屋齡（年）；官網沒寫（出租案件）是 null
  area: string | null // 生活圈（後台算好的公開窗口給的）；沒有就是 null
}

export type TypeKey = 'elevator' | 'apartment' | 'townhouse' | 'factory' | 'land'
export type RoomKey = '2' | '3' | '4+'
export type AgeKey = '5' | '10' | '20' | '30' | '30+'

// 生活圈（莎拉 2026-10-11）：key 是後台資料庫裡的名稱（store_areas／store_rentals 給的就是這個），label 是客人看到的字。
// 鳳鳴重劃區、尖山二橋由路名自動歸類，其他由莎拉在後台標；以後要加（例如老街區、國華站）在這裡加一行。
export const LIVING_AREAS: { key: string; label: string }[] = [
  { key: '鳳鳴重劃區生活圈', label: '鳳鳴重劃區' },
  { key: '尖山二橋生活圈', label: '尖山二橋' },
]

// 屋齡區間（年）：5 年內＝0～5、5～10＝大於 5 到 10、依此類推；邊界歸給小的那一格
export const AGE_BUCKETS: { key: AgeKey; label: string; min: number | null; max: number | null }[] = [
  { key: '5', label: '5年內', min: null, max: 5 },
  { key: '10', label: '5~10年', min: 5, max: 10 },
  { key: '20', label: '10~20年', min: 10, max: 20 },
  { key: '30', label: '20~30年', min: 20, max: 30 },
  { key: '30+', label: '30年以上', min: 30, max: null },
]
const inAge = (age: number, key: AgeKey): boolean => {
  const b = AGE_BUCKETS.find((x) => x.key === key)!
  return (b.min === null || age > b.min) && (b.max === null || age <= b.max)
}

export type Selection = {
  ages: Set<AgeKey> // 屋齡區間（同一類是「或」）
  areas: Set<string> // 生活圈（同一類是「或」）；沒有生活圈的案件，選了就不會出現
  rooms: Set<RoomKey>
  parking: boolean
  types: Set<TypeKey>
  priceMin: number | null // 萬；null＝不限
  priceMax: number | null
  // 租／售（跟後台一樣，放在「進階」）：''＝只看出售（預設，出租案件不出現）、'rent'＝只看出租、'both'＝租和售都看
  deal: '' | 'rent' | 'both'
}

export const emptySelection = (): Selection => ({ ages: new Set(), areas: new Set(), rooms: new Set(), parking: false, types: new Set(), priceMin: null, priceMax: null, deal: '' })

// 總價下拉選單的檔位（萬）；依目前 271 間的分布訂：中位數約 1,500 萬、最高到 12 億
export const PRICE_STEPS = [500, 800, 1000, 1200, 1500, 2000, 3000, 5000, 10000]
export const priceLabel = (n: number): string => (n >= 10000 ? `${n / 10000} 億` : `${n.toLocaleString('en-US')} 萬`)

type Source = { type?: string | null; rooms?: string | null; price?: number | null; age?: number | null; area?: string | null; detail?: Record<string, any> | null }

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
    rent: false,
    age: typeof item.age === 'number' ? item.age : null,
    area: item.area ?? null,
  }
}

// 後台出租案件（公開窗口 store_rentals 給的欄位）算出各個條件：租屋網清單沒有房數、屋型、總價（萬），這幾項都是空的，
// 所以選了房數、電梯、公寓、透天或總價區間，出租案件就不會出現（沒資料不猜）；車位、廠房、土地有資料才算
export type RentalSource = { type?: string | null; category?: string | null; parking?: boolean | null; area?: string | null }
export function rentFlagsOf(r: RentalSource): Flags {
  const t = r.type || r.category || ''
  return {
    rooms: null,
    price: null,
    parking: Boolean(r.parking),
    elevator: false,
    apartment: false,
    townhouse: false,
    factory: /廠房/.test(t),
    land: /土地/.test(t),
    rent: true,
    age: null,
    area: r.area ?? null,
  }
}

/** 最低、最高填反了（最低比最高大）就當成對調，不讓客人看到空白頁 */
export function priceRange(s: Selection): [number | null, number | null] {
  const { priceMin: lo, priceMax: hi } = s
  return lo !== null && hi !== null && lo > hi ? [hi, lo] : [lo, hi]
}

export function matches(f: Flags, s: Selection): boolean {
  // 租／售：預設只看出售，選了「出租」或「租和售」，出租案件才會出現
  if (s.deal === '' && f.rent) return false
  if (s.deal === 'rent' && !f.rent) return false
  if (s.ages.size) {
    if (f.age === null) return false
    const age = f.age
    if (![...s.ages].some((k) => inAge(age, k))) return false
  }
  if (s.areas.size && (f.area === null || !s.areas.has(f.area))) return false
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
  s.ages.size > 0 || s.areas.size > 0 || s.rooms.size > 0 || s.parking || s.types.size > 0 || s.priceMin !== null || s.priceMax !== null || s.deal !== ''
