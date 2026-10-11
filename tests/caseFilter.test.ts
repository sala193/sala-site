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
