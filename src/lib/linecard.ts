// LINE 配案輪播卡（Flex Message）：莎拉從後台傳給客戶用。
// 第一張＝莎拉名片，後面每間案子一張。客人看得到的只有：稱呼、案子公開資料、莎拉的聯絡方式。
// 絕不放：內部備忘、電話後四碼、全名、底價、貸款估值。

export interface CardCase {
  id: string;
  title: string;
  price: number | null;
  originalPrice?: number | null;
  priceText: string; // 例：4,900 萬
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
  lineUrl: string; // 加好友連結
}

export interface BuildOpts {
  origin: string; // https://www.salahome.tw
  greeting: string; // 例：王先生 您好！
  code: string; // 追蹤代碼（不含人名）
  agent: CardAgent;
  cases: CardCase[];
}

const RED = '#e11d48';

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

function caseBubble(c: CardCase, o: BuildOpts) {
  const url = caseUrl(o.origin, c.id, o.code);
  const label = `${c.title}${c.caseNo ? `（案號 #${c.caseNo}）` : ''}`;
  const specs = [c.ping ? `建坪 ${c.ping}` : '', c.rooms || '', c.floor || '', c.age != null ? `${c.age}年` : '']
    .filter(Boolean)
    .join('｜');
  const body: unknown[] = [
    {
      type: 'box',
      layout: 'baseline',
      contents: [
        text(c.priceText, { weight: 'bold', size: 'xl', color: RED, flex: 0 }),
        ...(c.originalPrice && c.price && c.originalPrice > c.price
          ? [text(`  原 ${c.originalPrice.toLocaleString('en-US')}`, { size: 'xs', color: '#94a3b8', decoration: 'line-through', flex: 0 })]
          : []),
      ],
    },
    text(c.title, { weight: 'bold', size: 'md', color: '#0f172a', wrap: true, maxLines: 2, margin: 'xs' }),
  ];
  if (c.address) body.push(text(c.address, { size: 'xs', color: '#64748b', margin: 'xs' }));
  if (specs) body.push(text(specs, { size: 'xs', color: '#475569', wrap: true, margin: 'sm' }));
  if (c.tags.length) body.push(text(c.tags.slice(0, 4).join('・'), { size: 'xs', color: '#c2410c', wrap: true, margin: 'sm' }));
  if (c.note) {
    body.push({
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      backgroundColor: '#fff7ed',
      cornerRadius: '6px',
      paddingAll: '8px',
      contents: [text(c.note, { size: 'xs', color: '#4b5563', wrap: true, maxLines: 3 })],
    });
  }
  return {
    type: 'bubble',
    size: 'kilo',
    hero: { type: 'image', url: c.cover, size: 'full', aspectRatio: '4:3', aspectMode: 'cover', action: uri(url) },
    body: { type: 'box', layout: 'vertical', paddingAll: '14px', contents: body },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '12px',
      contents: [
        button('查看完整物件', uri(url), 'primary', '#ea580c'),
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            button('預約看屋', say(`預約看屋：${label}`), 'primary', '#06C755'),
            button('打電話給莎拉', uri(`tel:${o.agent.tel}`), 'secondary'),
          ],
        },
        button('不喜歡', say(`這間不喜歡：${label}`), 'link'),
      ],
    },
  };
}

function agentBubble(o: BuildOpts) {
  const a = o.agent;
  return {
    type: 'bubble',
    size: 'kilo',
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
        button('撥打電話', uri(`tel:${a.tel}`), 'primary', '#0f172a'),
        button('加 LINE 聊聊', uri(a.lineUrl), 'primary', '#06C755'),
        button('看更多房子', uri(`${o.origin}/cases?s=${encodeURIComponent(o.code)}`), 'secondary'),
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
