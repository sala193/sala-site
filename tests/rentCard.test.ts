// 店鋪頁出租卡片的測試：node --test tests/
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { escapeHtml, rentCardHtml } from '../src/lib/rentCard.ts'
import type { Rental } from '../src/lib/rentCard.ts'

const base: Rental = {
  id: '2417865', name: '藝文特區中正綠園邸高樓層採光3+1房平車', category: '住宅', type: '住宅', district: '桃園區', road: '中正路',
  floor: '10 ~ 10 / 20', ping: 37.66, parking: true, rent: 29800, url: 'https://rent.yungching.com.tw/house/2417865',
  photo: 'https://yccdn.yungching.com.tw/v1/image/?key=ABC',
}

test('出租卡片：案名、區與路、型態坪數樓層、月租金、租標籤，點了開店鋪自己的租件單案頁', () => {
  const h = rentCardHtml(base, 3)
  assert.match(h, /href="\/r\/\?id=2417865"/)
  assert.doesNotMatch(h, /target="_blank"/)
  assert.match(h, /桃園區・中正路/)
  assert.match(h, /藝文特區中正綠園邸高樓層採光3\+1房平車/)
  assert.match(h, /住宅｜37\.66 坪｜樓層 10 ~ 10 \/ 20/)
  assert.match(h, />29,800<\/span><span[^>]*>元／月</)
  assert.match(h, /bg-slate-900\/80 text-amber-200[^>]*>租</)
  assert.match(h, /data-rent="1"/)
  assert.match(h, /data-i="100003"/)
  assert.match(h, /data-price="29800"/)
  assert.match(h, /data-parking="1"/)
  assert.match(h, /<img src="https:\/\/yccdn\.yungching\.com\.tw\/v1\/image\/\?key=ABC"/)
})

test('出租卡片：沒照片寫「照片整理中」、沒租金寫「租金洽詢」、廠房土地有標記', () => {
  const h = rentCardHtml({ ...base, photo: null, rent: null, type: '廠房', category: '廠房', parking: false }, 0)
  assert.match(h, /照片整理中/)
  assert.doesNotMatch(h, /<img /)
  assert.match(h, /租金洽詢/)
  assert.match(h, /data-factory="1"/)
  assert.match(h, /data-parking=""/)
  assert.match(rentCardHtml({ ...base, type: '土地', category: '土地' }, 0), /data-land="1"/)
})

test('出租卡片：特殊字元一律跳脫；不是 https 的網址不用', () => {
  assert.equal(escapeHtml(`<b>"x"&'y'</b>`), '&lt;b&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/b&gt;')
  const h = rentCardHtml({ ...base, name: '<script>alert(1)</script>', url: 'javascript:alert(1)', photo: 'http://example.com/a.jpg' }, 0)
  assert.doesNotMatch(h, /<script>/)
  assert.match(h, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(h, /javascript:/)
  assert.doesNotMatch(h, /example\.com/)
  assert.match(h, /href="\/r\/\?id=2417865"/) // 卡片一律開自己的單案頁，不會連到壞網址
})

test('出租卡片：圖庫有照片就用自己的圖庫第 1 張，沒有才用租屋網封面', () => {
  assert.match(rentCardHtml({ ...base, photos: 5 }, 0), /cases\/rent2417865\/01\.webp/)
  assert.match(rentCardHtml({ ...base, photos: 0 }, 0), /yccdn\.yungching\.com\.tw/)
})
