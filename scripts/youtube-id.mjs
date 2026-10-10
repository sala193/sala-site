// 從 YouTube 各種網址格式取出 11 碼影片代碼（youtu.be／watch?v=／shorts／embed／live）。
// 取不到、或不是 YouTube，回傳 null。獨立成一個檔案，方便單獨測試（sync-listings.mjs 一載入就會執行）。
export function youtubeIdFrom(raw) {
  const m = String(raw || '').match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/
  );
  return m ? m[1] : null;
}
