#!/usr/bin/env python3
"""Load the leadership team's product price sheet (Excel) into Dev or UAT.

UAT move plan `docs/UAT-Promotion-2026-11-29-Plan.md` D3-D4c; rewritten 28 Nov
from the 23 Nov Dev load (Pricing E2E step 30). Removed once the changes reach
UAT (D4). No client data in this file: the sheet's path is given when it runs.

    backend/.venv/Scripts/python.exe -I -X utf8 scripts/uat_price_load.py "<sheet.xlsx>"            # Dev preview
    backend/.venv/Scripts/python.exe -I -X utf8 scripts/uat_price_load.py "<sheet.xlsx>" --apply    # Dev write
    ... --env uat [--apply]                                                                          # UAT, own yes

What it does, all or nothing, in one transaction as an active Admin:
- Matches each sheet row to an active product by exact "Product name".
- Sets the four prices (Rs on the sheet -> lakhs, 2 decimals, so rounded to
  the nearest Rs 1,000 - Pricing D16) and the cost when the sheet has one.
- A row with no matching product is a new variation (D3b, D4b): it adds a new
  model under an existing brand and category, then the product. An unknown
  SBU, brand or category stops the load. "Product type" column (D4c):
  New / Refurbished / Accessory; blank saves as New equipment and is listed.
- First cost (empty -> a value) also fills that product's Won product lines
  with no saved cost, marked "filled in later" (Margin D16, D3d) - only when
  that column exists. On UAT the load runs after 0067 and before 0068 (D3a),
  so the column isn't there yet and 0068's one-time fill does it instead.
- Without --apply: read-only preview, nothing written. With --apply: writes,
  reads back, and commits only if every check passes. With --apply --rollback:
  the same writes and read-back, then rolled back (a write test, saves nothing).
"""
import argparse
import sys
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

import openpyxl
import psycopg2
import psycopg2.extras

ROOT = Path(__file__).resolve().parent.parent
ENV_FILES = {"dev": ROOT / "backend" / ".env", "uat": ROOT / "backend" / ".env.uat"}
UAT_EXPECTED_VERSION = "0067"  # D3a: database changes up to 0067, then this load

PRICE_COLS = [
    ("full_price_lakhs", "Full price (Rs, without GST)", "Full"),
    ("rep_floor_lakhs", "Rep's lowest (Rs, without GST)", "Rep"),
    ("area_manager_floor_lakhs", "Area Manager's lowest (Rs, without GST)", "AM"),
    ("ceo_floor_lakhs", "CEO's lowest (Rs, without GST)", "CEO"),
]
COST_COL = ("cost_lakhs", "Cost (Rs, optional)", "Cost")
ALL_COLS = PRICE_COLS + [COST_COL]
TYPE_HEADER = "Product type"
TYPES = {"new": "NEW_EQUIPMENT", "new equipment": "NEW_EQUIPMENT", "refurbished": "REFURBISHED",
         "accessory": "ACCESSORY"}
REQUIRED = ["SBU", "Brand", "Category", "Model", "Product name"] + [h for _, h, _ in ALL_COLS]


def load_env(path: Path) -> dict[str, str]:
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def text(v) -> str:
    return "" if v is None else " ".join(str(v).split())


def lakhs(rs) -> Decimal | None:
    if rs is None or (isinstance(rs, str) and not rs.strip()):
        return None
    return (Decimal(str(rs)) / Decimal(100000)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def read_sheet(path: Path, problems: list[str]) -> list[dict]:
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    if "Prices" not in wb.sheetnames:
        sys.exit(f"STOP: no 'Prices' tab in {path.name} (tabs: {wb.sheetnames})")
    rows = wb["Prices"].iter_rows(values_only=True)
    header = [text(h) for h in next(rows)]
    missing = [h for h in REQUIRED if h not in header]
    if missing:
        sys.exit(f"STOP: sheet columns missing: {missing}")
    idx = {h: header.index(h) for h in header if h}
    out = []
    for n, row in enumerate(rows, start=2):
        cell = {h: (row[i] if i < len(row) else None) for h, i in idx.items()}
        if not any(text(cell[h]) for h in ("Brand", "Model", "Product name")):
            continue
        rec = {"row": n, **{h: text(cell[h]) for h in ("SBU", "Brand", "Category", "Model", "Product name")},
               "type_text": text(cell.get(TYPE_HEADER)), "rs": {}, "new": {}}
        for col, h, label in ALL_COLS:
            v = cell[h]
            if isinstance(v, str) and v.strip() and not v.strip().replace(".", "", 1).isdigit():
                problems.append(f"row {n} {rec['Product name']}: {label} is not a number ({v!r})")
                v = None
            rec["rs"][col] = v
            rec["new"][col] = lakhs(v)
        out.append(rec)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("sheet", type=Path)
    ap.add_argument("--env", choices=["dev", "uat"], default="dev")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--rollback", action="store_true",
                    help="with --apply: write and read back every change, then roll back (tests the writes, saves nothing)")
    args = ap.parse_args()
    if args.rollback and not args.apply:
        sys.exit("STOP: --rollback is only used with --apply")
    if not args.sheet.is_file():
        sys.exit(f"STOP: sheet not found: {args.sheet}")

    url = load_env(ENV_FILES[args.env]).get("DATABASE_URL", "")
    url = url.replace("postgresql+psycopg2://", "postgresql://").replace("postgresql+asyncpg://", "postgresql://")
    looks_uat = "uat" in url.lower() or ":6543" in url
    if args.env == "dev" and looks_uat:
        sys.exit("REFUSING: backend/.env looks like UAT, not Dev")
    if args.env == "uat" and not looks_uat:
        sys.exit("REFUSING: backend/.env.uat does not look like UAT")

    problems: list[str] = []
    sheet = read_sheet(args.sheet, problems)

    conn = psycopg2.connect(url)
    conn.autocommit = False
    if not args.apply:
        conn.set_session(readonly=True, autocommit=False)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("SELECT version_num FROM alembic_version")
    version = cur.fetchone()["version_num"]
    if args.env == "uat" and not version.startswith(UAT_EXPECTED_VERSION):
        conn.rollback()
        sys.exit(f"STOP: UAT database is at {version}; this load runs at {UAT_EXPECTED_VERSION} (D3a)")
    cur.execute("""SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='opportunity_item' AND column_name='cost_filled_in_later') AS has""")
    can_fill = cur.fetchone()["has"]

    # Transaction-local settings: UAT's pooler may hand each transaction a
    # different connection (cabio-db-and-scripting skill).
    cur.execute("""SELECT up.id, up.sbu_id, up.role_id, up.display_name FROM user_profile up
                   JOIN role r ON r.id = up.role_id
                   WHERE r.role_name = 'Admin' AND up.is_active ORDER BY up.display_name LIMIT 1""")
    admin = cur.fetchone()
    if not admin:
        sys.exit("STOP: no active Admin user found")

    def set_rls() -> None:
        cur.execute("SELECT set_config('app.current_user_id', %s, true), set_config('app.current_sbu_id', %s, true),"
                    " set_config('app.current_role_id', %s, true)",
                    (str(admin["id"]), str(admin["sbu_id"] or ""), str(admin["role_id"])))
        cur.execute("SELECT cabio_app_uid() AS uid, cabio_app_role_name() AS role_name")
        v = cur.fetchone()
        if v["uid"] is None or v["role_name"] != "Admin":
            conn.rollback()
            sys.exit(f"STOP: RLS settings not in place: {v}")

    set_rls()
    mode = "APPLY" if args.apply else "PREVIEW (read-only, nothing written)"
    print(f"{mode} on {args.env.upper()} (database {version}) as {admin['display_name']}")
    print(f"Sheet: {args.sheet.name}, {len(sheet)} rows with a product")
    print(f"First-cost fill of old Won lines: {'yes' if can_fill else 'NO - column not there yet; 0068 fills them (D3a)'}\n")

    cur.execute("SELECT id, name FROM sbu")
    sbus = {r["name"]: r["id"] for r in cur.fetchall()}
    cur.execute("SELECT id, sbu_id, name FROM brand WHERE is_active")
    brands = {(r["sbu_id"], r["name"]): r["id"] for r in cur.fetchall()}
    cur.execute("SELECT id, sbu_id, name FROM category WHERE is_active")
    cats = {(r["sbu_id"], r["name"]): r["id"] for r in cur.fetchall()}
    # All models, switched-off ones too: the name must be unique per brand.
    cur.execute("SELECT id, brand_id, category_id, name, is_active FROM model")
    models = {(r["brand_id"], r["name"]): r for r in cur.fetchall()}
    cur.execute("""SELECT id, name, model_id, cost_lakhs, full_price_lakhs, rep_floor_lakhs,
                   area_manager_floor_lakhs, ceo_floor_lakhs FROM product WHERE is_active IS NOT FALSE""")
    products = cur.fetchall()
    by_name = {p["name"]: p for p in products}
    model_has_product = {p["model_id"] for p in products}

    updates, creates, rounded, unchanged, first_costs, changed_costs, default_type = [], [], [], 0, [], [], []
    seen = set()
    for r in sheet:
        # The app always names a product "Brand Model Category" (database
        # trigger), so match on that. A copied row whose Product name was not
        # updated must not overwrite the product it was copied from.
        name = f"{r['Brand']} {r['Model']} {r['Category']}"
        tag = f"row {r['row']} {name}"
        if r["Product name"] and r["Product name"] != name:
            problems.append(f"{tag}: Product name column says '{r['Product name']}' - not Brand + Model + Category")
            continue
        if name in seen:
            problems.append(f"{tag}: product name appears twice on the sheet")
            continue
        seen.add(name)
        new = r["new"]
        for col, _, label in ALL_COLS:
            if r["rs"][col] is not None and new[col] is not None and Decimal(str(r["rs"][col])) != new[col] * 100000:
                rounded.append(f"{tag} {label}: Rs {Decimal(str(r['rs'][col])):,.0f} -> Rs {new[col] * 100000:,.0f}")
        lows = [new[c] for c in ("rep_floor_lakhs", "area_manager_floor_lakhs", "ceo_floor_lakhs")]
        if any(x is not None for x in lows) and not all(x is not None for x in lows):
            problems.append(f"{tag}: lowest prices only partly filled")
        if any(x is not None for x in lows) and new["full_price_lakhs"] is None:
            problems.append(f"{tag}: lowest prices without a full price")

        prod = by_name.get(name)
        cost = new["cost_lakhs"] if new["cost_lakhs"] is not None else (prod["cost_lakhs"] if prod else None)
        ladder = [new[c] if new["full_price_lakhs"] is not None or not prod else prod[c] for c, _, _ in PRICE_COLS]
        chain = [x for x in ladder + [cost] if x is not None]
        if any(chain[i] < chain[i + 1] for i in range(len(chain) - 1)):
            problems.append(f"{tag}: prices/cost out of order (Full >= Rep >= AM >= CEO >= Cost): {[str(x) for x in chain]}")

        if prod:
            if r["type_text"]:
                problems.append(f"{tag}: Product type given for an existing product (only new rows use it)")
            sets = {}
            if new["full_price_lakhs"] is not None:  # blank price row leaves existing prices as they are
                sets.update({c: new[c] for c, _, _ in PRICE_COLS if prod[c] != new[c]})
            if new["cost_lakhs"] is not None and prod["cost_lakhs"] != new["cost_lakhs"]:
                sets["cost_lakhs"] = new["cost_lakhs"]
                (first_costs if prod["cost_lakhs"] is None else changed_costs).append(prod["id"])
                if prod["cost_lakhs"] is not None:
                    print(f"  note: {tag}: cost {prod['cost_lakhs']} -> {new['cost_lakhs']} (past sales keep their saved cost)")
            if sets:
                updates.append((prod, sets))
            else:
                unchanged += 1
            continue

        # New variation (D3b, D4b): existing SBU, brand and category only.
        sbu_id = sbus.get(r["SBU"])
        brand_id = brands.get((sbu_id, r["Brand"])) if sbu_id else None
        cat_id = cats.get((sbu_id, r["Category"])) if sbu_id else None
        missing = [f"{k} '{r[k]}'" for k, v in (("SBU", sbu_id), ("Brand", brand_id), ("Category", cat_id)) if not v]
        if missing:
            problems.append(f"{tag}: new row, not in the app: {', '.join(missing)} - add it on the screen first (D4b)")
            continue
        if not r["Model"]:
            problems.append(f"{tag}: new row without a Model")
            continue
        ptype = TYPES.get(r["type_text"].lower()) if r["type_text"] else "NEW_EQUIPMENT"
        if ptype is None:
            problems.append(f"{tag}: Product type '{r['type_text']}' is not New / Refurbished / Accessory")
            continue
        if not r["type_text"]:
            default_type.append(tag)
        model = models.get((brand_id, r["Model"]))
        if model and not model["is_active"]:
            problems.append(f"{tag}: model '{r['Model']}' exists but is switched off - switch it on on the screen first")
            continue
        if model and model["category_id"] != cat_id:
            problems.append(f"{tag}: model '{r['Model']}' already exists under a different category")
            continue
        if model and model["id"] in model_has_product:
            problems.append(f"{tag}: model '{r['Model']}' already has a product under another name")
            continue
        creates.append({"tag": tag, "name": name, "sbu_id": sbu_id, "brand_id": brand_id, "category_id": cat_id,
                        "model_name": r["Model"], "model": model, "product_type": ptype, "new": new})
        if new["cost_lakhs"] is not None:
            first_costs.append(None)  # counted only; a new product has no past sales

    on_sheet = {f"{r['Brand']} {r['Model']} {r['Category']}" for r in sheet}
    not_on_sheet = sorted(p["name"] for p in products if p["name"] not in on_sheet)

    print(f"Existing products updated: {len(updates)}; already identical: {unchanged}")
    for prod, sets in updates:
        old = {c: prod[c] for c in sets}
        print(f"  {prod['name']}: " + ", ".join(f"{c.replace('_lakhs', '')} {old[c]} -> {sets[c]}" for c in sets))
    print(f"New products: {len(creates)} (new models: {sum(1 for c in creates if not c['model'])})")
    for c in creates:
        prices = ", ".join(f"{lbl} {c['new'][col]}" for col, _, lbl in ALL_COLS if c["new"][col] is not None) or "no prices"
        print(f"  {c['tag']} [{c['product_type']}] {'' if c['model'] else 'new model, '}{prices}")
    print(f"New rows with no Product type, saved as New equipment (D4c): {len(default_type)}")
    for t in default_type:
        print("  ", t)
    print(f"First costs set: {len(first_costs)}; changed costs: {len(changed_costs)}")
    print(f"Values rounded to the nearest Rs 1,000: {len(rounded)}")
    for x in rounded:
        print("  ", x)
    print(f"Active products not on the sheet (untouched): {len(not_on_sheet)}")
    for n in not_on_sheet:
        print("  ", n)
    print(f"Problems: {len(problems)}")
    for p in problems:
        print("  -", p)

    if not args.apply:
        conn.rollback()
        conn.close()
        print("\nPREVIEW ONLY - nothing written.")
        return
    if problems:
        conn.rollback()
        conn.close()
        sys.exit("\nROLLED BACK - checks did not pass, nothing saved.")

    set_rls()
    filled = 0
    uid = admin["id"]

    def fill(product_id, cost) -> int:
        cur.execute("""UPDATE opportunity_item oi SET cost_at_won_lakhs = %s, cost_filled_in_later = true
                       FROM opportunity o JOIN opportunity_status s ON s.id = o.status_id
                       WHERE oi.opportunity_id = o.id AND s.status_code = 'WON' AND oi.product_id = %s
                         AND oi.line_type = 'PRODUCT' AND oi.cost_at_won_lakhs IS NULL""", (cost, product_id))
        return cur.rowcount

    for prod, sets in updates:
        cols = ", ".join(f"{c} = %s" for c in sets)
        cur.execute(f"UPDATE product SET {cols}, updated_by = %s WHERE id = %s", (*sets.values(), uid, prod["id"]))
        if cur.rowcount != 1:
            conn.rollback()
            sys.exit(f"STOP: update of {prod['name']} changed {cur.rowcount} rows; rolled back")
        if can_fill and prod["id"] in first_costs:
            filled += fill(prod["id"], sets["cost_lakhs"])
    created_ids = []
    for c in creates:
        model_id = c["model"]["id"] if c["model"] else None
        if not model_id:
            cur.execute("INSERT INTO model (brand_id, category_id, sbu_id, name) VALUES (%s, %s, %s, %s) RETURNING id",
                        (c["brand_id"], c["category_id"], c["sbu_id"], c["model_name"]))
            model_id = cur.fetchone()["id"]
        n = c["new"]
        cur.execute("""INSERT INTO product (sbu_id, name, product_type, brand_id, model_id, category_id,
                       full_price_lakhs, rep_floor_lakhs, area_manager_floor_lakhs, ceo_floor_lakhs, cost_lakhs,
                       created_by, updated_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (c["sbu_id"], c["name"], c["product_type"], c["brand_id"], model_id, c["category_id"],
                     n["full_price_lakhs"], n["rep_floor_lakhs"], n["area_manager_floor_lakhs"], n["ceo_floor_lakhs"],
                     n["cost_lakhs"], uid, uid))
        created_ids.append((cur.fetchone()["id"], c))

    # Read back every written value.
    bad = []
    for prod, sets in updates:
        cur.execute("SELECT * FROM product WHERE id = %s", (prod["id"],))
        got = cur.fetchone()
        if any(got[c] != v for c, v in sets.items()):
            bad.append(prod["name"])
    for pid, c in created_ids:
        cur.execute("SELECT * FROM product WHERE id = %s", (pid,))
        got = cur.fetchone()
        if not got or got["name"] != c["name"] or any(got[col] != c["new"][col] for col, _, _ in ALL_COLS):
            bad.append(c["name"])
    cur.execute("SELECT cabio_app_uid() AS uid")
    if bad or cur.fetchone()["uid"] is None:
        conn.rollback()
        sys.exit(f"ROLLED BACK - read-back failed for {bad}, nothing saved.")
    cur.execute("SELECT count(*) AS n FROM product WHERE is_active IS NOT FALSE AND full_price_lakhs IS NOT NULL")
    priced = cur.fetchone()["n"]
    if args.rollback:
        conn.rollback()
        conn.close()
        print(f"\nWRITE TEST PASSED, ROLLED BACK - nothing saved. Would have: {len(updates)} products updated, "
              f"{len(created_ids)} added, {filled} old Won lines given their first cost; "
              f"active products with a full price would be: {priced}")
        return
    conn.commit()
    conn.close()
    print(f"\nCOMMITTED on {args.env.upper()} - {len(updates)} products updated, {len(created_ids)} added, "
          f"{filled} old Won lines given their first cost; active products with a full price now: {priced}")


if __name__ == "__main__":
    main()
