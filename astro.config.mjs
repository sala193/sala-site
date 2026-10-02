import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // 官網主網域為 www（不帶 www 會 308 轉址到這裡）
  site: 'https://www.salahome.tw',
  // Tailwind 只給店鋪頁（/cases、/p/<id>）用：不自動套到整個網站，由店鋪頁自己引入 src/styles/store.css
  integrations: [sitemap({ filter: (page) => !page.includes('/share') }), tailwind({ applyBaseStyles: false })],
});
