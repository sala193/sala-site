/**
 * parse-detail.mjs
 * ------------------------------------------------------------
 * 解析永慶官網「單一物件詳情頁」(buy.yungching.com.tw/house/<id>)的公開內容,
 * 給 /p/<id> 單案銷售頁使用。只讀頁面上看得到的文字,不碰任何後台資料。
 *
 * 官網詳情頁的結構化資料(ng-state)是加密的,所以這裡走「把標籤去掉、
 * 照欄位名稱找下一行」的做法;找不到的欄位就留空,不猜。
 * ------------------------------------------------------------
 */

function toLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

// 「基本資訊」區塊裡，標籤 → 下一行就是值
const FIELD_LABELS = {
  建物格局: 'layout',
  社區: 'community',
  建物坪數: 'buildingPing',
  土地坪數: 'landPing',
  登記用途: 'usage',
  單價: 'unitPrice',
  '・主建物': 'mainPing',
  '・共同使用小計': 'sharedPing',
  '・附屬建物小計': 'annexPing',
  '・車位': 'parking',
};

export function parseDetail(html) {
  const L = toLines(html);
  const out = {};

  // 特色說明：從「特色說明」的下一行起到「基本資訊」之前；第一行是案名重複，略過
  const iFeat = L.indexOf('特色說明');
  const iBasic = L.findIndex((l, i) => i > iFeat && l === '基本資訊');
  if (iFeat !== -1 && iBasic !== -1) {
    out.title = L[iFeat + 1]; // 完整案名（列表頁的案名常被官網截斷成「…」）
    const body = L.slice(iFeat + 2, iBasic).filter((l) => l !== '　');
    if (body.length) out.features = body;
  }

  // 基本資訊區塊
  if (iBasic !== -1) {
    const end = L.findIndex((l, i) => i > iBasic && /^看詳細基本資訊|^各項面積合計/.test(l));
    const blk = L.slice(iBasic, end === -1 ? iBasic + 60 : end);
    for (let i = 0; i < blk.length - 1; i++) {
      const key = FIELD_LABELS[blk[i]];
      if (key && !(key in out)) out[key] = blk[i + 1];
    }
    // 附屬建物括號裡的明細，例如「(陽台2.87坪)」
    const annexIdx = blk.indexOf('・附屬建物小計');
    if (annexIdx !== -1 && /^\(.+\)$/.test(blk[annexIdx + 2] || '')) out.annexNote = blk[annexIdx + 2];
  }

  // 標頭區：樓層「2/15樓」、地址、社區名
  const head = L.slice(0, Math.max(iFeat, 0) || 200).join('\n');
  const floor = head.match(/(地下\d+|B\d+|\d+(?:~\d+)?)\/(\d+)樓/);
  if (floor) out.floorText = `${floor[1]}／${floor[2]}樓`;

  const caseNo = html.match(/YC\d{6,9}/);
  if (caseNo) out.caseNo = caseNo[0];

  // 720° VR（官網有放才有）：常見的實景看屋服務網址
  const vr = html.match(/https?:\/\/[^"'\s<>]*(?:livetour\.istaging|istaging\.com|720yun|vr\.|\/vr\/)[^"'\s<>]*/i);
  if (vr) out.vrUrl = vr[0].replace(/&amp;/g, '&');

  // 學區（官網有顯示才有）
  const sch = L.findIndex((l) => l === '小學學區' || l === '學區');
  if (sch !== -1 && L[sch + 1] && L[sch + 1].length < 30) out.school = L[sch + 1];

  return out;
}
