# -*- coding: utf-8 -*-
"""
每天算一次各社區「近 12 個月成交筆數」，存進 src/data/lvr-counts.json。
資料：內政部實價登錄公開下載檔（plvr.land.moi.gov.tw），門牌範圍寫在 src/data/community-config.json（莎拉確認過的範圍，不猜）。
規則：只算「買賣」檔；有「備註」的（親友、特殊關係、含增建…）不算；抓不到就保留舊檔，不讓官網壞掉。
"""
import csv, datetime, io, json, os, re, sys, unicodedata, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "src", "data", "community-config.json")
OUT = os.path.join(ROOT, "src", "data", "lvr-counts.json")


def seasons(today, n=5):
    y, q = today.year - 1911, (today.month - 1) // 3 + 1
    out = []
    for _ in range(n):
        out.append(f"{y}S{q}")
        q -= 1
        if q == 0:
            y, q = y - 1, 4
    return out


def fetch(season):
    url = f"https://plvr.land.moi.gov.tw/DownloadSeason?season={season}&type=zip&fileName=lvr_landcsv.zip"
    try:
        with urllib.request.urlopen(url, timeout=120) as r:
            data = r.read()
    except Exception as e:
        print(f"（{season} 下載失敗：{e}）", file=sys.stderr)
        return None
    if data[:2] != b"PK":  # 還沒發布的季會回網頁
        print(f"（{season} 還沒有資料，略過）", file=sys.stderr)
        return None
    return zipfile.ZipFile(io.BytesIO(data))


def norm(s):
    return unicodedata.normalize("NFKC", s or "")


def roc_to_date(s):
    s = norm(s).strip()
    if len(s) < 7:
        return None
    try:
        return datetime.date(int(s[:-4]) + 1911, int(s[-4:-2]), int(s[-2:]))
    except ValueError:
        return None


def main():
    cfg = json.load(open(CONFIG, encoding="utf-8"))
    today = datetime.date.today()
    since = today.replace(year=today.year - 1) if not (today.month == 2 and today.day == 29) else datetime.date(today.year - 1, 2, 28)
    zips = {}
    got = []
    for s in seasons(today):
        z = fetch(s)
        if z:
            zips[s] = z
            got.append(s)
    if not zips:
        print("全部下載失敗，保留舊檔")
        return
    result = {}
    for name, c in cfg.items():
        l = c.get("lvr")
        if not l:
            continue
        fn = f"{l['city']}_lvr_land_a.csv"
        n = 0
        for s, z in zips.items():
            raw = z.read(fn).decode("utf-8-sig")
            rd = csv.DictReader(io.StringIO(raw))
            next(rd, None)  # 第二列是英文欄名
            for r in rd:
                if r["鄉鎮市區"] != l["district"]:
                    continue
                d = roc_to_date(r["交易年月日"])
                if not d or d < since or d > today:
                    continue
                if (r.get("備註") or "").strip():
                    continue
                addr = norm(r["土地位置建物門牌"])
                for rg in l["ranges"]:
                    m = re.search(re.escape(rg["road"]) + r"(?:\d+巷)?(?:\d+弄)?(\d+)號", addr)
                    if m and rg["lo"] <= int(m.group(1)) <= rg["hi"]:
                        n += 1
                        break
        result[name] = {"sales12m": n}
    out = {"asOf": today.isoformat(), "seasons": got, "communities": result}
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(OUT, "a", encoding="utf-8").write("\n")
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
