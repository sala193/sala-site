// 店鋪頁的出租卡片（莎拉 2026-10-11 定案）：資料來自後台的公開窗口 store_rentals（只有租屋網上本來就公開的欄位），
// 在客人的瀏覽器裡讀、畫成卡片，所以後台每天早上更新完，店鋪頁就跟著更新，不用重新打包網站。
// 卡片長得跟出售卡片一樣，價格位置改寫「元／月」，左上角標「租」，點下去開永慶租屋網那一間（新分頁）。
// 純函式、不碰畫面與網路，方便測試。

export type Rental = {
  id: string // 永慶租屋網案號
  name: string
  category: string | null
  type: string | null
  district: string | null
  road: string | null
  area?: string | null // 生活圈（後台算好的；沒有就是空）
  floor: string | null // 例：1 ~ 3 / 3
  ping: number | null // 建物坪數；土地案是土地坪數
  parking: boolean
  rent: number | null // 月租金（元）
  url: string | null
  photo: string | null
}

export const escapeHtml = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

// 只收 https 網址，其他一律不用（避免網址被塞進奇怪的東西）
const safeUrl = (u: string | null | undefined): string | null => (u && /^https:\/\//.test(u) ? u : null)

/** 第 index 張出租卡片的 HTML（index 用來排在出售案件後面） */
export function rentCardHtml(r: Rental, index: number): string {
  const url = safeUrl(r.url)
  const photo = safeUrl(r.photo)
  const place = `${r.district ?? ''}${r.road ? `・${r.road}` : ''}`
  const spec = [r.type, r.ping ? `${r.ping} 坪` : '', r.floor ? `樓層 ${r.floor}` : ''].filter(Boolean).join('｜')
  const rent = r.rent == null ? null : r.rent.toLocaleString('en-US')
  const t = `${r.type ?? ''}${r.category ?? ''}`
  return (
    `<a ${url ? `href="${escapeHtml(url)}" target="_blank" rel="noopener"` : ''} class="card block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow"` +
    ` data-rent="1" data-kind="${escapeHtml(r.category ?? '')}" data-district="${escapeHtml(r.district ?? '')}" data-price="${r.rent ?? 0}" data-i="${100000 + index}"` +
    ` data-age="" data-rooms="" data-parking="${r.parking ? '1' : ''}" data-elevator="" data-apartment="" data-townhouse=""` +
    ` data-factory="${/廠房/.test(t) ? '1' : ''}" data-land="${/土地/.test(t) ? '1' : ''}">` +
    `<div class="relative aspect-[4/3] bg-slate-100 grid place-items-center text-slate-300 text-sm">` +
    (photo
      ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(r.name)}" class="w-full h-full object-cover" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : '<span>照片整理中</span>') +
    `<div class="absolute top-2.5 left-2.5 flex gap-1.5"><span class="bg-slate-900/80 text-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-md">租</span></div>` +
    `</div>` +
    `<div class="p-4">` +
    `<p class="text-xs text-slate-400 font-medium">${escapeHtml(place)}</p>` +
    `<h2 class="text-base font-bold text-slate-900 leading-snug mt-0.5 line-clamp-2">${escapeHtml(r.name)}</h2>` +
    `<p class="text-xs text-slate-500 mt-1.5">${escapeHtml(spec)}</p>` +
    `<p class="mt-2 flex items-baseline gap-1">` +
    (rent
      ? `<span class="text-2xl font-black text-rose-600 tracking-tight">${escapeHtml(rent)}</span><span class="text-sm font-extrabold text-rose-600">元／月</span>`
      : '<span class="text-base font-bold text-slate-500">租金洽詢</span>') +
    `</p></div></a>`
  )
}
