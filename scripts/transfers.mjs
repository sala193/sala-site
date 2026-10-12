// 「調件」案件：向永慶別間店調來、莎拉可以帶看與銷售的物件（莎拉 2026-10-12 定案：上莎拉店鋪）。
// 它們不在我們兩間店的官網清單裡，所以另外記在 src/data/transfers.json：
//   [{ "shopCode": "033688081", "storeName": "八德建德公園加盟店", "caseNos": ["YC1919149"] }]
// shopCode＝受託店的官網店代碼（官網店頁網址 shop.yungching.com.tw/<店代碼>/list）。
// 純函式，不碰檔案、不連網，方便測試；同步程式（sync-listings.mjs）和測試共用。

/** 把 transfers.json 整理乾淨：店代碼與案號都要有，案號統一成「YC＋數字」，同一家店合併 */
export function normalizeTransfers(raw) {
  const byShop = new Map()
  for (const t of Array.isArray(raw) ? raw : []) {
    const shopCode = String(t?.shopCode ?? '').trim()
    if (!/^\d{8,12}$/.test(shopCode)) continue
    const caseNos = (Array.isArray(t.caseNos) ? t.caseNos : [])
      .map((c) => String(c).trim().replace(/^YC/i, ''))
      .filter((c) => /^\d{6,9}$/.test(c))
      .map((c) => `YC${c}`)
    if (!caseNos.length) continue
    const cur = byShop.get(shopCode) ?? { shopCode, storeName: String(t.storeName || shopCode), caseNos: [] }
    for (const c of caseNos) if (!cur.caseNos.includes(c)) cur.caseNos.push(c)
    byShop.set(shopCode, cur)
  }
  return [...byShop.values()]
}

/** 從受託店的整份列表裡，只挑出要的案號，並標上 transfer（其他案件原樣不進來） */
export function pickTransferItems(listings, caseNos) {
  const want = new Set(caseNos)
  return (listings || []).filter((x) => x?.caseNo && want.has(x.caseNo)).map((x) => ({ ...x, transfer: true }))
}

/** 受託店這次抓不到時：沿用上一次存的調件案件，避免被誤當成「官網撤下」而收進存檔 */
export function carryOverTransfers(previousItems, caseNos) {
  const want = new Set(caseNos)
  return [...previousItems].filter((x) => x?.transfer && x.caseNo && want.has(x.caseNo))
}
