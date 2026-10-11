// 店鋪頁 /cases 篩選規則的測試：node --test tests/
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptySelection, flagsOf, hasSelection, matches, priceLabel, PRICE_STEPS } from '../src/lib/caseFilter.ts'
import type { RoomKey, TypeKey } from '../src/lib/caseFilter.ts'

const item = (type: string, rooms: string | null, parking?: string) => ({ type, rooms, detail: { parking } })
const sel = (rooms: RoomKey[] = [], parking = false, types: TypeKey[] = []) => {
  const s = emptySelection()
  rooms.forEach((r) => s.rooms.add(r))
  s.parking = parking
  types.forEach((t) => s.types.add(t))
  return s
}

test('flagsOf：電梯＝電梯大樓＋華廈；公寓、透天、廠房、土地各自獨立', () => {
  assert.equal(flagsOf(item('電梯大樓', '3房2廳2衛')).elevator, true)
  assert.equal(flagsOf(item('華廈', '2房2廳1衛')).elevator, true)
  assert.equal(flagsOf(item('公寓', '3房2廳1衛')).elevator, false)
  assert.equal(flagsOf(item('公寓', '3房2廳1衛')).apartment, true)
  assert.equal(flagsOf(item('透天厝', '5房3廳4衛')).townhouse, true)
  assert.equal(flagsOf(item('廠房', null)).factory, true)
  assert.equal(flagsOf(item('土地', null)).land, true)
})

test('flagsOf：房數沒寫就是 null；車位只看官網有沒有寫（沒寫不當作沒有）', () => {
  assert.equal(flagsOf(item('土地', null)).rooms, null)
  assert.equal(flagsOf(item('電梯大樓', '4房2廳3衛')).rooms, 4)
  assert.equal(flagsOf(item('電梯大樓', '2房2廳1衛', '坡道平面固定車位')).parking, true)
  assert.equal(flagsOf(item('電梯大樓', '2房2廳1衛')).parking, false)
})

test('什麼都沒選：全部都符合，包含沒寫房數的土地廠房', () => {
  const s = emptySelection()
  assert.equal(hasSelection(s), false)
  assert.ok(matches(flagsOf(item('土地', null)), s))
  assert.ok(matches(flagsOf(item('電梯大樓', '3房2廳2衛')), s))
})

test('房數：同類是「或」，4房以上包含 5、6 房；沒寫房數和 1 房不會出現', () => {
  const f = (r: string | null) => flagsOf(item('電梯大樓', r))
  assert.ok(matches(f('2房2廳1衛'), sel(['2', '3'])))
  assert.ok(matches(f('3房2廳2衛'), sel(['2', '3'])))
  assert.ok(!matches(f('4房2廳2衛'), sel(['2', '3'])))
  assert.ok(matches(f('4房2廳2衛'), sel(['4+'])))
  assert.ok(matches(f('6房1廳7衛'), sel(['4+'])))
  assert.ok(!matches(f('1房1廳1衛'), sel(['2', '3', '4+'])))
  assert.ok(!matches(flagsOf(item('土地', null)), sel(['2'])))
})

test('型態：同類是「或」，電梯＋公寓兩種都看', () => {
  const s = sel([], false, ['elevator', 'apartment'])
  assert.ok(matches(flagsOf(item('電梯大樓', '3房2廳2衛')), s))
  assert.ok(matches(flagsOf(item('華廈', '3房2廳2衛')), s))
  assert.ok(matches(flagsOf(item('公寓', '3房2廳1衛')), s))
  assert.ok(!matches(flagsOf(item('透天厝', '5房3廳4衛')), s))
})

test('不同類之間是「且」：3房＋車位＋電梯三個都要符合', () => {
  const s = sel(['3'], true, ['elevator'])
  assert.ok(matches(flagsOf(item('電梯大樓', '3房2廳2衛', '坡道平面固定車位')), s))
  assert.ok(!matches(flagsOf(item('電梯大樓', '3房2廳2衛')), s)) // 沒寫車位
  assert.ok(!matches(flagsOf(item('電梯大樓', '2房2廳1衛', '坡道平面固定車位')), s)) // 房數不對
  assert.ok(!matches(flagsOf(item('公寓', '3房2廳1衛', '平面車位')), s)) // 不是電梯
})

test('進階的廠房、土地：跟透天等型態一起算「或」', () => {
  const s = sel([], false, ['land', 'factory'])
  assert.ok(matches(flagsOf(item('土地', null)), s))
  assert.ok(matches(flagsOf(item('廠房', null)), s))
  assert.ok(!matches(flagsOf(item('電梯大樓', '3房2廳2衛')), s))
  assert.ok(matches(flagsOf(item('透天厝', '5房3廳4衛')), sel([], false, ['land', 'townhouse'])))
})

const priced = (price: number | null, type = '電梯大樓') => flagsOf({ type, rooms: '3房2廳2衛', price, detail: null })
const range = (min: number | null, max: number | null) => {
  const s = emptySelection()
  s.priceMin = min
  s.priceMax = max
  return s
}

test('總價區間：含頭尾；只填一邊就是「以上」或「以下」；不限就是全部', () => {
  assert.ok(matches(priced(1000), range(1000, 1500)))
  assert.ok(matches(priced(1500), range(1000, 1500)))
  assert.ok(!matches(priced(999), range(1000, 1500)))
  assert.ok(!matches(priced(1501), range(1000, 1500)))
  assert.ok(matches(priced(5000), range(3000, null)))
  assert.ok(!matches(priced(2999), range(3000, null)))
  assert.ok(matches(priced(480), range(null, 500)))
  assert.ok(!matches(priced(501), range(null, 500)))
  assert.ok(matches(priced(123456), range(null, null)))
})

test('總價區間：最低比最高大就當成對調；沒有總價的不會出現在有選區間時', () => {
  assert.ok(matches(priced(1200), range(1500, 1000)))
  assert.ok(!matches(priced(1600), range(1500, 1000)))
  assert.ok(!matches(priced(null), range(1000, 1500)))
  assert.ok(matches(priced(null), range(null, null)))
})

test('總價區間跟其他條件是「且」，也算有選條件；檔位與顯示字樣', () => {
  const s = range(1000, 2000)
  s.rooms.add('3')
  assert.ok(matches(priced(1500), s))
  assert.ok(!matches(priced(2500), s))
  assert.equal(hasSelection(range(1000, null)), true)
  assert.equal(hasSelection(range(null, null)), false)
  assert.equal(priceLabel(500), '500 萬')
  assert.equal(priceLabel(3000), '3,000 萬')
  assert.equal(priceLabel(10000), '1 億')
  assert.deepEqual(PRICE_STEPS, [...PRICE_STEPS].sort((a, b) => a - b))
})

// ---- 租／售（出租案件）----
import { rentFlagsOf } from '../src/lib/caseFilter.ts'

const rental = (over: Record<string, unknown> = {}) => rentFlagsOf({ type: '店面', category: '店面', parking: false, ...over })

test('租／售：預設只看出售（出租不出現）；選出租只看出租；租和售都看；算一組條件', () => {
  const sale = flagsOf(item('電梯大樓', '3房2廳2衛'))
  const rent = rental()
  const def = emptySelection()
  assert.ok(matches(sale, def) && !matches(rent, def))
  assert.equal(hasSelection(def), false)
  const onlyRent = emptySelection()
  onlyRent.deal = 'rent'
  assert.ok(matches(rent, onlyRent) && !matches(sale, onlyRent))
  assert.equal(hasSelection(onlyRent), true)
  const both = emptySelection()
  both.deal = 'both'
  assert.ok(matches(rent, both) && matches(sale, both))
})

test('出租案件的條件：租屋網沒有房數、屋型、總價，選了這些就不出現；車位、廠房、土地有資料才算', () => {
  const onlyRent = emptySelection()
  onlyRent.deal = 'rent'
  assert.ok(matches(rental(), onlyRent))
  // 房數、電梯、公寓、透天、總價：出租案件沒有資料，不出現
  const rooms = emptySelection(); rooms.deal = 'rent'; rooms.rooms.add('3')
  assert.ok(!matches(rental(), rooms))
  const elev = emptySelection(); elev.deal = 'rent'; elev.types.add('elevator')
  assert.ok(!matches(rental(), elev))
  const price = emptySelection(); price.deal = 'rent'; price.priceMin = 500
  assert.ok(!matches(rental(), price))
  // 車位：有寫才算
  const park = emptySelection(); park.deal = 'rent'; park.parking = true
  assert.ok(!matches(rental({ parking: false }), park) && matches(rental({ parking: true }), park))
  // 廠房、土地
  const fac = emptySelection(); fac.deal = 'rent'; fac.types.add('factory')
  assert.ok(matches(rental({ type: '廠房', category: '廠房' }), fac) && !matches(rental(), fac))
  const land = emptySelection(); land.deal = 'both'; land.types.add('land')
  assert.ok(matches(rental({ type: '土地', category: '土地' }), land))
})

// ---- 屋齡 ----
test('屋齡區間：5年內、5~10、10~20、20~30、30年以上；邊界歸小的那一格；同一類是「或」', () => {
  const age = (n: number | null) => flagsOf({ type: '電梯大樓', rooms: '3房2廳2衛', price: 1000, age: n, detail: null })
  const pick = (...keys: ('5' | '10' | '20' | '30' | '30+')[]) => {
    const s = emptySelection()
    keys.forEach((k) => s.ages.add(k))
    return s
  }
  assert.ok(matches(age(0), pick('5')) && matches(age(5), pick('5')) && !matches(age(5.1), pick('5')))
  assert.ok(matches(age(5.1), pick('10')) && matches(age(10), pick('10')) && !matches(age(10.1), pick('10')))
  assert.ok(matches(age(15), pick('20')) && matches(age(25), pick('30')) && !matches(age(30.5), pick('30')))
  assert.ok(matches(age(30.5), pick('30+')) && matches(age(45), pick('30+')) && !matches(age(30), pick('30+')))
  // 同一類是「或」
  assert.ok(matches(age(3), pick('5', '30+')) && matches(age(40), pick('5', '30+')) && !matches(age(15), pick('5', '30+')))
  // 沒有屋齡資料（出租案件）選了屋齡就不出現；沒選屋齡不受影響
  const onlyRent = pick('5'); onlyRent.deal = 'rent'
  assert.ok(!matches(rentFlagsOf({ type: '店面' }), onlyRent))
  assert.ok(!matches(age(null), pick('5')) && matches(age(null), emptySelection()))
  // 算一組條件
  assert.equal(hasSelection(pick('5')), true)
})

test('生活圈：選了只看那個生活圈；沒有生活圈的案件（出售、出租都一樣）選了就不出現', () => {
  const FENG = '鳳鳴重劃區生活圈'
  const JIAN = '尖山二橋生活圈'
  const withArea = (area: string | null) => ({ ...flagsOf(item('電梯大樓', '3房2廳2衛')), area })
  const s = emptySelection()
  s.areas.add(FENG)
  assert.equal(hasSelection(s), true)
  assert.ok(matches(withArea(FENG), s))
  assert.ok(!matches(withArea(JIAN), s))
  assert.ok(!matches(withArea(null), s))
  // 兩個都選＝或
  s.areas.add(JIAN)
  assert.ok(matches(withArea(JIAN), s))
  assert.ok(!matches(withArea(null), s))
  // 沒選＝全部都過
  assert.ok(matches(withArea(null), emptySelection()))
  // 出租案件：後台給的 area 也算；沒有就不出現
  const rent = (area?: string | null) => rentFlagsOf({ type: '住宅', category: '住宅', area })
  const r = emptySelection()
  r.deal = 'rent'
  r.areas.add(JIAN)
  assert.ok(matches(rent(JIAN), r))
  assert.ok(!matches(rent(FENG), r))
  assert.ok(!matches(rent(null), r))
  assert.ok(!matches(rent(), r))
})
