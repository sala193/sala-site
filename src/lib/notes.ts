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
