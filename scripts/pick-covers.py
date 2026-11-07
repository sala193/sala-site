"""
店鋪封面：避開格局圖。
官網常把格局圖放在第一張，店鋪封面就跟著變成格局圖。
這支程式看每件案件的前幾張照片，格局圖（大面積白底、幾乎沒有顏色）就跳過，
把「第一張不是格局圖的照片」的順序寫進 src/data/cover-idx.json（案號 → 第幾張，0 起算；只記不是第一張的）。
店鋪 photosOf() 會依這個檔把那張排到最前面。
用法：python3 scripts/pick-covers.py [--report]
"""
import io, json, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

PHOTO_BASE = 'https://pub-61c50068c9924c239dfb2d0e0ec9bbd2.r2.dev/cases'
SB_BASE = 'https://dlfleszjcfeickibjcee.supabase.co/storage/v1/object/public/case-photos'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'}
PLAN_WHITE = 0.45  # 近白色像素超過這個比例＝格局圖
MAX_TRY = 6  # 最多往後看幾張

def load(p):
    return json.load(open(p, encoding='utf8'))

listings = load('src/data/listings.json')
items = listings if isinstance(listings, list) else listings.get('items') or listings.get('listings')
man = load('src/data/photo-manifest.json')
man_sb = load('src/data/photo-manifest-sb.json')

def photos_of(it):  # 與 src/lib/store.ts 的 photosOf 同一套順序
    i = it['id']
    n = man.get(i, 0)
    if n > 0:
        return [f'{PHOTO_BASE}/yc{i}/{k+1:02d}.webp' for k in range(n)]
    m = man_sb.get(i, 0)
    if m > 0:
        return [f'{SB_BASE}/yc{i}/{k+1:02d}.jpg' for k in range(m)]
    if it.get('images'):
        return it['images']
    return [it['image']] if it.get('image') else []

def features(url):
    req = urllib.request.Request(url, headers=UA)
    data = urllib.request.urlopen(req, timeout=30).read()
    im = Image.open(io.BytesIO(data)).convert('RGB')
    im.thumbnail((160, 160))
    px = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
    white = sum(1 for r, g, b in px if min(r, g, b) > 225)
    return white / len(px)

def is_plan(url):
    # 格局圖是大片白底（店鋪照片的浮水印會讓它帶點粉紅，所以不看顏色）。
    # 全案件實測：格局圖白底比例幾乎都 0.5 以上，房子照片多半 0.3 以下，中間幾乎沒有。
    w = features(url)
    return w >= PLAN_WHITE, round(w, 2)

def pick(it):
    ps = photos_of(it)
    log = []
    for idx, u in enumerate(ps[:MAX_TRY]):
        try:
            plan, f = is_plan(u)
        except Exception as e:
            log.append((idx, 'err'))
            return None, log, ps  # 抓不到就不動，沿用舊結果
        log.append((idx, f, plan))
        if not plan:
            return idx, log, ps
    return 0, log, ps  # 前幾張全是格局圖：不動

if __name__ == '__main__':
    report = '--report' in sys.argv
    old = {}
    try: old = load('src/data/cover-idx.json')
    except Exception: pass
    out = {}
    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(pick, items))
    for it, (idx, log, ps) in zip(items, res):
        if idx is None:
            if it['id'] in old: out[it['id']] = old[it['id']]
            continue
        if report: print(it['id'], idx, log[:3])
        if idx > 0: out[it['id']] = idx
    json.dump(out, open('src/data/cover-idx.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(f'封面改用後面照片的案件：{len(out)} 件')
