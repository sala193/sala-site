// 「調件」案件加進莎拉店鋪的挑選規則：node --test tests/
import assert from 'node:assert/strict'
import { test } from 'node:test'
// @ts-expect-error 純 JS 檔，沒有型別宣告
import { carryOverTransfers, normalizeTransfers, pickTransferItems } from '../scripts/transfers.mjs'

test('案號統一成 YC＋數字、同一家店合併、壞資料略過', () => {
  const r = normalizeTransfers([
    { shopCode: '033688081', storeName: '八德建德公園加盟店', caseNos: ['1919149', 'YC1919149', 'abc'] },
    { shopCode: '033688081', caseNos: ['YC1921804'] },
    { shopCode: 'x', caseNos: ['YC1111111'] },
    { shopCode: '033688081' },
  ])
  assert.deepEqual(r, [{ shopCode: '033688081', storeName: '八德建德公園加盟店', caseNos: ['YC1919149', 'YC1921804'] }])
})

test('不是陣列就當作沒有調件案件', () => {
  assert.deepEqual(normalizeTransfers(null), [])
  assert.deepEqual(normalizeTransfers({}), [])
})

test('只挑指定案號的案件，並標上 transfer，其他店的案件不進來', () => {
  const list = [
    { id: '1', caseNo: 'YC1919149', price: 1458 },
    { id: '2', caseNo: 'YC9999999', price: 500 },
    { id: '3', caseNo: null },
  ]
  const r = pickTransferItems(list, ['YC1919149'])
  assert.equal(r.length, 1)
  assert.equal(r[0].id, '1')
  assert.equal(r[0].transfer, true)
  assert.equal(list[0].transfer, undefined, '不改動原本的資料')
})

test('受託店頁面裡找不到案號（官網已撤下）→ 一筆都不挑', () => {
  assert.deepEqual(pickTransferItems([{ id: '2', caseNo: 'YC9999999' }], ['YC1919149']), [])
})

test('抓不到受託店時，沿用上一次存的調件案件；一般案件不沿用', () => {
  const prev = new Map([
    ['7456509', { id: '7456509', caseNo: 'YC1919149', transfer: true }],
    ['111', { id: '111', caseNo: 'YC1035245' }],
  ])
  const r = carryOverTransfers(prev.values(), ['YC1919149'])
  assert.deepEqual(r.map((x: { id: string }) => x.id), ['7456509'])
})
