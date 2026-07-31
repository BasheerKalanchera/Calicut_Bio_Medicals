# PWA Mobile Install Setup — Cabio Staff Phone (via ngrok)

**Goal:** make `sales-os-app` installable as a PWA on a staff member's phone, served
from a `npm run preview` production build on the dev machine and exposed to the
phone over ngrok's public HTTPS URL.

**Status as of 2026-07-31:** icon generation done; config edits and runtime steps
pending.

---

## Phase 1 — Diagnosis (done)

- [x] Confirmed `vite-plugin-pwa` was already installed and configured in
      `vite.config.ts` (manifest, `registerType: 'autoUpdate'`) from an earlier
      commit (`126ae6f`)
- [x] Confirmed dev server already LAN-reachable (`server.host: true`,
      `server.allowedHosts: true`) with a `/api` → `localhost:8000` proxy
- [x] Identified that installing over plain `http://<LAN-IP>` would not work on
      Android — Chrome's install prompt requires a secure context (HTTPS or
      `localhost`), which a bare LAN IP does not satisfy
- [x] Identified that `src/lib/api.ts` hardcoded the API base URL fallback to
      `http://localhost:8000/api/v1` — fatal for phone access on its own, since
      `localhost` on the phone resolves to the phone itself, not the dev machine
- [x] Identified backend `CORS_ORIGINS` defaults to `["http://localhost:5173"]`
      only, with no override in `backend/.env` — avoided entirely by keeping all
      traffic same-origin through one proxied URL instead of touching CORS
- [x] Confirmed ngrok 3.37.3 already installed on the dev machine
- [x] Decided on `vite preview` (built production bundle) as the server ngrok
      tunnels to, rather than `vite dev` — represents the real shipped artifact,
      including the real generated service worker (dev-mode SW registration is
      off by default and would need `devOptions.enabled: true` to fake it)
- [x] Identified that ngrok's forwarded hostname will otherwise hit Vite's
      DNS-rebind protection ("Blocked request. This host is not allowed") unless
      `preview.allowedHosts` is set, mirroring the existing `server.allowedHosts`
- [x] Decided icon source: the full `Cabio logo.jpeg` (wordmark + mark), not the
      abstract `favicon.svg` mark — accepted tradeoff that the wordmark will be
      illegible at actual home-screen icon size (~48–72px), reading as just the
      blue droplet mark at that size
- [x] Decided to generate 3 icon files: `icon-192.png` (home-screen icon),
      `icon-512.png` (install splash screen / high-density displays), and
      `icon-512-maskable.png` (Android adaptive icon shapes)

## Phase 2 — Icon generation (done)

- [x] Generated `sales-os-app/public/icon-192.png` — Lanczos-upscaled from the
      227×222px source, centered on white, not stretched
- [x] Generated `sales-os-app/public/icon-512.png` — same treatment
- [x] Generated `sales-os-app/public/icon-512-maskable.png` — logo scaled to
      ~62.5% of canvas width, centered on white, safely inside Android's
      maskable safe zone
- [x] Visually verified all three — clean, no visible blur or stretching

## Phase 3 — File edits (done)

- [x] `sales-os-app/vite.config.ts`
  - [x] Add `preview: { allowedHosts: true, proxy: { '/api': 'http://localhost:8000' } }`
  - [x] Update manifest `icons` array to reference `/icon-192.png`,
        `/icon-512.png` (purpose `any`), and `/icon-512-maskable.png`
        (purpose `maskable`) — replacing the current low-res
        `Cabio logo.jpeg` entries
  - [x] Add `id: '/'`, `start_url: '/'`, `scope: '/'` to the manifest
  - [x] Fix `includeAssets` to list the real files:
        `['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png']`
- [x] `sales-os-app/src/lib/api.ts`
  - [x] Change baseURL fallback from `http://localhost:8000/api/v1` to
        relative `/api/v1`, so requests ride the new preview proxy instead of
        pointing at the phone's own `localhost`
- [x] `sales-os-app/index.html`
  - [x] Add `<meta name="theme-color" content="#ffffff">`
  - [x] Point `apple-touch-icon` at `/icon-192.png` instead of
        `/Cabio logo.jpeg`

## Phase 4 — Build and tunnel (done)

- [x] Start backend: `uvicorn` on port 8000 as usual (stays on localhost, no
      LAN/firewall exposure needed since ngrok and the preview server are on
      the same machine)
- [x] `npm run build` (from `sales-os-app/`)
- [x] `npm run preview` (binds to `localhost:4173`)
- [x] `ngrok http 4173`
- [x] Copy the `https://*.ngrok-free.app` URL it prints — verified `/` (200)
      and `/api/v1/health` (200, proxied through to the backend) both resolve
      through the tunnel

**Tonight's URL:** `https://045d-223-188-164-22.ngrok-free.app`
(random free-tier subdomain — changed once already today after the
background processes got killed and had to be restarted; re-share again if
that happens before 7:30pm)

## Phase 5 — Install and verify on phone (pending)

- [ ] Open the ngrok HTTPS URL on the phone (same URL works for both platforms)
- [ ] **Android (Chrome):** confirm "Install app" appears; install; confirm it
      launches standalone (no address bar) from the app drawer
- [ ] **iPhone (Safari):** Share → Add to Home Screen → Add; confirm it launches
      standalone from the Home Screen
- [ ] Confirm data loads end-to-end (Customer 360, Opportunities, etc.) — this
      validates the `/api` proxy fix from Phase 3
- [ ] Login / Logout
- [ ] Customer Directory
- [ ] Customer 360
- [ ] Opportunity Management
- [ ] Products
- [ ] Projects
- [ ] Search
- [ ] Forms
- [ ] Navigation Drawer
- [ ] Responsive layout — portrait and landscape
- [ ] Icon appears correctly on the home screen
- [ ] Splash screen displays correctly on launch

---

## Notes for next time

- ngrok's free-tier URL is random and changes every time the tunnel restarts —
  re-share the new URL with staff each session, or upgrade to a reserved
  domain if this becomes a recurring workflow rather than a one-off test.
- Every code change requires re-running `npm run build` + restarting
  `npm run preview` (no hot reload) — slower iteration loop than `vite dev`,
  traded deliberately for testing the real production artifact.
- If backend CORS ever needs to allow a *different* origin directly (bypassing
  the proxy), update `CORS_ORIGINS` in `backend/.env` — not required for this
  ngrok setup since everything stays same-origin.
