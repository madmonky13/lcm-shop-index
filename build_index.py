"""
build_index.py - builds the small product index that the LCM 4x4 shop pages read.

Reads the public store list (https://lcm4x4.co.uk/store?format=json, all pages) and writes
site/index.json with just what the shop grid and filters need. No keys or passwords: it only
uses information that is already public on the website.

Safety: if the store can't be read, or it returns far fewer products than last time, the
script exits with an error and nothing is published, so the shop keeps the last good index.
"""
import json
import os
import sys
import time
import urllib.request

SITE = "https://lcm4x4.co.uk"
OUT_DIR = "site"
MIN_ITEMS = 500           # never publish an index smaller than this
MAX_DROP = 0.2            # or one more than 20% smaller than the last published one
UNIVERSAL_MODELS = 20     # tagged for this many models or more = fits any vehicle
TAG_PREFIXES = ("Manufacturer", "Model", "Brand", "Axle", "Voltage")


def get(url, tries=4):
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "lcm-shop-index/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            if n == tries - 1:
                raise
            print(f"retry {n + 1} for {url}: {e}")
            time.sleep(5 * 2 ** n)


def money(m):
    try:
        return round(float((m or {}).get("value")), 2)
    except (TypeError, ValueError):
        return None


def item_row(it, order):
    vs = (it.get("structuredContent") or {}).get("variants") or it.get("variants") or []
    prices = []
    in_stock = False
    on_sale = False
    for v in vs:
        p = money(v.get("priceMoney"))
        s = money(v.get("salePriceMoney")) if v.get("onSale") else None
        if p is None:
            continue
        eff = s if s is not None and s < p else p
        prices.append((eff, p))
        if s is not None and s < p:
            on_sale = True
        if v.get("unlimited") or (v.get("qtyInStock") or 0) > 0:
            in_stock = True
    tags = {}
    models = 0
    for t in it.get("tags") or []:
        if ":" not in t:
            continue
        k, val = t.split(":", 1)
        k, val = k.strip(), val.strip()
        if k in TAG_PREFIXES and val:
            tags.setdefault(k, []).append(val)
            if k == "Model":
                models += 1
    gallery = [x.get("assetUrl") for x in (it.get("items") or []) if x.get("assetUrl")]
    first_img = gallery[0] if gallery else it.get("assetUrl")   # product assetUrl alone is a placeholder
    row = {
        "id": it.get("id"),
        "t": it.get("title", "").strip(),
        "u": it.get("fullUrl"),
        "i": first_img,
        "c": it.get("categoryIds") or [],
        "o": order,                                   # store order
        "a": it.get("addedOn"),                       # date added (ms)
        "s": 1 if in_stock else 0,
    }
    if prices:
        low = min(prices)
        row["p"] = low[0]
        if low[1] > low[0]:
            row["w"] = low[1]                         # was-price (on sale)
        if len({x[0] for x in prices}) > 1:
            row["f"] = 1                              # "from" price
    if on_sale:
        row["sale"] = 1
    if models >= UNIVERSAL_MODELS:
        row["any"] = 1                                # fits any vehicle
        tags.pop("Manufacturer", None)                # no need to ship 41 model names per item
        tags.pop("Model", None)
    keys = {"Manufacturer": "mf", "Model": "md", "Brand": "b", "Axle": "ax", "Voltage": "vo"}
    for k, v in tags.items():
        row[keys[k]] = v
    if len(gallery) > 1:
        row["i2"] = gallery[1]                        # second photo (hover)
    return row


def categories(nested):
    out = []

    def walk(cs, parent):
        for c in cs:
            out.append({"id": c.get("id"), "n": c.get("displayName"), "p": parent})
            walk(c.get("children") or [], c.get("id"))

    walk(nested or [], None)
    return out


def main():
    items, url, pages, first = [], f"{SITE}/store?format=json", 0, None
    while url and pages < 40:
        d = get(url)
        first = first or d
        items.extend(d.get("items") or [])
        pages += 1
        pg = d.get("pagination") or {}
        url = f"{SITE}/store?format=json&offset={pg['nextPageOffset']}" if pg.get("nextPage") else None
    print(f"read {len(items)} products in {pages} pages")

    if len(items) < MIN_ITEMS:
        sys.exit(f"STOP: only {len(items)} products read (minimum {MIN_ITEMS}); not publishing")
    last = os.environ.get("LAST_COUNT")
    if last and last.isdigit() and len(items) < int(last) * (1 - MAX_DROP):
        sys.exit(f"STOP: {len(items)} products vs {last} last time; not publishing")

    seen, rows = set(), []
    for n, it in enumerate(items):
        if it.get("id") in seen:
            continue
        seen.add(it.get("id"))
        rows.append(item_row(it, n))

    cats = categories(((first or {}).get("nestedCategories") or {}).get("categories"))
    # check: every category with products should be reachable
    ids = {c["id"] for c in cats}
    orphans = sum(1 for r in rows if r["c"] and not set(r["c"]) & ids)

    index = {
        "v": 1,
        "built": int(time.time() * 1000),
        "count": len(rows),
        "cats": cats,
        "items": rows,
    }
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)
    summary = {
        "built": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()),
        "products": len(rows),
        "in_stock": sum(r["s"] for r in rows),
        "on_sale": sum(1 for r in rows if r.get("sale")),
        "fits_any_vehicle": sum(1 for r in rows if r.get("any")),
        "categories": len(cats),
        "products_with_unknown_category": orphans,
        "bytes": os.path.getsize(os.path.join(OUT_DIR, "index.json")),
    }
    with open(os.path.join(OUT_DIR, "summary.json"), "w") as f:
        json.dump(summary, f, indent=1)
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
