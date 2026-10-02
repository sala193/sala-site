// 「莎拉筆記・必看重點」與標籤：只整理官網原文，不編造（依《莎拉品牌核心文案十誡》）。
//  - 重點：官網「特色說明」依換行與 ★◆⭕● 切句，一句一條，文字照原文，不改寫、不加料。
//  - 標籤：只貼「官網文字或官網數字裡真的有」的詞，詞庫來自《莎拉文案標籤字典》。
//  - 專業名詞防呆：「室內有電梯」限透天／別墅；「大地坪」限透天／別墅／土地／廠房且土地大於 30 坪。

const BULLETS = /(?=[★☆◆◇⭕●○■□▲△])/;

/** 官網特色說明 → 重點清單（最多 8 條） */
export function extractNotes(lines: string[], max = 8): string[] {
  const out: string[] = [];
  for (const line of lines) {
    for (const part of line.split(BULLETS)) {
      const t = part
        .replace(/^[\s★☆◆◇⭕●○■□▲△✔✅✓•・\-–—]+/, '')
        .replace(/^\d+[.、)）]\s*/, '')
        .trim();
      if (t.length >= 4 && !out.includes(t)) out.push(t);
    }
  }
  return out.slice(0, max);
}

// 標籤詞庫＝莎拉《訴求重點.xlsx》全部欄位（住宅／辦公／店面）。官網文字（案名＋特色）裡真的有這個詞才標；
// 詞前面緊接「無／非／沒」就不標（避免「無頂加」被標成頂加）。
const TERMS_LOCATION = ['近台鐵', '近高鐵', '近捷運', '近公園', '近公車站', '近學區', '近交流道', '近66號快速道路', '近商圈', '重劃區', '位於知名商圈', '臨火車站'];
const TERMS_LAYOUT = [
  '一層兩戶', '一層一戶', '邊間', '三面採光', '雙面採光', '採光佳', '無尾巷', '前後陽台', '前陽台進出', '前陽台', '後陽台', '廁所有窗', '無暗房',
  '房間皆有窗', '房間都有窗', '有露台', '樓中樓', '雙衛浴', '雙主臥', '孝親房', '格局方正', '挑高無加蓋夾層', '挑高', '永久棟距', '大面寬', '獨棟',
  '私人泳池', '有庭院', '一巷住宅', '正面大馬路', '室內無樑柱設計', '室內輕隔間', '三角窗', '頂樓', '次頂樓', '高樓層', '純一樓',
];
const TERMS_LIFE = [
  '冷藏廚餘垃圾室', '垃圾集中處理', '24H警衛管理', '24H保全', '飯店式接待大廳', '健身房', '媽媽教室', '代收垃圾', '天然瓦斯', '免爬樓梯', '景觀宅', '景觀佳', '視野景觀佳', '有裝潢', '裝潢美宅', '室內有消防撒水系統', '有逃生門', '可張掛公司招牌',
  '氣派門廳', '本戶高架地板', '室內水線', '出租中非連鎖店', '出租中連鎖店', '購物商場型店面', '知名夜市內店面', '有車庫', '一樓門前停車方便', '空屋',
];
/** 同義詞：官網寫法不同、意思一樣，標成同一個標籤 */
const ALIAS: Record<string, string> = { 房間都有窗: '房間皆有窗', 前陽台進出: '前陽台', 室內有消房撤水系統: '室內有消防撒水系統' };

function hasTerm(flat: string, term: string): boolean {
  let from = 0;
  for (;;) {
    const i = flat.indexOf(term, from);
    if (i < 0) return false;
    const before = flat.slice(Math.max(0, i - 1), i);
    if (!/[無非沒不]/.test(before)) return true; // 前面不是「無／非／沒／不」才算
    from = i + term.length;
  }
}

export interface TagInput {
  type?: string | null;
  landPing?: number | null;
  /** 官網的特色文字與案名，用來比對標籤詞 */
  text: string;
}

export function kindOfType(type?: string | null): '住宅' | '透天' | '店面辦公' | '廠房' | '土地' {
  const t = type || '';
  if (t.includes('土地')) return '土地';
  if (t.includes('廠房')) return '廠房';
  if (t.includes('店面') || t.includes('辦公')) return '店面辦公';
  if (t.includes('透天') || t.includes('別墅')) return '透天';
  return '住宅';
}

export function tagsFor({ type, landPing, text }: TagInput, max = 12): string[] {
  let kind = kindOfType(type);
  const isShop = /店面/.test(text) && kind === '住宅';
  if (isShop) kind = '店面辦公';
  const flat = text.replace(/\s+/g, '').replace(/２４|24小時/g, '24H');
  const tags: string[] = [];
  const add = (t: string) => { const x = ALIAS[t] || t; if (!tags.includes(x)) tags.push(x); };

  // 專業名詞防呆
  if (kind === '透天' && /電梯/.test(flat)) add('室內有電梯');
  if ((kind === '透天' || kind === '土地' || kind === '廠房') && (landPing || 0) > 30) add('大地坪');
  if (isShop) add('店面');

  // 租況：只用官網的說法，不升級成「滿租」
  if (/租客穩定/.test(flat)) add('租客穩定');
  if (/收租/.test(flat)) add('宜收租');

  // 訴求重點表：地段機能 → 格局採光 → 社區生活
  for (const t of [...TERMS_LOCATION, ...TERMS_LAYOUT, ...TERMS_LIFE]) {
    if (kind === '住宅' && t === '大面寬') continue; // 大樓公設面寬不算大面寬
    if (hasTerm(flat, t)) add(t);
  }
  return tags.slice(0, max);
}


// ───────────────────────── 專業整理（2026-10-02 莎拉：不是照抄換行，是歸納） ─────────────────────────
// 規則：只整理、不加料。所有文字都來自官網原句（清掉符號、浮誇詞、反問句），或官網的數字欄位。

/** 房仲罐頭詞／浮誇詞（標題裡直接拿掉；含這些詞的整句不放進筆記） */
export const HYPE_WORDS = [
  '極稀有', '稀有釋出', '稀有', '頂奢', '奢華', '秒殺', '金雞母', '屋主含淚', '含淚', '佛心', '跪求', '割愛',
  '捶心肝', '錯過', '驚爆', '絕版', '滿租',
];

const SYMBOLS = /[_＿★☆◆◇⭕●○■□▲△◎※✔✅✓•▶►💡🔥✨❤♥～~＊*①-⑳❶-❿]/gu;
const EMOJI = /\p{Extended_Pictographic}/gu;

/** 文字清潔工：拿掉底線、星號、emoji 與零散符號，驚嘆號與多餘空白一併整理 */
export function cleanText(s: string): string {
  return s
    .replace(EMOJI, '')
    .replace(/(?<=[一-鿿])[_＿](?=[一-鿿])/g, '、') // 「租客穩定_素質高」→「租客穩定、素質高」
    .replace(SYMBOLS, ' ')
    .replace(/(?<=[一-鿿]) (?=[一-鿿])/g, '') // 中文字之間多餘的空白不要
    .replace(/[!！]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([，、；：,;:])\s*/g, '$1')
    .trim();
}

/** 大標題清洗：拿掉浮誇詞與零散符號，保留物件事實（型態、套房數、店面等） */
export function cleanTitle(raw: string): string {
  let t = raw;
  for (const w of HYPE_WORDS) t = t.split(w).join(' ');
  t = t
    .replace(EMOJI, ' ')
    .replace(/[◎★☆●■◆⭕▲△※▶►]/gu, '｜')
    .replace(/[_＿!！？?～~]/g, ' ')
    .replace(/\s*[｜|]\s*/g, '｜')
    .replace(/(｜){2,}/g, '｜')
    .replace(/^[｜\s,，、:：-]+|[｜\s,，、:：-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return t || raw;
}

/** 含這些詞的整句不放（誇大或可能誤導）；其餘浮誇詞只把詞拿掉、保留句子裡的事實 */
const DROP_WORDS = ['滿租', '秒殺', '金雞母', '屋主含淚', '含淚', '佛心', '跪求', '割愛', '捶心肝', '錯過', '驚爆', '絕版'];
const STRIP_WORDS = ['極稀有', '稀有釋出', '稀有', '頂奢', '奢華'];
function stripHype(s: string): string {
  let t = s;
  for (const w of STRIP_WORDS) t = t.split(w).join('');
  return t.replace(/^[，、；：\s]+|[，、；：\s]+$/g, '').replace(/\s{2,}/g, ' ');
}

export interface Module { title: string; text: string }

// 客戶在意的順序：租況 → 建築配置 → 室內規格 → 結構安全 → 區位機能
const MODULES: { title: string; test: RegExp }[] = [
  { title: '現況租況', test: /租客|收租|出租|租金|租約|承租|租賃/ },
  { title: '室內規格', test: /浴室|衛浴|洗衣機|料理台|流理|冰箱|廚房|裝潢|配備|家電|冷氣|空調|乾濕分離|隔間|採光|通風|窗/ },
  { title: '結構安全', test: /完工|屋齡|改裝|耐震|鋼骨|RC|SRC|管委|警衛|保全|消防|結構|施工|一層.{0,3}戶|戶戶|電梯|梯/ },
  { title: '區位機能', test: /近|鄰近|距離|步行|車行|車程|學區|工業區|商圈|交通|捷運|車站|火車|公園|市場|全聯|機能|剛需|交流道|生活圈|國小|國中/ },
  { title: '建築配置', test: /獨棟|土地|地坪|坪|棟距|庭院|車位|格局|方正|邊間|大面寬|臨路|面寬/ },
];

/** 官網特色說明 → 5 大重點（每項：粗體小標題＋完整說明）。全部來自官網原句，不編造。 */
export function buildModules(lines: string[], opts: { landPing?: number | null; type?: string | null } = {}): Module[] {
  // 1) 切句：換行、項目符號、句號；問句（反問行銷句）整句不要；含罐頭詞的整句不要
  const sentences: string[] = [];
  for (const line of lines) {
    for (const piece of line.split(/(?=[★☆◆◇⭕●○■□▲△◎])|[。\n]/)) {
      if (/[?？]\s*$/.test(piece.trim()) || /[?？]/.test(piece)) continue;
      const t = stripHype(cleanText(piece.replace(/【\s*Google資訊\s*】/g, ''))).replace(/^\d+[.、)）]\s*/, '').trim();
      if (t.length < 4) continue;
      if (DROP_WORDS.some((w) => t.includes(w))) continue; // 誇大宣稱整句不放

      if (!sentences.includes(t)) sentences.push(t);
    }
  }
  // 2) 歸類：依上面順序，第一個符合的模組
  const buckets = new Map<string, string[]>(MODULES.map((m) => [m.title, []]));
  const rest: string[] = [];
  for (const t of sentences) {
    const m = MODULES.find((x) => x.test.test(t));
    if (m) buckets.get(m.title)!.push(t); else rest.push(t);
  }
  // 3) 官網數字欄位補充：土地坪數（真實資料）
  if (opts.landPing && !/土地|地坪/.test((buckets.get('建築配置') || []).join(''))) {
    buckets.get('建築配置')!.push(`土地 ${opts.landPing} 坪`);
  }
  // 4) 組成卡片：每項最多 4 句，句與句用「；」連成完整說明
  const out: Module[] = [];
  // 顯示順序＝客戶在意的順序：租況 → 建築配置 → 室內規格 → 結構安全 → 區位機能（沒歸到類的行銷句不放）
  for (const title of ['現況租況', '建築配置', '室內規格', '結構安全', '區位機能']) {
    const arr = (buckets.get(title) || []).slice(0, 4);
    if (arr.length) out.push({ title, text: arr.map((x) => x.replace(/[。]+$/, '')).join('。') + '。' });
  }
  return out;
}


// ───────────────────────── 💡 莎拉短評（卡片與銷售頁頂部的一句話，30～50 字） ─────────────────────────
// 規則：只從官網原句挑「最有事實的 3～4 個短句」，不加料、不下判斷（不寫罕見、不寫保證）。
// 總價只在官網案名本身寫「低總價」時才放（那是官網自己的說法，數字是真的）。

/** 依客戶在意程度排序的挑句規則：每類最多挑一句 */
const SUMMARY_RULES: { key: string; test: RegExp }[] = [
  { key: '租況', test: /租客穩定/ },
  { key: '面寬', test: /面寬/ },
  { key: '臨路', test: /臨\d+米/ },
  { key: '土地', test: /獨立土地|土地\d|地坪[:：]/ },
  { key: '工業區', test: /工業區/ },
  { key: '捷運', test: /捷運|火車站|高鐵/ },
  { key: '保全', test: /保全|警衛/ },
  { key: '改裝', test: /非.{0,3}改裝/ },
  { key: '戶數', test: /一層.{0,3}[戶兩二]/ },
];

/** 把官網特色清成一個個短句（逗號、頓號、分號切開），丟掉問句、罐頭詞句、行銷空話 */
function clauses(features: string[]): string[] {
  const out: string[] = [];
  for (const f of features) {
    for (const piece of f.split(/(?=[★☆◆◇⭕●○■□▲△◎])|[。\n]/)) {
      if (/[?？]/.test(piece)) continue;
      const base = stripHype(cleanText(piece)).replace(/^\d+[.、)）]\s*/, '').trim();
      if (!base || DROP_WORDS.some((w) => base.includes(w))) continue;
      for (const c of base.split(/[，；;,]/)) {
        const t = c.replace(/^[：:\s]+|[：:\s]+$/g, '').trim();
        if (t.length >= 4 && t.length <= 24 && !out.includes(t)) out.push(t);
      }
    }
  }
  return out;
}

// 住宅通用詞庫（取自《莎拉文案標籤字典》）：官網文字（案名＋特色）裡「真的有這個詞」才用
const LOC_TERMS = ['近捷運', '近台鐵', '近高鐵', '近學區', '近商圈', '近公園', '近交流道', '近公車站', '重劃區', '臨火車站'];
const LAYOUT_TERMS = ['邊間', '三面採光', '雙面採光', '房間皆有窗', '房間都有窗', '廁所有窗', '前後陽台', '無暗房', '雙衛浴', '格局方正', '一層兩戶', '一層一戶', '挑高', '有露台', '前陽台', '後陽台'];
const LIFE_TERMS = ['冷藏廚餘垃圾室', '垃圾集中處理', '24H警衛管理', '飯店式接待大廳', '健身房', '媽媽教室', '代收垃圾', '天然瓦斯', '24H保全', '警衛', '管理員', '景觀佳', '高樓層', '有裝潢', '免爬樓梯', '有車位', '平面車位'];

/** 「近X、近Y」併成「近X、Y」讀起來順一點 */
function joinNear(list: string[]): string {
  const near = list.filter((t) => t.startsWith('近')).map((t) => t.slice(1));
  const other = list.filter((t) => !t.startsWith('近'));
  const parts = [...(near.length ? ['近' + near.join('、')] : []), ...other];
  return parts.join('、');
}

export interface SummaryOpts {
  title?: string;
  price?: number | null;
  maxChars?: number;
  /** 官網結構化欄位（都是官網原本就有的資料） */
  floorText?: string | null; // 例：7／12樓
  layout?: string | null; // 例：3房(室)2廳2衛
  community?: string | null;
  age?: number | string | null;
  hasParking?: boolean;
  type?: string | null;
  ping?: number | null;
  usage?: string | null;
}

export function buildSummary(features: string[], opts: SummaryOpts = {}): string | null {
  const max = opts.maxChars ?? 50;
  const parts: string[] = [];
  const fits = (t: string) => (parts.join('，') + '，' + t).length <= max;
  const push = (t: string) => { if (t && fits(t)) parts.push(t); };

  // 官網案名自己寫「低總價」：放總價數字（事實），其餘不評論
  if (opts.title && /低總價/.test(opts.title) && opts.price) parts.push(`總價 ${opts.price.toLocaleString('en-US')} 萬`);

  // 第一層：官網原句挑事實（租況、面寬、臨路、土地、工業區…）最多 2 句
  const cl = clauses(features);
  const used = new Set<string>();
  let strong = 0;
  for (const rule of SUMMARY_RULES) {
    if (strong >= 4 || used.has(rule.key)) continue;
    const hit = cl.find((c) => rule.test.test(c));
    if (!hit) continue;
    const text = hit.replace(/^[\d]+[.、)）]\s*/, '').replace(/^地坪[:：]/, '').replace(/[：:]/g, '，');
    if (!fits(text)) continue;
    parts.push(text); used.add(rule.key); strong++;
  }

  // 第二層：訴求詞庫（地段機能 → 格局採光 → 社區生活），官網文字真的有才用
  const flat = `${opts.title || ''} ${features.join(' ')}`.replace(/\s+/g, '').replace(/２４|24小時/g, '24H');
  const SECURITY = /保全|警衛|管理員/;
  const pick = (terms: string[], n: number) =>
    terms
      .filter((t) => hasTerm(flat, t.replace('24H保全', '24H')))
      .filter((t) => !parts.join('').includes(t.replace('24H保全', '保全'))) // 前面已經說過就不重複
      .filter((t) => !(SECURITY.test(t) && SECURITY.test(parts.join('')))) // 保全／警衛只說一次
      .slice(0, n);
  const nearDone = parts.some((t) => /^(近|鄰近|距離|步行|臨)/.test(t) || /捷運|車站|火車/.test(t));
  const layoutHit = pick(LAYOUT_TERMS, 4).filter((t, _i, arr) => !((t === '前陽台' || t === '後陽台') && arr.includes('前後陽台')));
  const dyn = flat.match(/(?:鄰?近|旁)([一-鿿A-Za-z0-9]{1,8}?(?:火車站|捷運站|車站|學區|商圈|公園|交流道|市場))/);
  const dynLoc = dyn && !/[無非沒不]/.test(flat.slice(Math.max(0, (dyn.index || 0) - 1), dyn.index)) ? [`近${dyn[1]}`] : [];
  for (const group of [nearDone ? [] : dynLoc.length ? dynLoc : pick(LOC_TERMS, 3), layoutHit.slice(0, 3), pick(LIFE_TERMS, 3)]) {
    if (parts.length >= 4) break;
    let g = group;
    while (g.length && !fits(joinNear(g))) g = g.slice(0, -1);
    if (g.length) push(joinNear(g));
  }

  // 第三層：官網結構化欄位（社區、樓層、格局、屋齡）。詞庫不夠 2 個重點時，用事實補
  const facts: string[] = [];
  if (opts.community) facts.push(`${opts.community}社區`);
  const fl = (opts.floorText || '').match(/^(\d+)[／/](\d+)樓$/); // 只放單一樓層（跨層的店面、透天不放）
  if (fl) facts.push(`${fl[1]}樓／共${fl[2]}樓`);
  const lay = (opts.layout || '').match(/(\d+)房.*?(\d+)廳(\d+)衛/);
  if (lay) facts.push(`${lay[1]}房${lay[2]}廳${lay[3]}衛`);
  if (opts.age != null && opts.age !== '' && Number(opts.age) > 0) facts.push(`屋齡 ${opts.age} 年`);
  if (opts.type && !/住宅|華廈|公寓|大樓|套房/.test(opts.type)) {
    const land = /土地/.test(opts.type);
    facts.push(land ? `土地 ${opts.ping ?? ''} 坪`.replace('  ', ' ') : `${opts.type}${opts.ping ? `，建坪 ${opts.ping} 坪` : ''}`);
  }
  if (opts.usage && opts.type && /土地/.test(opts.type)) facts.unshift(`${opts.usage}`); // 土地才放用途（農牧用地等）
  for (const f of facts) {
    if (parts.length >= 3) break;
    if (/土地\s+坪/.test(f)) continue;
    push(f);
  }
  // 保底：還是不到 2 個重點，補官網原句（不含價格、行銷話）
  if (parts.length < 2) {
    for (const c of cl) {
      if (parts.length >= 3) break;
      if (/價|萬|每坪|保證|便宜|出清|壓軸|席|限量|最後|歡迎|來電|預約|請洽/.test(c) || parts.includes(c)) continue;
      push(c);
    }
  }
  return parts.length >= 2 ? `${parts.join('，')}。` : null;
}
