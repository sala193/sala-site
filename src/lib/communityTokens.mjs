// 社區文章的「自動更新數字」：文章裡寫 {{屋齡}}、{{成交筆數}}、{{在售件數}}…，建置官網時換成最新的數字。
// 資料來源（都會每天自動更新，官網每天早上 6 點跟著重新上線）：
//  ‧ community-stats.json：後台目前銷售中的件數（sync-appeal.mjs 抓）
//  ‧ lvr-counts.json：內政部實價登錄近 12 個月成交筆數（sync-lvr-counts.py 算）
//  ‧ community-config.json：戶數、屋齡基準（某天的屋齡，之後照時間往後推）、門牌範圍
// 沒有資料的社區或數字：原樣保留代號會很難看，所以直接讓建置失敗，逼我們補資料，不會把錯的數字放上官網。
import { readFileSync } from 'node:fs';

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf-8'));

function valuesFor(name) {
  const cfg = load('community-config.json')[name];
  if (!cfg) throw new Error(`community-config.json 沒有社區「${name}」`);
  const lvr = load('lvr-counts.json').communities?.[name];
  const stats = load('community-stats.json')[cfg.statsName || name];
  const now = new Date();
  const ageYears = cfg.ageBase + (now - new Date(cfg.ageBaseDate)) / (365.25 * 24 * 3600 * 1000);
  const age = Math.round(ageYears);
  const out = { 屋齡: age < 1 ? '不到 1 年' : `約 ${age} 年` };
  if (lvr) {
    const n = lvr.sales12m;
    out['成交筆數'] = String(n);
    // 筆數少於 5 筆才說「釋出量低」（莎拉的說法）；5 筆以上不下結論
    out['釋出量標題'] = n < 5 ? '釋出量低' : '成交與在售';
    out['，釋出量較低'] = n < 5 ? '，釋出量較低' : '';
  }
  if (stats) {
    out['在售件數'] = String(stats.onsale);
    out['在售占比'] = `${((stats.onsale / cfg.households) * 100).toFixed(1).replace(/\.0$/, '')}%`;
  }
  const tw = new Date(now.getTime() + 8 * 3600 * 1000); // 台灣時間
  out['今年月'] = `${tw.getUTCFullYear()} 年 ${tw.getUTCMonth() + 1} 月`;
  return out;
}

export default function rehypeCommunityTokens() {
  return (tree, file) => {
    const name = file?.data?.astro?.frontmatter?.community_name;
    if (!name) return;
    let vals;
    const walk = (node) => {
      if ((node.type === 'text' || node.type === 'raw') && node.value.includes('{{')) {
        node.value = node.value.replace(/\{\{([^}]+)\}\}/g, (all, key) => {
          vals ||= valuesFor(name);
          if (!(key in vals)) throw new Error(`社區「${name}」的代號 ${all} 沒有資料`);
          return vals[key];
        });
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
