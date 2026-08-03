# Active Progress — Cabio Sales OS
_Session: 2026-08-01, continued 2026-08-02_

## Current task — STOP HERE FIRST

**UAT is fully ready for tonight's Cabio Star Sales team orientation**
(Google Meet + WhatsApp for URL/credentials/setup doc). Everything below is
done — full detail for any of it lives in `docs/Progress-Archive-2026-08.md`,
not repeated here:

- Keep-alive monitor (UptimeRobot), UAT-wide RLS lockout bug found and
  fixed, 7-person roster created and every login verified end-to-end.
- 11 real accounts + 26-product catalog loaded from Dev (junk filtered,
  2 bad parent-account links fixed). Opportunities deliberately left
  empty — manual live entry by the team was already the plan, so tonight
  doubles as that first live-entry session and the first real RLS
  proof-out.
- `docs/PWA-UAT-MobileLaptop-Setup.md` written (replaces the old
  ngrok-based install doc) + converted to `docs/PWA-UAT-MobileLaptop-Setup.pdf`
  for the actual WhatsApp send — covers Laptop, Android, iPhone, with the
  in-app-browser gotcha called out since that's the actual delivery path.

**Immediate next step:** tonight's orientation session itself.

**After that:** revisit the Critical Care/Imaging manager hierarchy
build-out (see "Also still open" below) once the team's actually used UAT
and any issues from tonight are triaged.

**Uncommitted right now:** `active_progress.md` (this file),
`docs/Deployment-Topology.md`, `docs/Progress-Archive-2026-08.md`,
`docs/PWA-UAT-MobileLaptop-Setup.md`, `docs/PWA-UAT-MobileLaptop-Setup.pdf`
— not yet committed.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. The "create Supabase Auth accounts" blocker this was waiting on is
resolved for Dev, but this item concerns the UAT/Prod rollout more broadly —
revisit once UAT is fully proven out per the current task above.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only `type="date"`
fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.tsx`, and 2 more
in `ProjectDirectoryScreen.jsx` (entangled with that file's own pending MUI
migration). Pick up only if Basheer decides to extend scope.
