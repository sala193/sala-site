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

// 標籤詞庫（取自《莎拉文案標籤字典》裡意思明確、能用官網文字直接對上的詞）
const TAGS_RESIDENTIAL = [
  '一層兩戶', '一層一戶', '邊間', '三面採光', '無暗房', '房間皆有窗', '前陽台', '後陽台', '有露台', '挑高',
  '雙衛浴', '景觀佳', '有裝潢', '代收垃圾', '孝親房', '天然瓦斯', '免爬樓梯', '重劃區', '近學區', '近台鐵',
  '近高鐵', '近捷運', '近交流道', '近公園', '近公車站', '近商圈', '正面大馬路', '三角窗', '無尾巷', '空屋',
];
const TAGS_COMMERCIAL = ['大面寬', '三角窗', '正面大馬路', '挑高', '近交流道', '位於知名商圈', '出租中連鎖店', '出租中非連鎖店', '有逃生門'];

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

export function tagsFor({ type, landPing, text }: TagInput, max = 8): string[] {
  const kind = kindOfType(type);
  const flat = text.replace(/\s+/g, '');
  const tags: string[] = [];
  const add = (t: string) => { if (!tags.includes(t)) tags.push(t); };

  // 專業名詞防呆
  if (kind === '透天' && /電梯/.test(flat)) add('室內有電梯');
  if ((kind === '透天' || kind === '土地' || kind === '廠房') && (landPing || 0) > 30) add('大地坪');

  // 租況：只用官網的說法，不升級成「滿租」
  if (/租客穩定/.test(flat)) add('租客穩定');
  if (/收租/.test(flat)) add('宜收租');

  const pool = kind === '店面辦公' || kind === '廠房' ? TAGS_COMMERCIAL : TAGS_RESIDENTIAL;
  for (const t of pool) if (flat.includes(t)) add(t);
  return tags.slice(0, max);
}


// ───────────────────────── 專業整理（2026-10-02 莎拉：不是照抄換行，是歸納） ─────────────────────────
// 規則：只整理、不加料。所有文字都來自官網原句（清掉符號、浮誇詞、反問句），或官網的數字欄位。

/** 房仲罐頭詞／浮誇詞（標題裡直接拿掉；含這些詞的整句不放進筆記） */
export const HYPE_WORDS = [
  '極稀有', '稀有釋出', '稀有', '頂奢', '奢華', '秒殺', '金雞母', '屋主含淚', '含淚', '佛心', '跪求', '割愛',
  '捶心肝', '錯過', '驚爆', '絕版', '滿租',
];

const SYMBOLS = /[_＿★☆◆◇⭕●○■□▲△◎※✔✅✓•▶►💡🔥✨❤♥～~＊*]/gu;
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
    if (arr.length) out.push({ title, text: arr.join('；') });
  }
  return out;
}
