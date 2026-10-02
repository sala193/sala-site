// 配案卡用的公開案件清單（只含公開資料）：/cases.json
import type { APIRoute } from 'astro';
import { allCases, photosOf, priceParts, roadOf, titleOf, caseNoShort, districtOf, PHOTO_BASE } from '../lib/store';
import { buildModules, tagsFor } from '../lib/notes';
import manifest from '../data/photo-manifest.json';

export const GET: APIRoute = () => {
  const list = allCases().map((it) => {
    const d = (it as any).detail || {};
    const title = titleOf(it);
    const [pn, pu] = priceParts(it.price);
    const mods = buildModules(d.features || [], { landPing: it.landPing, type: it.type });
    // 卡片上的一句話：取官網原句，優先租況、建築配置、結構安全；太長就不放（不截斷句子）
    const sentence =
      ['現況租況', '建築配置', '結構安全', '室內規格']
        .map((t) => mods.find((m) => m.title === t)?.text.split('；')[0])
        .find((s) => s && s.length <= 40) || null;
    const hasR2 = !!(manifest as Record<string, number>)[it.id];
    return {
      id: it.id,
      title,
      price: it.price,
      originalPrice: it.originalPrice,
      priceText: it.price ? `${pn} ${pu}` : '價格洽詢',
      unitPrice: d.unitPrice && /\d/.test(d.unitPrice) ? d.unitPrice : null, // 官網寫「請洽業務」就不放
      address: `${districtOf(it)}${roadOf(it)}`,
      type: it.type,
      rooms: it.rooms,
      ping: it.buildingPing || it.landPing,
      age: it.age,
      floor: d.floorText ? d.floorText.replace('／', '/').replace('樓', 'F') : null,
      tags: tagsFor({ type: it.type, landPing: it.landPing, text: `${title} ${(d.features || []).join(' ')}` }),
      note: sentence,
      caseNo: caseNoShort(it.caseNo || d.caseNo),
      // LINE 卡片要 JPEG／PNG：有圖庫就用圖庫封面 jpg，沒有就用官網圖（官網圖是 JPEG）
      cover: hasR2 ? `${PHOTO_BASE}/yc${it.id}/cover.jpg` : photosOf(it)[0] || '',
    };
  });
  return new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
