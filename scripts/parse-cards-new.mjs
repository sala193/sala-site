// 永慶店頁（2026-11 改版後）列表卡片解析。
// 每張卡是 <li class="shop-buy-list-content__item">，內有 <yc-ng-buy-house-card>；
// 新版卡片沒有 YC 案號，只有網址裡的官網物件編號（house/7414547）。
// 輸出欄位跟舊版 parseBlock 一樣（id、name、address、type、age、rooms…），
// 案號（caseNo）由呼叫的人用「上一次存的清單」補回來。

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '‧');

const strip = (h) =>
  decodeEntities(
    h
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

export function parseNewCards(html, store) {
  const parts = html.split(/<li[^>]*class="[^"]*shop-buy-list-content__item[^"]*"[^>]*>/).slice(1);
  const out = [];
  for (const p of parts) {
    const id = (/\/house\/(\d+)/.exec(p) || [])[1];
    if (!id) continue;
    const pick = (re) => strip((re.exec(p) || [])[1] || '');
    const name = pick(/<h2[^>]*class="caseName"[^>]*>([\s\S]*?)<\/h2>/);
    const address = pick(/<span[^>]*class="address"[^>]*>([\s\S]*?)<\/span>/);
    const info = (/class="case-info"[\s\S]*?<\/div>/.exec(p) || [''])[0];
    const spans = [...info.matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => strip(m[1])).filter(Boolean);
    let type = null;
    let age = null;
    let rooms = null;
    let buildingPing = null;
    let landPing = null;
    for (const t of spans) {
      let m;
      if (/^(電梯大樓|電梯華廈|華廈|透天厝|公寓|辦公|廠房|店面|土地|其他)$/.test(t)) type = t;
      else if ((m = /^([\d.]+)\s*年$/.exec(t))) age = parseFloat(m[1]);
      else if ((m = /^(\d+)房\(室\)(\d+)廳(\d+)衛$/.exec(t))) rooms = `${m[1]}房${m[2]}廳${m[3]}衛`;
      else if ((m = /^建坪\s*([\d.]+)$/.exec(t))) buildingPing = parseFloat(m[1]);
      else if ((m = /^地坪\s*([\d.]+)$/.exec(t))) landPing = parseFloat(m[1]);
    }
    if (buildingPing === 0) buildingPing = null;
    if (landPing === 0) landPing = null;
    if (age === 0 && (type === '土地' || !rooms)) age = null;
    const priceM = /class="price"[^>]*>\s*([\d,]+)\s*</.exec(p);
    const price = priceM ? parseInt(priceM[1].replace(/,/g, ''), 10) : null;
    const origBlk = (/origin-and-car-price-wrapper[^>]*>([\s\S]*?)<div[^>]*discount-and-price/.exec(p) || [])[1] || '';
    const origM = /([\d,]{3,})\s*萬/.exec(strip(origBlk));
    const orig = origM ? parseInt(origM[1].replace(/,/g, ''), 10) : null;
    const text = strip(p);
    const imgM = /<img[^>]+src="([^"]+)"/.exec(p);
    let image = null;
    if (imgM) {
      image = imgM[1].replace(/&amp;/g, '&');
      if (image.startsWith('//')) image = `https:${image}`;
      image = image.replace(/([?&])width=\d+/, '$1width=640');
    }
    const disc = /(\d+(?:\.\d+)?)\s*%/.exec(text);
    out.push({
      id,
      store: store.shopCode,
      storeName: store.storeName,
      caseNo: null,
      name: name || null,
      address: address || null,
      type,
      age,
      rooms,
      buildingPing,
      landPing,
      price,
      originalPrice: orig !== null && orig !== price ? orig : null,
      discountPercent: disc ? parseFloat(disc[1]) : null,
      isNew: /新上/.test(text),
      isHot: /強打/.test(text),
      image,
      url: `https://buy.yungching.com.tw/house/${id}`
    });
  }
  return out;
}
