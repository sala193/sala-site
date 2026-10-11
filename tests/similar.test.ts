// 「類似的房子」找法與排序的測試：node --test tests/
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { similarCases } from '../src/lib/similar.ts'
import type { SimItem } from '../src/lib/similar.ts'

// 跟 src/lib/store.ts 同一套判斷（測試不能直接讀 store.ts，它會載入 json）
const geo = {
  districtOf: (i: SimItem) => i.address?.match(/[市縣](.{1,3}?[區鄉鎮市])/)?.[1] ?? '其他',
  kindOf: (i: SimItem) => {
    const t = i.type || ''
    if (t.includes('土地')) return '土地'
    if (t.includes('廠房')) return '廠房'
    if (t.includes('店面') || t.includes('辦公')) return '店面辦公'
    if (t.includes('透天')) return '透天'
    return '住宅'
  },
}

let n = 0
const home = (over: Partial<SimItem> & { community?: string; parking?: string }): SimItem => {
  const { community, parking, ...rest } = over
  n++
  return {
    id: `h${n}`,
    address: '新北市鶯歌區建國路',
    type: '電梯大樓',
    rooms: '2房2廳1衛',
    age: 10,
    buildingPing: 30,
    price: 1000,
    detail: { community, parking },
    ...rest,
  }
}
const ids = (r: { item: SimItem }[]) => r.map((x) => x.item.id)

test('同社區排最前面，而且不看房數屋齡；同區其他社區往後排', () => {
  const self = home({ id: 'me', community: '森晴', rooms: '2房2廳1衛', age: 5, price: 1000 })
  const sameCommunity3Rooms = home({ id: 'c1', community: '森晴', rooms: '3房2廳2衛', age: 5, price: 1800 })
  const sameCommunityOld = home({ id: 'c2', community: '森晴', rooms: '2房2廳1衛', age: 40, price: 1100 })
  const otherCommunity = home({ id: 'd1', community: '別社區', price: 1000 })
  const noCommunity = home({ id: 'd2', price: 1010, address: '新北市鶯歌區文化路' })
  const r = similarCases(self, [noCommunity, otherCommunity, sameCommunity3Rooms, sameCommunityOld], geo)
  // 同社區先放（價格近的在前），之後才是同區的
  assert.deepEqual(ids(r), ['c2', 'c1', 'd1', 'd2'])
  assert.deepEqual(r.map((x) => x.reason), ['community', 'community', 'district', 'district'])
})

test('同區要符合標準：同類型、房數差 1 間內、屋齡差 10 年內', () => {
  const self = home({ id: 'me', rooms: '2房2廳1衛', age: 10 })
  const ok1 = home({ id: 'ok1', rooms: '3房2廳2衛', age: 20 })
  const ok2 = home({ id: 'ok2', rooms: '1房1廳1衛', age: 0 })
  const ok3 = home({ id: 'ok3' })
  const tooManyRooms = home({ id: 'x1', rooms: '4房2廳2衛' })
  const tooOld = home({ id: 'x2', age: 21 })
  const noAge = home({ id: 'x3', age: null })
  const otherDistrict = home({ id: 'x4', address: '桃園市八德區介壽路' })
  const otherKind = home({ id: 'x5', type: '透天厝' })
  const r = similarCases(self, [ok1, ok2, ok3, tooManyRooms, tooOld, noAge, otherDistrict, otherKind], geo)
  assert.deepEqual(new Set(ids(r)), new Set(['ok1', 'ok2', 'ok3']))
})

test('排序：總價越接近越前面 → 房數一樣 → 有車位 → 屋齡越接近', () => {
  const self = home({ id: 'me', rooms: '2房2廳1衛', age: 10, parking: '坡道平面固定車位', price: 1000 })
  // 總價最接近的排第一，就算房數差 1 間
  const nearPrice3Rooms = home({ id: 'p', rooms: '3房2廳2衛', price: 1005 })
  // 總價一樣遠時：房數一樣的在前
  const sameRoomFar = home({ id: 'q', price: 1200 })
  const otherRoomFar = home({ id: 'r', rooms: '3房2廳2衛', price: 800 })
  const r1 = similarCases(self, [otherRoomFar, sameRoomFar, nearPrice3Rooms], geo)
  assert.deepEqual(ids(r1), ['p', 'q', 'r'])
  // 價格、房數都一樣：有車位的在前
  const park = home({ id: 'a', parking: '昇降平面固定車位', age: 18 })
  const noPark = home({ id: 'b', age: 10 })
  const park2 = home({ id: 'c', parking: '昇降機械固定車位', age: 12 })
  const r2 = similarCases(self, [noPark, park, park2], geo)
  // 有車位的（c 屋齡更近）→ a → 沒車位的 b
  assert.deepEqual(ids(r2), ['c', 'a', 'b'])
})

test('這間沒寫車位：不拿車位當條件（不猜它沒有車位）', () => {
  const self = home({ id: 'me', age: 10 })
  const withPark = home({ id: 'p', age: 17, parking: '坡道平面固定車位' })
  const without = home({ id: 'n', age: 11 })
  const filler = home({ id: 'f', age: 20 })
  const r = similarCases(self, [withPark, without, filler], geo)
  assert.deepEqual(ids(r), ['n', 'p', 'f'])
})

test('湊不到 3 間整塊不顯示；最多放 6 間；不放自己', () => {
  const self = home({ id: 'me' })
  assert.deepEqual(similarCases(self, [self, home({}), home({})], geo), [])
  const many = Array.from({ length: 9 }, () => home({}))
  const r = similarCases(self, [self, ...many], geo)
  assert.equal(r.length, 6)
  assert.ok(!ids(r).includes('me'))
})

test('土地沒有房數屋齡：看同區同類型、坪數上下 30％', () => {
  const land = (over: Partial<SimItem>) => home({ type: '農地', rooms: null, age: null, buildingPing: null, landPing: 100, price: 3000, ...over })
  const self = land({ id: 'me' })
  const a = land({ id: 'a', landPing: 120, price: 3600 })
  const b = land({ id: 'b', landPing: 80, price: 3100 })
  const c = land({ id: 'c', landPing: 100, price: 3000 })
  const tooBig = land({ id: 'x', landPing: 131 })
  const r = similarCases(self, [tooBig, a, b, c], geo)
  assert.deepEqual(ids(r), ['c', 'b', 'a'])
})
