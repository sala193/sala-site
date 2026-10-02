// LINE 配案輪播卡（Flex Message）：莎拉從後台傳給客戶用。
// 第一張＝莎拉名片，後面每間案子一張（版型＝「LINE配案輪播卡_手機預覽模擬器.html」）。
// 客人看得到的只有：稱呼、案子公開資料、莎拉的聯絡方式。
// 絕不放：內部備忘、電話後四碼、全名、底價、貸款估值。

export interface CardCase {
  id: string;
  title: string;
  price: number | null;
  originalPrice?: number | null;
  priceText: string; // 例：4,900 萬
  unitPrice?: string | null; // 官網寫的單價，例：34.76萬/坪（官網寫「請洽業務」就沒有）
  address: string;
  type?: string | null;
  rooms?: string | null;
  ping?: number | null;
  age?: number | null;
  floor?: string | null;
  tags: string[];
  note?: string | null; // 一句官網原句（可空）
  caseNo?: string | null;
  cover: string; // 必須是 JPEG／PNG（LINE 不吃 WebP）
}

export interface CardAgent {
  name: string;
  store: string;
  company: string;
  phone: string;
  tel: string;
  broker: string;
  agent: string;
  headshot: string; // https 絕對網址
  lineUrl: string; // 莎拉的 LINE 連結（LINE 通話／加好友）
}

export interface BuildOpts {
  origin: string; // https://www.salahome.tw
  greeting: string; // 例：王先生 您好！
  code: string; // 追蹤代碼（不含人名）
  agent: CardAgent;
  cases: CardCase[];
}

const RED = '#e11d48';
const SIZE = 'mega';

function text(t: string, extra: Record<string, unknown> = {}) {
  return { type: 'text', text: t, ...extra };
}

function button(label: string, action: Record<string, unknown>, style: 'primary' | 'secondary' | 'link', color?: string) {
  return { type: 'button', style, height: 'sm', ...(color ? { color } : {}), action: { label, ...action } };
}

const uri = (u: string) => ({ type: 'uri', uri: u });
const say = (t: string) => ({ type: 'message', text: t.slice(0, 300) });

export function caseUrl(origin: string, id: string, code: string): string {
  return `${origin}/p/${id}?s=${encodeURIComponent(code)}`;
}

/** 規格小標籤（灰底圓角） */
function chip(t: string) {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 0,
    backgroundColor: '#f1f5f9',
    cornerRadius: '4px',
    paddingTop: '3px',
    paddingBottom: '3px',
    paddingStart: '6px',
    paddingEnd: '6px',
    contents: [text(t, { size: 'xxs', color: '#334155', weight: 'bold' })],
  };
}

/** 照片左上角的標籤膠囊 */
function badge(t: string, bg: string, color: string) {
  return {
    type: 'box',
    layout: 'vertical',
    backgroundColor: bg,
    cornerRadius: '4px',
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingStart: '6px',
    paddingEnd: '6px',
    contents: [text(t, { size: 'xxs', color, weight: 'bold' })],
  };
}

function caseBubble(c: CardCase, o: BuildOpts) {
  const url = caseUrl(o.origin, c.id, o.code);
  const label = `${c.title}${c.caseNo ? `（案號 #${c.caseNo}）` : ''}`;

  // 規格標籤：最多 3 個，字要短才排得下
  const specs = [
    c.ping ? `建坪 ${c.ping} 坪` : '',
    c.rooms || c.type || '',
    c.age != null ? `${c.age} 年` : c.floor || '',
  ].filter(Boolean);

  // 照片上的疊加：左上標籤、右下案號
  const overlays: unknown[] = [];
  const tagBadges = c.tags.slice(0, 2).map((t, i) => badge(t, i === 0 ? '#0f172acc' : '#047857d9', i === 0 ? '#fcd34d' : '#ffffff'));
  if (tagBadges.length) {
    overlays.push({ type: 'box', layout: 'vertical', position: 'absolute', offsetTop: '8px', offsetStart: '8px', spacing: 'xs', contents: tagBadges });
  }
  if (c.caseNo) {
    overlays.push({
      type: 'box',
      layout: 'vertical',
      position: 'absolute',
      offsetBottom: '8px',
      offsetEnd: '8px',
      backgroundColor: '#00000099',
      cornerRadius: '10px',
      paddingTop: '2px',
      paddingBottom: '2px',
      paddingStart: '7px',
      paddingEnd: '7px',
      contents: [text(`案號 #${c.caseNo}`, { size: 'xxs', color: '#ffffff' })],
    });
  }

  const info: unknown[] = [
    {
      type: 'box',
      layout: 'baseline',
      contents: [
        text(c.priceText.replace(/\s*萬$/, ''), { weight: 'bold', size: 'xxl', color: RED, flex: 0 }),
        text(' 萬', { weight: 'bold', size: 'sm', color: RED, flex: 0 }),
        ...(c.originalPrice && c.price && c.originalPrice > c.price
          ? [text(`  原 ${c.originalPrice.toLocaleString('en-US')}`, { size: 'xxs', color: '#94a3b8', decoration: 'line-through', flex: 0 })]
          : []),
        ...(c.unitPrice ? [text(c.unitPrice, { size: 'xs', color: '#94a3b8', align: 'end' })] : []),
      ],
    },
    text(c.title, { weight: 'bold', size: 'sm', color: '#0f172a', wrap: true, maxLines: 2, margin: 'sm' }),
  ];
  if (c.address) info.push(text(c.address, { size: 'xxs', color: '#64748b', margin: 'xs' }));
  if (specs.length) {
    info.push({ type: 'box', layout: 'horizontal', spacing: 'xs', margin: 'md', contents: specs.slice(0, 3).map(chip) });
  }
  if (c.note) {
    info.push({
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      backgroundColor: '#fff7ed',
      cornerRadius: '8px',
      paddingAll: '8px',
      contents: [text(`莎拉筆記：${c.note}`, { size: 'xs', color: '#475569', wrap: true, maxLines: 3 })],
    });
  }

  return {
    type: 'bubble',
    size: SIZE,
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '0px',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          paddingAll: '0px',
          contents: [
            { type: 'image', url: c.cover, size: 'full', aspectRatio: '16:10', aspectMode: 'cover', action: uri(url) },
            ...overlays,
          ],
        },
        { type: 'box', layout: 'vertical', paddingAll: '14px', contents: info },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingTop: '0px',
      paddingBottom: '12px',
      paddingStart: '12px',
      paddingEnd: '12px',
      contents: [
        button('更多照片(VR+影片)', uri(url), 'primary', '#f97316'),
        {
          // 四格：左 1＝✕ 不喜歡｜中 2＝預約看屋｜右 1＝♥ 收藏（客人按了會在聊天室說一句話，莎拉看得到）
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            { ...button('✕', say(`這間不喜歡：${label}`), 'secondary'), flex: 1 },
            { ...button('預約看屋', say(`預約看屋：${label}`), 'primary', '#06C755'), flex: 2 },
            { ...button('♥', say(`收藏這間：${label}`), 'secondary'), flex: 1 },
          ],
        },
      ],
    },
  };
}

function agentBubble(o: BuildOpts) {
  const a = o.agent;
  return {
    type: 'bubble',
    size: SIZE,
    hero: { type: 'image', url: a.headshot, size: 'full', aspectRatio: '1:1', aspectMode: 'cover' },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '14px',
      spacing: 'xs',
      contents: [
        text(a.name, { weight: 'bold', size: 'xl', color: '#0f172a' }),
        text(a.store, { size: 'sm', color: '#475569', wrap: true }),
        text(a.phone, { weight: 'bold', size: 'xl', color: RED, margin: 'sm' }),
        text(`${a.company}｜${a.broker}｜${a.agent}`, { size: 'xxs', color: '#94a3b8', wrap: true, margin: 'md' }),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '12px',
      contents: [
        button('LINE 通話', uri(a.lineUrl), 'primary', '#06C755'),
        button('預約看屋', say('莎拉您好！我想預約看屋，請問什麼時候方便？'), 'primary', '#f97316'),
        button('更多物件', uri(`${o.origin}/cases?s=${encodeURIComponent(o.code)}`), 'secondary'),
      ],
    },
  };
}

/** 組出要傳給客戶的訊息：1 則問候文字＋1 則輪播卡 */
export function buildShareMessages(o: BuildOpts) {
  const n = o.cases.length;
  return [
    { type: 'text', text: `${o.greeting}\n這是我為您挑的 ${n} 間房子，左右滑動看看，有問題隨時問我。` },
    {
      type: 'flex',
      altText: `${o.greeting.replace(/\s*您好！?$/, '')}，莎拉為您挑了 ${n} 間房子`,
      contents: { type: 'carousel', contents: [agentBubble(o), ...o.cases.map((c) => caseBubble(c, o))] },
    },
  ];
}
