import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { readFileSync } from 'node:fs';

// 銷售頁存檔不進 sitemap（只給莎拉手動分享）
const archivedIds = [
  ...Object.keys(JSON.parse(readFileSync(new URL('./src/data/archive.json', import.meta.url), 'utf-8'))),
  ...Object.entries(JSON.parse(readFileSync(new URL('./src/data/archive-status.json', import.meta.url), 'utf-8'))).filter(([, s]) => s === '已成交').map(([id]) => id),
];

export default defineConfig({
  // 官網主網域為 www（不帶 www 會 308 轉址到這裡）
  site: 'https://www.salahome.tw',
  // Tailwind 只給店鋪頁（/cases、/p/<id>）用：不自動套到整個網站，由店鋪頁自己引入 src/styles/store.css
  integrations: [sitemap({ filter: (page) => !page.includes('/share') && !archivedIds.some((id) => page.includes(`/p/${id}`)) }), tailwind({ applyBaseStyles: false })],
});
