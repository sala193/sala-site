/** 只掃店鋪頁用到的檔案，避免跟舊版官網的 class（container、btn…）撞名 */
export default {
  content: [
    './src/pages/p/**/*.astro',
    './src/pages/cases.astro',
    './src/components/store/**/*.astro',
    './src/layouts/StoreLayout.astro',
  ],
  corePlugins: { container: false },
  theme: {
    extend: {
      colors: {
        line: '#06C755',
        lineHover: '#05B34C',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
};
