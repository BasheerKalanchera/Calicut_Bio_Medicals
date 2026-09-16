#!/usr/bin/env python3
"""
Single source of truth: docs/Signed-Requirements-to-PRD-Traceability.md.

Regenerates:
  - docs/Signed-Requirements-to-PRD-Traceability.md's own "Current tally"
    line (between the TALLY:START/TALLY:END markers) -- the rest of that
    file is hand-edited as usual; only the tally sentence is derived.
  - docs/Phase1-Delivery-Scorecard.md (internal, full Notes column)
  - .scratch/phase1-scorecard.html (client-facing: what Haroon/Latheef Bhai
    see -- Status + Client Note only, Partial rows only carry a note).
    This is the same file published as the "Phase 1 Delivery Scorecard"
    Artifact; after running this script, republish it from that path to
    push the update live.

Run this after any Status/Note edit to Traceability.md. Never hand-edit
either generated file directly. This also rewrites the "Current tally"
line inside Traceability.md itself (between the TALLY:START/TALLY:END
markers), so that line can never drift from the table above it.

Run with --check to verify everything is in sync without writing
anything: exits 1 and lists which file(s) are stale if Traceability.md's
tally line, the Scorecard, or the HTML don't match what the table
currently computes to. Useful right before a commit that touches any of
these three files.
"""

import html as html_lib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACEABILITY = ROOT / "docs" / "Signed-Requirements-to-PRD-Traceability.md"
SCORECARD = ROOT / "docs" / "Phase1-Delivery-Scorecard.md"
CLIENT_HTML = ROOT / ".scratch" / "phase1-scorecard.html"

MODULE_INTROS = {
    "1. Customer Account Management": "Where every hospital, clinic and dealer account is set up, described and tracked.",
    "2. Product Catalog Management": "Where every machine Cabio sells is described, organised and backed with sales materials.",
    "3. Opportunity Management": "Where every sales deal is tracked from first contact through to close.",
    "4. Activity Tracking & Next Actions": "Where every visit, call and follow-up gets logged.",
    "5. Reporting & Review": "Where leadership and managers see how the business is doing.",
    "6. Admin (Power User): Organization & Sales Governance": "The management tools behind the scenes — targets, territories, roles, and who's authorised to sell what.",
    "6b. Admin (Power User): User Roles & Access Control": None,  # rendered as ### subsection, no intro line
    "7. System & Architecture Constraints": "The plumbing underneath — hosting, security, and disaster recovery.",
}

# Scorecard's own module heading text differs slightly from Traceability's
# (shorter, leadership-friendly) -- mapped explicitly rather than derived.
SCORECARD_HEADINGS = {
    "1. Customer Account Management": "1. Customer Account Management",
    "2. Product Catalog Management": "2. Product Catalog Management",
    "3. Opportunity Management": "3. Opportunity Management",
    "4. Activity Tracking & Next Actions": "4. Activity Tracking & Next Actions",
    "5. Reporting & Review": "5. Reporting & Review",
    "6. Admin (Power User): Organization & Sales Governance": "6. Governance & Admin",
    "6b. Admin (Power User): User Roles & Access Control": "6b. User Roles & Access Control",
    "7. System & Architecture Constraints": "7. Technical Foundation",
}


def split_row(line: str) -> list[str]:
    # Strip leading/trailing "|" then split on "|", trim each cell.
    inner = line.strip()[1:-1]
    return [cell.strip() for cell in inner.split("|")]


def parse_traceability() -> tuple[list[tuple[str, list[dict]]], list[str]]:
    text = TRACEABILITY.read_text(encoding="utf-8")

    # Module sections: "## N. Title" or "## Nb. Title" up to the next "## " or "---"
    module_pattern = re.compile(
        r"^## (\d+b?\. .+?)\n\n(\| Signed Feature ID.*?)\n\n", re.MULTILINE | re.DOTALL
    )
    modules: list[tuple[str, list[dict]]] = []
    for m in module_pattern.finditer(text + "\n\n"):
        title, table_block = m.group(1).strip(), m.group(2)
        lines = [l for l in table_block.splitlines() if l.strip().startswith("|")]
        rows = []
        for line in lines[2:]:  # skip header + separator
            cells = split_row(line)
            rows.append(
                {
                    "feature_id": cells[0],
                    "requirement": cells[1],
                    "prd_section": cells[2],
                    "status": cells[3],
                    "notes": cells[4],
                    "client_note": cells[5] if len(cells) > 5 else "",
                }
            )
        modules.append((title, rows))

    # Commitment beyond contract table
    beyond_match = re.search(
        r"## Commitment beyond contract\n\n.*?\n\n(\| # \|.*?)\n\n", text, re.DOTALL
    )
    beyond_items: list[str] = []
    if beyond_match:
        lines = [l for l in beyond_match.group(1).splitlines() if l.strip().startswith("|")]
        for line in lines[2:]:
            cells = split_row(line)
            beyond_items.append(cells[1])

    return modules, beyond_items


TALLY_PATTERN = re.compile(
    r"(<!-- TALLY:START.*?-->\n)(.*?)(\n<!-- TALLY:END -->)", re.DOTALL
)


def render_traceability_with_tally(
    original_text: str, done: int, partial: int, not_started: int
) -> str:
    total = done + partial + not_started
    replacement_body = (
        f"**Current tally: {done} Done · {partial} Partial · {not_started} Not "
        f"started** ({total} signed lines\ntracked below)."
    )
    new_text, count = TALLY_PATTERN.subn(
        lambda m: m.group(1) + replacement_body + m.group(3), original_text
    )
    if count != 1:
        raise ValueError(
            f"Expected exactly one TALLY:START/TALLY:END block in "
            f"{TRACEABILITY.name}, found {count}"
        )
    return new_text


def compute_tally(modules: list[tuple[str, list[dict]]]) -> tuple[int, int, int]:
    done = partial = not_started = 0
    for _, rows in modules:
        for r in rows:
            status = r["status"]
            if status.startswith("Done"):
                done += 1
            elif status == "Partial":
                partial += 1
            elif status == "Not started":
                not_started += 1
            else:
                raise ValueError(f"Unrecognised status: {status!r}")
    return done, partial, not_started


def render_scorecard(modules: list[tuple[str, list[dict]]], beyond_items: list[str]) -> str:
    done, partial, not_started = compute_tally(modules)
    total = done + partial + not_started
    strict_pct = round(done / total * 100, 1)
    half_credit_pct = round((done + partial * 0.5) / total * 100, 1)

    lines = [
        "# Phase 1 Delivery Scorecard",
        "",
        "**Prepared:** 13 Sep 2026 · **Generated from `docs/Signed-Requirements-to-PRD-Traceability.md`** "
        "by `scripts/generate_scorecard.py` — do not hand-edit this file.",
        "**Scope:** A line-by-line check of every signed-off Phase 1 requirement against what is actually "
        "built today — verified against the live database schema and the actual backend/frontend code, not "
        "just documentation — plus everything delivered beyond that original list.",
        "",
        "## Summary",
        "",
        f"Of **{total}** signed requirements: **{done} done, {partial} partly done, {not_started} not "
        f"started** — plus **{len(beyond_items)} features built that weren't asked for at all** (see "
        '"Commitment beyond contract" at the end).',
        "",
        "| Done | Partly done | Not started | New Features Added |",
        "| :---: | :---: | :---: | :---: |",
        f"| {done} | {partial} | {not_started} | {len(beyond_items)} |",
        "",
        "**Real progress, two honest ways to read it:**",
        f"- **Strictly done:** {done} of {total} = **{strict_pct}%**",
        f"- **Counting partly-done items as half-credit** (the fairer \"real progress\" number, since "
        f"{partial} items aren't zero — they're mid-flight): ({done} + {partial}×0.5) ÷ {total} = "
        f"**{half_credit_pct}%**",
        "",
        "---",
        "",
    ]

    row_num = 0
    for title, rows in modules:
        heading = SCORECARD_HEADINGS.get(title, title)
        lines.append(f"## {heading}" if not title.startswith("6b") else f"### {heading}")
        lines.append("")
        intro = MODULE_INTROS.get(title)
        if intro:
            lines.append(intro)
            lines.append("")
        lines.append("| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |")
        lines.append("| :---: | :--- | :--- | :--- | :--- | :--- |")
        for r in rows:
            row_num += 1
            note = r["client_note"] if r["status"] == "Partial" else ""
            lines.append(
                f"| {row_num} | {r['feature_id']} | {r['requirement']} | {r['prd_section']} | "
                f"{r['status']} | {note} |"
            )
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Commitment beyond contract")
    lines.append("")
    lines.append("Following items were not part of the requirements that were signed off by Cabio leadership team.")
    lines.append("")
    lines.append("| # | What we built |")
    lines.append("| :---: | :--- |")
    for i, item in enumerate(beyond_items, start=1):
        lines.append(f"| {i} | {item} |")
    lines.append("")

    return "\n".join(lines)


# ============================================================================
# Client-facing HTML (the published Artifact)
# ============================================================================

HTML_MODULE_META = {
    "1. Customer Account Management": {
        "idx": "01", "heading": "Customer Account Management", "sidebar": "Customer Accounts",
        "desc": "Where every hospital, clinic and dealer account is set up, described and tracked.",
    },
    "2. Product Catalog Management": {
        "idx": "02", "heading": "Product Catalog Management", "sidebar": "Product Catalog",
        "desc": "Where every machine Cabio sells is described, organised and backed with sales materials.",
    },
    "3. Opportunity Management": {
        "idx": "03", "heading": "Opportunity Management", "sidebar": "Opportunity Mgmt",
        "desc": "Where every sales deal is tracked from first contact through to close.",
    },
    "4. Activity Tracking & Next Actions": {
        "idx": "04", "heading": "Activity Tracking &amp; Next Actions", "sidebar": "Activity Tracking",
        "desc": "Where every visit, call and follow-up gets logged.",
    },
    "5. Reporting & Review": {
        "idx": "05", "heading": "Reporting &amp; Review", "sidebar": "Reporting &amp; Review",
        "desc": "Where leadership and managers see how the business is doing.",
    },
    "6. Admin (Power User): Organization & Sales Governance": {
        "idx": "06", "heading": "Governance &amp; Admin", "sidebar": "Governance &amp; Admin",
        "desc": "The management tools behind the scenes — targets, territories, roles, and who's authorised to sell what.",
    },
    "7. System & Architecture Constraints": {
        "idx": "07", "heading": "Technical Foundation", "sidebar": "Technical Foundation",
        "desc": "The plumbing underneath — hosting, security, and disaster recovery.",
    },
}

HTML_HEAD = """<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>
<title>Phase 1 Delivery Scorecard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  :root{
    --bg:#F4F7F6;
    --surface:#FFFFFF;
    --surface-2:#EAF0ED;
    --ink:#14201D;
    --ink-muted:#4B5D58;
    --ink-faint:#7C8D88;
    --border:#DAE4E0;
    --border-strong:#C2D1CB;
    --accent:#0E6E58;
    --accent-ink:#FFFFFF;
    --accent-soft:#E3F1EC;
    --done:#1E8E5A;
    --done-soft:#E3F4EA;
    --partial:#A8720F;
    --partial-soft:#FBF0DD;
    --not-started:#B23B2B;
    --not-started-soft:#FBE9E5;
    --bonus:#5850A0;
    --bonus-soft:#ECEAF8;
    --shadow: 0 1px 2px rgba(20,32,29,0.06), 0 6px 20px -8px rgba(20,32,29,0.12);
  }

  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --bg:#0D1512;
      --surface:#121D19;
      --surface-2:#182721;
      --ink:#E8F2ED;
      --ink-muted:#9FB6AE;
      --ink-faint:#75897F;
      --border:#233731;
      --border-strong:#2E4A41;
      --accent:#49D6AC;
      --accent-ink:#08211A;
      --accent-soft:#15332A;
      --done:#49D6AC;
      --done-soft:#12281F;
      --partial:#E5AC53;
      --partial-soft:#2E2413;
      --not-started:#EA7867;
      --not-started-soft:#301A16;
      --bonus:#ACA5EE;
      --bonus-soft:#211E3B;
      --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 10px 28px -10px rgba(0,0,0,0.5);
    }
  }
  :root[data-theme="dark"]{
    --bg:#0D1512;
    --surface:#121D19;
    --surface-2:#182721;
    --ink:#E8F2ED;
    --ink-muted:#9FB6AE;
    --ink-faint:#75897F;
    --border:#233731;
    --border-strong:#2E4A41;
    --accent:#49D6AC;
    --accent-ink:#08211A;
    --accent-soft:#15332A;
    --done:#49D6AC;
    --done-soft:#12281F;
    --partial:#E5AC53;
    --partial-soft:#2E2413;
    --not-started:#EA7867;
    --not-started-soft:#301A16;
    --bonus:#ACA5EE;
    --bonus-soft:#211E3B;
    --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 10px 28px -10px rgba(0,0,0,0.5);
  }

  *{ box-sizing:border-box; }
  html{ scroll-behavior:smooth; }
  @media (prefers-reduced-motion: reduce){ html{ scroll-behavior:auto; } *{ animation-duration:0.001ms !important; transition-duration:0.001ms !important; } }

  body{
    margin:0;
    background:var(--bg);
    color:var(--ink);
    font-family:"IBM Plex Sans", -apple-system, "Segoe UI", sans-serif;
    font-size:15px;
    line-height:1.55;
  }

  h1,h2,h3{ font-family:"IBM Plex Serif", Georgia, serif; text-wrap:balance; margin:0; }
  .mono{ font-family:"IBM Plex Mono", ui-monospace, monospace; font-variant-numeric:tabular-nums; }

  a{ color:var(--accent); }
  ::selection{ background:var(--accent-soft); }

  .shell{
    display:grid;
    grid-template-columns: 236px minmax(0,1fr);
    max-width:1200px;
    margin:0 auto;
    padding-inline:20px;
  }
  @media (max-width: 900px){
    .shell{ grid-template-columns: 1fr; }
  }

  /* ---------- Side nav ---------- */
  nav.railwrap{ position:relative; }
  .rail{
    position:sticky; top:0;
    height:100vh;
    overflow-y:auto;
    padding-block:28px 24px;
    padding-right:18px;
    display:flex; flex-direction:column; gap:2px;
    border-right:1px solid var(--border);
  }
  @media (max-width:900px){
    .rail{
      position:static; height:auto; border-right:none; border-bottom:1px solid var(--border);
      flex-direction:row; overflow-x:auto; padding:14px 0 16px; gap:6px;
    }
    .rail .rail-title{ display:none; }
  }
  .rail-title{
    font-family:"IBM Plex Mono"; font-size:10.5px; letter-spacing:0.11em; text-transform:uppercase;
    color:var(--ink-faint); margin-bottom:10px;
  }
  .rail a{
    text-decoration:none; color:var(--ink-muted);
    font-size:13.5px; padding:7px 10px; border-radius:7px;
    display:flex; justify-content:space-between; gap:10px; white-space:nowrap;
    border-left:2px solid transparent;
  }
  @media (max-width:900px){ .rail a{ border-left:none; border-bottom:2px solid transparent; flex-shrink:0; } }
  .rail a:hover{ background:var(--surface-2); color:var(--ink); }
  .rail a.active{ color:var(--accent); background:var(--accent-soft); border-left-color:var(--accent); font-weight:600; }
  .rail a .n{ color:var(--ink-faint); font-family:"IBM Plex Mono"; font-size:11.5px; }
  .rail a.active .n{ color:var(--accent); }

  main{ min-width:0; padding-block:28px 64px; }

  /* ---------- Header / vitals ---------- */
  header.top{ margin-bottom:34px; }
  .eyebrow{
    font-family:"IBM Plex Mono"; font-size:11px; letter-spacing:0.12em; text-transform:uppercase;
    color:var(--accent); margin-bottom:10px; display:flex; align-items:center; gap:8px;
  }
  .eyebrow .dot{ width:6px; height:6px; border-radius:50%; background:var(--accent); display:inline-block; }
  h1.title{ font-size:clamp(28px,4vw,38px); font-weight:600; margin-bottom:8px; }
  .subtitle{ color:var(--ink-muted); max-width:62ch; font-size:14.5px; }
  .meta-line{ margin-top:12px; font-size:12.5px; color:var(--ink-faint); font-family:"IBM Plex Mono"; }

  .vitals{
    margin-top:26px;
    background:var(--surface);
    border:1px solid var(--border);
    border-radius:14px;
    box-shadow:var(--shadow);
    padding:22px 24px 20px;
  }
  .stat-row{
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:18px;
  }
  @media (max-width:640px){ .stat-row{ grid-template-columns:repeat(2,1fr); } }
  .stat{ display:flex; flex-direction:column; gap:4px; }
  .stat .num{ font-family:"IBM Plex Mono"; font-weight:600; font-size:30px; line-height:1; }
  .stat .lbl{ font-size:12px; color:var(--ink-muted); display:flex; align-items:center; gap:6px; }
  .swatch{ width:9px; height:9px; border-radius:2.5px; display:inline-block; flex-shrink:0; }

  .traceblock{
    margin-top:22px; padding-top:20px; border-top:1px solid var(--border);
    display:grid; grid-template-columns: 1fr; gap:10px;
  }
  .trace-caption{ font-size:12.5px; color:var(--ink-muted); display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  .trace-caption b{ color:var(--ink); font-family:"IBM Plex Mono"; }
  svg.trace{ width:100%; height:auto; display:block; overflow:visible; }
  svg.trace text{ font-family:"IBM Plex Mono"; fill:var(--ink-muted); }
  svg.trace .tick{ stroke:var(--border-strong); stroke-width:1; }
  svg.trace .axis{ stroke:var(--border-strong); stroke-width:1; }
  svg.trace .track-line{ stroke:var(--border-strong); stroke-width:2; fill:none; }
  svg.trace .mark-strict{ fill:var(--ink); }
  svg.trace .mark-weighted{ fill:var(--accent-soft); stroke:var(--accent); stroke-width:2; }
  svg.trace .lbl-strong{ fill:var(--ink); font-weight:600; font-size:12.5px; }
  svg.trace .lbl-soft{ fill:var(--ink-muted); font-size:11px; }

  /* ---------- Sections ---------- */
  section.mod{ margin-top:52px; scroll-margin-top:18px; }
  section.mod:first-of-type{ margin-top:44px; }
  .mod-head{ display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:10px 18px; margin-bottom:6px; }
  .mod-head h2{ font-size:20px; font-weight:600; display:flex; align-items:baseline; gap:10px; }
  .mod-head h2 .idx{ font-family:"IBM Plex Mono"; color:var(--accent); font-size:15px; font-weight:600; }
  .mod-desc{ color:var(--ink-muted); font-size:13.5px; max-width:64ch; margin-top:2px; }
  .tally{ display:flex; gap:14px; flex-wrap:wrap; font-family:"IBM Plex Mono"; font-size:12px; color:var(--ink-muted); }
  .tally span{ display:inline-flex; align-items:center; gap:5px; }

  .rows{ margin-top:18px; border-top:1px solid var(--border); }
  .row{
    display:grid;
    grid-template-columns: 34px 60px 1fr 128px 200px;
    gap:14px;
    padding:14px 4px;
    border-bottom:1px solid var(--border);
    align-items:start;
  }
  @media (max-width:1020px){
    .row{ grid-template-columns: 34px 60px 1fr 120px; }
    .row .col-prd{ grid-column: 3 / 4; order:5; padding-top:4px; }
  }
  @media (max-width:760px){
    .row{ grid-template-columns: 26px 1fr; }
    .row .rn{ grid-column:1/2; }
    .row .ids{ grid-column:2/3; order:1; }
    .row > div:nth-child(3){ grid-column:2/3; order:2; }
    .row .col-status{ grid-column:2/3; order:3; }
    .row .col-prd{ grid-column:2 / 3; order:4; }
  }
  .row-head{
    padding-block:0 8px !important; border-bottom:1px solid var(--border-strong) !important;
  }
  .row-head span{
    font-family:"IBM Plex Mono"; font-size:10px; letter-spacing:0.09em; text-transform:uppercase;
    color:var(--ink-faint);
  }
  @media (max-width:760px){ .row-head{ display:none; } }
  .row .rn{ font-family:"IBM Plex Mono"; color:var(--ink-faint); font-size:12.5px; padding-top:2px; }
  .row .ids{ display:flex; flex-wrap:wrap; gap:4px; align-content:flex-start; }
  .idchip{
    font-family:"IBM Plex Mono"; font-size:10.5px; color:var(--ink-muted);
    background:var(--surface-2); border:1px solid var(--border); border-radius:5px;
    padding:1px 5px; white-space:nowrap;
  }
  .idchip.untagged{ font-style:italic; color:var(--ink-faint); border-style:dashed; }
  .req{ font-weight:500; font-size:14px; }
  .note{ color:var(--ink-muted); font-size:13px; margin-top:5px; line-height:1.55; }
  .note b{ color:var(--ink); font-weight:600; }
  .col-status{ display:flex; flex-direction:column; gap:6px; align-items:flex-start; }
  .pill{
    display:inline-flex; align-items:center; gap:6px;
    font-size:11.5px; font-weight:600; padding:3px 9px 3px 7px; border-radius:100px;
    font-family:"IBM Plex Sans";
  }
  .pill .d{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .pill.done{ background:var(--done-soft); color:var(--done); }
  .pill.done .d{ background:var(--done); }
  .pill.partial{ background:var(--partial-soft); color:var(--partial); }
  .pill.partial .d{ background:var(--partial); }
  .pill.not-started{ background:var(--not-started-soft); color:var(--not-started); }
  .pill.not-started .d{ background:var(--not-started); }
  .exceeds{ font-size:10.5px; color:var(--ink-faint); font-family:"IBM Plex Mono"; }
  .col-prd{ font-size:12px; color:var(--ink-faint); line-height:1.5; }

  .subgroup-label{
    font-family:"IBM Plex Mono"; font-size:11px; letter-spacing:0.08em; text-transform:uppercase;
    color:var(--ink-faint); margin:26px 0 0; padding-top:18px; border-top:1px dashed var(--border-strong);
  }

  /* ---------- Bonus list ---------- */
  section.bonus{ margin-top:60px; }
  .bonus-head h2{ font-size:20px; font-weight:600; }
  .bonus-desc{ color:var(--ink-muted); font-size:13.5px; max-width:66ch; margin-top:6px; }
  .bonus-list{ margin-top:18px; display:flex; flex-direction:column; gap:0; border-top:1px solid var(--border); }
  .bitem{ display:grid; grid-template-columns:38px 1fr; gap:14px; padding:13px 4px; border-bottom:1px solid var(--border); }
  .bnum{
    font-family:"IBM Plex Mono"; font-size:12px; font-weight:600; color:var(--bonus);
    background:var(--bonus-soft); border-radius:6px; width:26px; height:26px;
    display:flex; align-items:center; justify-content:center;
  }
  .bitem p{ margin:0; font-size:13.5px; color:var(--ink); line-height:1.55; }

  footer.foot{
    margin-top:60px; padding-top:20px; border-top:1px solid var(--border);
    font-size:12px; color:var(--ink-faint); font-family:"IBM Plex Mono";
    display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;
  }
</style>

<div class="shell">
  <nav class="railwrap">
    <div class="rail" id="rail">
      <div class="rail-title">Modules</div>
"""

HTML_TAIL = """    </div>
  </main>
</div>

<script>
  (function(){
    var links = Array.prototype.slice.call(document.querySelectorAll('#rail a'));
    var sections = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
    function onScroll(){
      var pos = window.scrollY + 120;
      var current = 0;
      for(var i=0;i<sections.length;i++){
        if(sections[i] && sections[i].offsetTop <= pos) current = i;
      }
      links.forEach(function(a,i){ a.classList.toggle('active', i===current); });
    }
    document.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();
</script>

</body></html>"""

ROW_HEAD = (
    '        <div class="row row-head">\n'
    "          <span>#</span><span>Feature&nbsp;ID</span><span>Requirement &amp; Notes</span>"
    "<span>Status</span><span>PRD&nbsp;Reference</span>\n"
    "        </div>"
)


def esc(s: str) -> str:
    return html_lib.escape(s, quote=False)


def parse_feature_ids(raw: str) -> list[tuple[str, bool]]:
    raw = raw.strip()
    if raw.startswith("*(") and raw.endswith(")*"):
        return [(raw[2:-2].strip(), True)]
    return [(part.strip(), False) for part in raw.split(",")]


def status_pill(status: str) -> tuple[str, str, bool]:
    if status.startswith("Done"):
        return "done", "Done", "(exceeds spec)" in status
    if status == "Partial":
        return "partial", "Partial", False
    if status == "Not started":
        return "not-started", "Not started", False
    raise ValueError(f"Unrecognised status: {status!r}")


def render_html_row(row_num: int, r: dict) -> str:
    ids_html = "".join(
        f'<span class="idchip{" untagged" if untagged else ""}">{esc(text)}</span>'
        for text, untagged in parse_feature_ids(r["feature_id"])
    )
    note = r["client_note"] if r["status"] == "Partial" else ""
    if note:
        body = (
            "<div>\n"
            f'            <div class="req">{esc(r["requirement"])}</div>\n'
            f'            <div class="note">{esc(note)}</div>\n'
            "          </div>"
        )
    else:
        body = f'<div><div class="req">{esc(r["requirement"])}</div></div>'
    cls, label, exceeds = status_pill(r["status"])
    exceeds_html = '<span class="exceeds">exceeds spec</span>' if exceeds else ""
    return (
        '        <div class="row">\n'
        f'          <div class="rn">{row_num}</div>\n'
        f'          <div class="ids">{ids_html}</div>\n'
        f"          {body}\n"
        f'          <div class="col-status"><span class="pill {cls}"><span class="d"></span>{label}</span>{exceeds_html}</div>\n'
        f'          <div class="col-prd">{esc(r["prd_section"])}</div>\n'
        "        </div>"
    )


def group_sections(modules: list[tuple[str, list[dict]]]) -> list[dict]:
    """Merge each "Nb." module into the preceding "N." module as a subgroup
    (matches how 6b renders inside module 6's own <section> in the HTML)."""
    sections = []
    i = 0
    while i < len(modules):
        title, rows = modules[i]
        sub = None
        if i + 1 < len(modules) and re.match(r"\d+b\.", modules[i + 1][0]):
            sub = modules[i + 1]
            i += 2
        else:
            i += 1
        sections.append({"title": title, "rows": rows, "sub": sub})
    return sections


def render_tally_spans(rows: list[dict]) -> str:
    done = sum(1 for r in rows if r["status"].startswith("Done"))
    partial = sum(1 for r in rows if r["status"] == "Partial")
    not_started = sum(1 for r in rows if r["status"] == "Not started")
    spans = []
    if done:
        spans.append(f'<span><span class="swatch" style="background:var(--done)"></span>{done} done</span>')
    if partial:
        spans.append(f'<span><span class="swatch" style="background:var(--partial)"></span>{partial} partial</span>')
    if not_started:
        spans.append(
            f'<span><span class="swatch" style="background:var(--not-started)"></span>{not_started} not started</span>'
        )
    return "\n          ".join(spans)


def render_client_html(modules: list[tuple[str, list[dict]]], beyond_items: list[str]) -> str:
    done, partial, not_started = compute_tally(modules)
    total = done + partial + not_started
    strict_pct = round(done / total * 100, 1)
    half_credit_pct = round((done + partial * 0.5) / total * 100, 1)

    def x_pos(pct: float) -> int:
        return round(20 + pct / 100 * 860)

    strict_x, weighted_x = x_pos(strict_pct), x_pos(half_credit_pct)

    sections = group_sections(modules)

    nav_lines = []
    for s in sections:
        meta = HTML_MODULE_META[s["title"]]
        n = len(s["rows"]) + (len(s["sub"][1]) if s["sub"] else 0)
        anchor = f's{meta["idx"].lstrip("0")}'
        nav_lines.append(
            f'      <a href="#{anchor}" data-n="{meta["idx"].lstrip("0")}"><span>{meta["sidebar"]}</span>'
            f'<span class="n">{n}</span></a>'
        )
    nav_lines.append('      <a href="#bonus" data-n="+"><span>Beyond Contract</span><span class="n">'
                      f'{len(beyond_items)}</span></a>')

    body_parts = []
    row_num = 0
    for idx, s in enumerate(sections):
        meta = HTML_MODULE_META[s["title"]]
        anchor = f's{meta["idx"].lstrip("0")}'
        combined_rows = s["rows"] + (s["sub"][1] if s["sub"] else [])
        first_cls = ' class="mod"' if idx > 0 else ' class="mod"'
        body_parts.append(f'    <section{first_cls} id="{anchor}">')
        body_parts.append('      <div class="mod-head">')
        body_parts.append(f'        <h2><span class="idx">{meta["idx"]}</span> {meta["heading"]}</h2>')
        body_parts.append(f'        <div class="tally">\n          {render_tally_spans(combined_rows)}\n        </div>')
        body_parts.append("      </div>")
        body_parts.append(f'      <p class="mod-desc">{meta["desc"]}</p>')
        body_parts.append("")
        body_parts.append('      <div class="rows">')
        body_parts.append(ROW_HEAD)
        for r in s["rows"]:
            row_num += 1
            body_parts.append(render_html_row(row_num, r))
        body_parts.append("      </div>")
        if s["sub"]:
            sub_title, sub_rows = s["sub"]
            sub_label = "User Roles &amp; Access Control"
            body_parts.append(f'      <div class="subgroup-label">6b &middot; {sub_label}</div>')
            body_parts.append('      <div class="rows">')
            body_parts.append(ROW_HEAD)
            for r in sub_rows:
                row_num += 1
                body_parts.append(render_html_row(row_num, r))
            body_parts.append("      </div>")
        body_parts.append("    </section>")
        body_parts.append("")

    bonus_items_html = "\n".join(
        f'        <div class="bitem"><div class="bnum">{i}</div><p>{esc(item)}</p></div>'
        for i, item in enumerate(beyond_items, start=1)
    )

    header = f"""  </nav>

  <main>
    <header class="top">
      <div class="eyebrow"><span class="dot"></span>Cabio Sales OS &middot; Leadership Summary</div>
      <h1 class="title">Phase 1 Delivery Scorecard</h1>
      <p class="subtitle">A line-by-line check of every signed-off Phase&nbsp;1 requirement against what is actually built today &mdash; verified against the live database schema and the real backend/frontend code, not just documentation.</p>
      <div class="meta-line">SOURCE: Signed&#8209;Requirements&#8209;to&#8209;PRD&#8209;Traceability.md</div>

      <div class="vitals">
        <div class="stat-row">
          <div class="stat">
            <div class="num" style="color:var(--done)">{done}</div>
            <div class="lbl"><span class="swatch" style="background:var(--done)"></span>Done</div>
          </div>
          <div class="stat">
            <div class="num" style="color:var(--partial)">{partial}</div>
            <div class="lbl"><span class="swatch" style="background:var(--partial)"></span>Partly done</div>
          </div>
          <div class="stat">
            <div class="num" style="color:var(--not-started)">{not_started}</div>
            <div class="lbl"><span class="swatch" style="background:var(--not-started)"></span>Not started</div>
          </div>
          <div class="stat">
            <div class="num" style="color:var(--bonus)">{len(beyond_items)}</div>
            <div class="lbl"><span class="swatch" style="background:var(--bonus)"></span>New Features Added</div>
          </div>
        </div>

        <div class="traceblock">
          <div class="trace-caption">
            <span>Of <b>{total}</b> signed requirements &mdash; two honest reads of "done"</span>
            <span><b style="color:var(--ink)">{strict_pct}%</b> strict &nbsp;&middot;&nbsp; <b style="color:var(--accent)">{half_credit_pct}%</b> counting partial as half&#8209;credit</span>
          </div>
          <svg class="trace" viewBox="0 0 900 92" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Progress scale from 0 to 100 percent, marking {strict_pct} percent strict completion and {half_credit_pct} percent weighted completion">
            <line class="axis" x1="20" y1="54" x2="880" y2="54"/>
            <g class="tick">
              <line x1="20" y1="49" x2="20" y2="59"/>
              <line x1="235" y1="49" x2="235" y2="59"/>
              <line x1="450" y1="49" x2="450" y2="59"/>
              <line x1="665" y1="49" x2="665" y2="59"/>
              <line x1="880" y1="49" x2="880" y2="59"/>
            </g>
            <g class="lbl-soft" text-anchor="middle">
              <text x="20" y="76">0%</text>
              <text x="235" y="76">25%</text>
              <text x="450" y="76">50%</text>
              <text x="665" y="76">75%</text>
              <text x="880" y="76">100%</text>
            </g>
            <line x1="20" y1="54" x2="{strict_x}" y2="54" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" opacity="0.32"/>
            <circle class="mark-strict" cx="{strict_x}" cy="54" r="6"/>
            <text class="lbl-strong" x="{strict_x}" y="14" text-anchor="middle">{strict_pct}% strict</text>
            <circle class="mark-weighted" cx="{weighted_x}" cy="54" r="6"/>
            <text class="lbl-strong" x="{weighted_x}" y="30" text-anchor="middle" fill="var(--accent)">{half_credit_pct}% weighted</text>
            <line x1="{strict_x}" y1="54" x2="{weighted_x}" y2="54" stroke="var(--accent)" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </header>

"""

    bonus_section = f"""    <section class="bonus" id="bonus">
      <div class="bonus-head">
        <h2>Commitment beyond contract</h2>
        <p class="bonus-desc">{len(beyond_items)} things built that Cabio leadership never signed off on asking for.</p>
      </div>
      <div class="bonus-list">
{bonus_items_html}
      </div>
    </section>

    <footer class="foot">
      <span>Cabio Sales OS &middot; Phase 1 Delivery Scorecard</span>
      <span>{total} requirements &middot; {done} done &middot; {partial} partial &middot; {not_started} not started &middot; {len(beyond_items)} bonus</span>
    </footer>
"""

    return (
        HTML_HEAD
        + "\n".join(nav_lines)
        + "\n"
        + header
        + "\n".join(body_parts)
        + bonus_section
        + HTML_TAIL
    )


def main() -> None:
    check_mode = "--check" in sys.argv

    original_traceability_text = TRACEABILITY.read_text(encoding="utf-8")
    modules, beyond_items = parse_traceability()
    done, partial, not_started = compute_tally(modules)

    new_traceability_text = render_traceability_with_tally(
        original_traceability_text, done, partial, not_started
    )
    new_scorecard_text = render_scorecard(modules, beyond_items)
    new_html_text = render_client_html(modules, beyond_items)

    targets = [
        (TRACEABILITY, new_traceability_text),
        (SCORECARD, new_scorecard_text),
        (CLIENT_HTML, new_html_text),
    ]

    if check_mode:
        stale = [
            path.relative_to(ROOT)
            for path, new_text in targets
            if not path.exists() or path.read_text(encoding="utf-8") != new_text
        ]
        if stale:
            print("STALE — out of sync with the Traceability table:")
            for rel in stale:
                print(f"  - {rel}")
            print("Run `python scripts/generate_scorecard.py` (no --check) to fix.")
            sys.exit(1)
        print(f"OK — all files in sync ({done} Done, {partial} Partial, {not_started} Not started).")
        return

    TRACEABILITY.write_text(new_traceability_text, encoding="utf-8")
    SCORECARD.write_text(new_scorecard_text, encoding="utf-8")
    CLIENT_HTML.parent.mkdir(exist_ok=True)
    CLIENT_HTML.write_text(new_html_text, encoding="utf-8")
    print(f"Wrote {TRACEABILITY.relative_to(ROOT)}, {SCORECARD.relative_to(ROOT)}, and {CLIENT_HTML.relative_to(ROOT)}")
    print(f"Tally: {done} Done, {partial} Partial, {not_started} Not started, {len(beyond_items)} beyond-contract")
    print("Republish .scratch/phase1-scorecard.html to the Artifact to push this live.")


if __name__ == "__main__":
    main()
