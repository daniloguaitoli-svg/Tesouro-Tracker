# CLAUDE.md — Tesouro Tracker

Guidance for AI assistants working in this repository.

## What this is

A React + Vite PWA that tracks Brazilian government bonds (Tesouro Direto).

**Current scope: NTN-B / Tesouro IPCA+** — real yield, unit price (PU) and
**duration** per maturity, the real yield curve, and the macro frame (IPCA,
Selic, PTAX). The repo name is an umbrella on purpose: the owner intends to
widen it to Prefixado (LTN/NTN-F) and Selic (LFT). See **Widening the scope**
below before you start — the seams already exist, so don't restructure.

It mirrors the architecture of the sibling ETF / Cana / Soja / Café trackers.
Deployed on Vercel; pushes to `main` auto-deploy.

**The whole app is in Portuguese (pt-BR)** — UI copy, code comments,
identifiers, commit messages. Keep writing in Portuguese here. (This file is in
English only because it's assistant-facing.)

**Design voice:** "caderneta do Tesouro" — deep ink-navy with a cornflower-blue
accent, every number in tabular monospace.

## The point of this repo: the bridge

Beyond being an app, this repo is a **data bridge**. A scheduled Action reads
the Tesouro Direto CSV (tens of MB) and commits three small files:

```
dados/ntnb.json       today's snapshot with duration — machine-readable
dados/ntnb.md         the same as a table — human-readable
dados/historico.json  the daily series per maturity — what the app reads
```

Because the repo is **public**, these are readable via
`raw.githubusercontent.com` with no token. That is deliberate and load-bearing:
tools that cannot reach `tesourotransparente.gov.br` can reach the raw file.
**Do not make this repo private** without also telling the user the bridge stops
working anonymously.

Never hand-edit `dados/` — the bot owns it. Expect frequent
`github-actions[bot]` commits titled "Dados: coleta automatica das NTN-B".

## Stack and constraints

| | |
|---|---|
| Language | **Plain JavaScript (ESM)** + JSX. **No TypeScript** — do not add it. |
| UI | React 18, function components + hooks only. |
| Build | Vite 5 (`"type": "module"`) |
| Dependencies | **react + react-dom only.** No UI kit, no chart library, no CSV parser, no state manager. Charts are hand-rolled SVG (`Sparkline`, `AreaChart`, `CurvaChart`); CSV parsing is hand-rolled and streaming. Keep it that way unless asked. |
| Styling | One global stylesheet, `src/styles.css`. No CSS modules, no Tailwind. |
| Tests / lint | **No test runner, no ESLint, no Prettier** — don't invent an `npm test`. What exists is `npm run verificar` (`scripts/verificar.mjs`, dependency-free) plus `npm run build`; CI runs both on every PR. |
| Node | 18+ |
| Secrets | **None.** Every source is free and key-less. Don't add one without asking. |

`.npmrc` sets `legacy-peer-deps=true` so Vercel's strict install doesn't fail on
peer-dependency drift. Don't remove it.

## Commands

```bash
npm install
npm run dev        # Vite + the dev /api middleware; host exposed on the LAN
npm run build      # production build
npm run verificar  # loads server/ + asserts the invariants this file declares
npm run preview

node .github/scripts/coletar-tesouro.mjs --dry-run   # collect and report only
TESOURO_DESDE=2015-01-01 node .github/scripts/coletar-tesouro.mjs --dry-run
```

**Run both `build` and `verificar` — neither covers the other.** `vite build`
only bundles `src/`, so it never parses `server/`: a broken import, a column
regex that stopped matching, a catalogue slug inconsistent with its
tipo+vencimento, or a duplicated constant that drifted all pass the build and
fail at request time. `scripts/verificar.mjs` covers that half, and
`.github/workflows/ci.yml` runs both on every PR.

## Architecture

```
index.html            entry, fonts, PWA tags (lang="pt-BR")
src/
  main.jsx            mounts React + service worker (PROD only, auto-reload on update)
  App.jsx             frame: topbar (brand + IPCA 12m), 5 tabs, full-screen Detalhe
  api.js              the only data import for the UI — thin fetch wrappers over /api
  format.js           pt-BR formatting (num, taxa, pct, pp, anos, reais, dataBR, …)
  components/         Painel, Titulos, Curva, Calculadora, Alertas, Detalhe + widgets
  styles.css          design tokens at the top, then components
server/
  catalogo.js         labels/highlights for known maturities + the macro series
  util.js             pt-BR parsing, dates, and THE BOND MATH (cashflows, duration)
  datalayer.js        facade — combines cache + BCB, builds the /api payloads
  cache.js            reads the versioned dados/*.json (this is the request-time source)
  ponte.js            builds dados/ntnb.json + ntnb.md — pure functions, so verificar can test them
  providers/
    tesouro.js        Tesouro Transparente CSV — streaming, header-driven (collector only)
    anbima.js         free secondary-market file — enrichment, defensive
    bcb.js            IPCA, Selic, PTAX via SGS
api/                  Vercel functions: titulos, detalhe, curva, macro
dados/                the committed data (bot-owned) — see "the bridge" above
.github/
  workflows/coletar-tesouro.yml   scheduled collection + dry-run on claude/** push
  workflows/ci.yml                build + verificar on PRs
  scripts/coletar-tesouro.mjs     the collector itself
scripts/verificar.mjs
```

The five tabs in `App.jsx` are `Painel · Títulos · Curva · Calculadora ·
Alertas`, and `Detalhe` replaces the whole frame when a slug is selected.
`App.jsx` loads `getTitulos()` **once** and passes `dados` down to Painel /
Títulos / Calculadora / Alertas; `Curva` and `Detalhe` fetch their own
endpoints. So a new field on the `getTitulos` payload reaches four screens for
free.

### The one data path

The UI never fetches a source directly. `src/api.js` exposes four calls:

```
getTitulos()         -> { categorias, destaques, macro, desatualizados, pendente, aviso }
getDetalhe(slug, tf) -> { item, pontos, estatisticas, fluxos, notaHistorico }
getCurva()           -> { agora, umMesAtras, umAnoAtras }
getMacro()           -> IPCA / Selic / PTAX do BCB
```

Each maps to same-origin `/api/*`, served **twice from the same module**:

- **dev** — the `devApi()` middleware in `vite.config.js`
- **prod** — the Vercel functions in `api/*.js`

Both import `server/datalayer.js`. Change the payload shape there and both
follow. Adding a *new* endpoint means wiring **three** places: a `datalayer.js`
export, the `devApi()` middleware, and a new `api/<name>.js`. Forgetting the
last one means it works in dev and 404s in production — **`verificar.mjs`
enforces all three**, so a missing Vercel function fails CI rather than shipping.

### Division of labour (the load-bearing decision)

| | Reads | Why |
|---|---|---|
| **request time** | `dados/` + BCB | instant; a serverless function must never touch the big CSV |
| **scheduled job** | Tesouro CSV + ANBIMA | tens of MB, once a day, on a runner with no time limit |

The consequence: the rate is only as fresh as the last collection. That is why
every item carries its price date and a `desatualizado` flag — the app states
its lag rather than pretending to be live.

`server/cache.js` reads the data files **once, at module load**. That is right
for production — every collection is followed by a deploy, so a fresh process
always has fresh data. In dev it means: if you run the collector while
`npm run dev` is up, **restart the dev server** or you will keep seeing the old
snapshot (and, with the seed files, a permanent "aguardando coleta").

### The catalogue does NOT close the list

Unlike the sibling repos, `server/catalogo.js` is **not** the fixed list of what
appears on screen. The collector **discovers** every Tesouro IPCA+ maturity in
the official file and stores all of them. The catalogue only:

1. gives name and display order to known maturities;
2. marks `destaque: true` on the ones followed closely — those drive the bridge
   file's ⭐ and the panel's stale warning.

Why: the set of offered bonds changes with every auction. A hard-coded list
would go stale and hide real maturities. A maturity outside the catalogue shows
with a generic label — **never with invented data**.

The `ENTRADAS` list is **sourced, not guessed**: it is exactly the live IPCA+
maturities present in the official file on `CATALOGO_EM` (2026-08-21). Do not
invent entries. When the collector logs a maturity as "fora do catálogo", that
is the signal to add one. `verificar.mjs` fails if a `destaque` has matured and
warns if any other entry has.

### The bond math lives in `server/util.js`

This is the part where a bug means the app lies about risk, so it is checked by
identities rather than fixtures:

- `CUPOM_SEMESTRAL_NTNB = (1.06)^(1/2) − 1` ≈ 2.9563% — the NTN-B pays 6% a.a.
  in two compounded instalments, **not** 3% linear.
- `fluxosNTNB()` walks back from maturity in 6-month steps, which is what
  produces the real coupon dates (15/02 & 15/08, or 15/05 & 15/11).
- `calcularDuration()` returns Macaulay, modified, convexity and the ±1 p.p.
  price effect (`−D_mod·Δy + ½·C·Δy²`).

`verificar.mjs` asserts the invariants that must always hold: zero-coupon
duration **equals** the term; a coupon bond's is strictly shorter; modified =
Macaulay/(1+y); −1 p.p. gains more than +1 p.p. loses (convexity); a par bond
prices near 100; and missing rate → `null`, never 0.

**Convention:** calendar days/365. ANBIMA officially prices NTN-B on business
days/252. The difference is negligible for duration (a weighted ratio, where the
convention largely cancels) and is documented in the README as an approximation.
If you add a holiday calendar, update both the README and this section.

### Parsing is tolerant, and fails loudly

`providers/tesouro.js` detects the separator and finds columns by **regex on the
header**, not by position — so a reordered or slightly renamed column keeps
working. If an essential column disappears it **throws with the header it got**,
rather than silently reading the wrong number. Keep that property.

The same principle governs `providers/anbima.js`. **Confirmed on 2026-08-21 by a
real collection run: the historic path `/informacoes/merc-sec/arqs/ms{ddmmyy}.txt`
returns 404** — ANBIMA's public-bond tooling moved to the ANBIMA Data platform
(`data.anbima.com.br`). No replacement URL was guessed. The URL is a template
overridable by `ANBIMA_MS_URL` (marker `{ddmmyy}`), so pointing it at the right
endpoint is a workflow env change, not a code change. The parser returns
`{ ok: false, amostra }` with the start of the file instead of guessing, and the
collector logs that sample — one run confirms the format of any new URL. **The
app works entirely without this source; it is enrichment, never a requirement.**

### Already-matured bonds are excluded

The Tesouro file keeps bonds long after they mature. Their last published rate is
computed over a term approaching zero, which yields nonsense — the first real
collection returned an NTN-B 2026 at **13.32%** and a 2019 at **−0.94%**, plus a
row with `PU 0,00`. So:

- `server/ponte.js` `montarTitulos()` drops `vencimento <= hoje` — nothing
  matured reaches `dados/ntnb.json`, which an external tool reads as truth.
- `datalayer.getTitulos()` filters them out of the screens.
- They stay in `dados/historico.json` (that is where they have value) and
  `/api/detalhe` still opens them by slug.
- `providers/tesouro.js` maps a PU of `0` or less to `null` — zero is an empty
  field, not a price.

`verificar.mjs` guards all of it.

### Constants duplicated on purpose

`server/` and `src/` never import from each other — the client only ever sees
JSON from `/api`. So a few values are hand-copied across that line and **must be
changed in both places**:

| Value | Server | Client |
|---|---|---|
| `CUPOM_SEMESTRAL_NTNB` | `server/util.js` | `src/components/Calculadora.jsx` |
| periodicity labels | `ROTULO_PERIODICIDADE` in `server/util.js` | `PERIODICIDADE` in `src/format.js` |

`verificar.mjs` compares both sides.

## Widening the scope

The owner named the repo `Tesouro-Tracker` (not `ntnb-tracker`) specifically to
add other Tesouro Direto families later. The architecture already anticipates
it — **extend, don't restructure**:

1. **`server/util.js` → `classificarTitulo()`** returns `null` for anything that
   isn't IPCA+. Teach it "Tesouro Prefixado" (LTN), "Tesouro Prefixado com Juros
   Semestrais" (NTN-F) and "Tesouro Selic" (LFT), returning new `tipo`s. Slugs
   are already tipo-prefixed, so `prefixado-2031-01-01` slots in without
   colliding and without orphaning existing history.
2. **`server/catalogo.js` → `CATEGORIAS`** gains one entry per family. Maturities
   stay *discovered* from the file; the catalogue only labels.
3. **The maths.** LTN and NTN-F are the same discounting with a different
   cashflow (LTN is zero-coupon on a face of 1,000; NTN-F pays a 10% a.a.
   coupon). Generalise `fluxosNTNB()` rather than copying it — but **LFT is a
   different instrument**: post-fixed, duration effectively zero, and its
   "taxa" is a spread over Selic, **not** a real rate. Do not force the NTN-B
   ruler onto it, and do not display it in the real-yield curve.
4. **Bridge files.** `dados/ntnb.json` keeps its name and shape — an external
   consumer already reads that URL. A new family gets a sibling file
   (`dados/prefixado.json`), never a breaking change to this one.
5. **The `taxa` label is real-yield-specific.** `src/format.js` `taxa()` and the
   copy around it say "acima do IPCA". That is correct for NTN-B and wrong for
   everything else — make the label follow the family before shipping a second
   one.

The collector, the tolerant parser, the versioned cache, the macro frame and the
screens need no structural change for any of this.

## Conventions

- **Portuguese everywhere** — identifiers (`carregar`, `pontos`,
  `desatualizado`, `vivo`), UI copy, and comments. Don't mix in English names.
  The one exception is `dados/*.json`, which is an interchange format: dot
  decimals and ISO dates, documented in the README.
- **Comments explain *why*.** Every module opens with a header comment stating
  its job and the reasoning behind non-obvious choices (why the collector
  exists, why `createRequire` and not `readFile`, why parsing is tolerant).
  Match that density — it's the house style.
- **Numbers go through `src/format.js`** (`num`, `taxa`, `reais`, `pct`, `pp`,
  `anos`, `dataBR`, …) and render with the `mono` class. Note `pct` vs `pp`:
  **prices** move in percent, **rates** move in percentage points. Mixing them
  is a real error, not a style nit.
- **Rate direction is inverted for colour.** Rate up = price down. `sinalTaxa()`
  exists for that; the sparkline takes `inverter`.
- **Design tokens only** — the custom properties at the top of `src/styles.css`.
  No hard-coded hexes or pixel gaps in components.
  - surfaces `--bg` `--surface` `--surface-2` `--line`
  - text `--text` `--muted`
  - semantics `--up` `--down` `--accent` `--accent-2`
  - type `--display` (Space Grotesk) `--ui` (Inter) `--mono` (IBM Plex Mono)
  - layout `--s1`…`--s7` (4→48px) `--radius` `--maxw`
- **Loading / error / empty states** come from `components/States.jsx`
  (`Loading`, `Skeletons`, `ErroBox`, `Vazio`, `AguardandoColeta`). Extend those
  rather than hand-rolling. `AguardandoColeta` is the pre-first-collection state
  — the repo ships with empty seed data files on purpose.
- **Server does the maths; components display.** Duration, convexity, coupon
  yield on price, staleness and statistics belong in `server/`. The one
  deliberate exception is the Calculadora's live client-side arithmetic, which
  only multiplies numbers the server already computed.
- **Missing data is `null`, rendered as `—`.** Never substitute 0 or a guess.
- Effects that set state use a local `vivo` flag to avoid updating an unmounted
  component.

## Honest-caveats rule

The README lists real limitations: at least one business day of lag; days/365
instead of the official days/252; duration+convexity is a second-order
approximation, not a repricing; "compra"/"venda" are from the Treasury's point
of view; everything is gross of tax and custody fees; terminal values are in
today's purchasing power. Every screen carries the footer disclaimer: public
sources, delayed, informational only — **not investment advice**. If you add a
feature with a similar caveat, state it in the UI and the README instead of
implying more precision than free data supports.

## Deployment notes

- `api/*.js` are Vercel functions: `export default async function handler(req, res)`,
  params off `req.query`, 400 on a missing param, 404 when the slug is unknown,
  502 on upstream failure. Keep them thin. `titulos`, `detalhe` and `curva` use
  `s-maxage=1800, stale-while-revalidate=7200` (the base changes twice a day);
  `macro` uses `s-maxage=3600, stale-while-revalidate=21600`.
- `server/cache.js` loads the JSON via `createRequire` **on purpose** — a static
  require makes Vercel's file tracer bundle the JSON into the function. Don't
  "modernise" it to `readFile`, or the function ships without its data.
- The service worker (`public/sw.js`) is **network-first for navigation**,
  **cache-first for hashed `/assets/*`**, and never caches `/api/*`. `CACHE` is
  the version string to bump (`"ntnb-tracker-v1"`); `SHELL` is the precached
  list. (Same naming as Cana-Tracker, inverse of ETF Tracker.)
- `src/main.jsx` registers that worker in production, checks hourly, and reloads
  **once** when a new version installs over an existing controller.
- Alerts live per device in `localStorage` under `ntnb-tracker-alertas`, read and
  written directly in `components/Alertas.jsx` (no store module). Keep user
  positions out of the repo — it is public.
- A broken change fails the Vercel build and the previous deploy stays live;
  `npm run build` locally is still the right pre-push check.

## Git

- Develop on the branch you were given; commit with clear pt-BR messages; push
  with `git push -u origin <branch>`.
- Don't open a PR unless the user asks.
- Expect automated `github-actions[bot]` commits touching `dados/` — rebase/pull
  before pushing rather than fighting them, and don't hand-edit those files.
