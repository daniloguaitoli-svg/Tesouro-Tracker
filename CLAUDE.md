# CLAUDE.md — Tesouro Tracker

Guidance for AI assistants working in this repository.

## What this is

A React + Vite PWA that tracks Brazilian government bonds (Tesouro Direto).

**Scope: the three classic Tesouro Direto families** — IPCA+ (NTN-B, both
kinds), Prefixado (LTN/NTN-F) and Selic (LFT) — plus monetary-policy decisions
(Copom, Fed, ECB), PTAX FX, CDI × Selic and market headlines by region.
RendA+/Educa+ are excluded on purpose (monthly amortisation needs a different
ruler). See **Family semantics** below — the three families do NOT share rate
semantics, and mixing them up is the main way to break this app.

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
dados/ntnb.json       NTN-B snapshot with duration — machine-readable (frozen shape)
dados/ntnb.md         the same as a table — human-readable
dados/prefixado.json  LTN + NTN-F snapshot — NOMINAL rates
dados/selic.json      LFT snapshot — spread over Selic, duration null
dados/global.json     Fed + ECB policy rates, last decision (collector-written)
dados/painel.json     the Painel tab as one object: highlights + macro frame (the file
                      external consumers read — see INSTRUCOES-ASSISTENTE.md)
dados/painel.md       the same, as tables
dados/historico.json  the daily series per maturity, all families — what the app reads
```

`ntnb.json` keeps its original shape forever; each family got a **sibling**
file. Never widen an existing bridge file's meaning — add a sibling.

Because the repo is **public**, these are readable via
`raw.githubusercontent.com` with no token. That is deliberate and load-bearing:
tools that cannot reach `tesourotransparente.gov.br` can reach the raw file.
**Do not make this repo private** without also telling the user the bridge stops
working anonymously.

The collector writes on the repository's **default branch**, whatever it is
called — the workflow compares `github.ref` against
`github.event.repository.default_branch` rather than hardcoding `main`. Do not
"simplify" that back to `refs/heads/main`: this repo's default branch has not
always been named `main`, and a hardcoded name makes the job run, succeed, and
silently never commit. The raw URLs in the README do assume `main`, so keep the
two in step if the default branch is ever renamed.

`dados/painel.json` exists because the Painel's macro frame (IPCA, Ibovespa, FX,
CDI, Selic) used to be **request-time only** — it lived in no committed file, so
anything reading the bridge saw the bonds and none of the frame. The collector
now calls `getMacro()` and versions the result. It reuses `getMacro()` on purpose
so the bridge shows exactly the numbers the app shows, rather than a second
calculation that can drift.

Its `acompanhados` list is the **catalogue** `destaque` set, not the user's
stars — those live in `localStorage` and the server cannot know them. The file
says so in `sobreAcompanhados`; keep that honest if you change the shape.

The catalogue's `destaque` flags are therefore a **hand-kept copy** of what the
owner actually stars on their phone, last reconciled on 2026-08-22 against a
screenshot of the Painel: IPCA+ 2032 and IPCA+ 2035 (both zero-coupon),
Prefixado 2029 (LTN) and Selic 2031. If the user says their selection changed,
update `ENTRADAS` — otherwise the bridge quietly tells the assistant a different
story from the one on screen. Don't pin a check to a specific starred slug;
`verificar.mjs` asserts the relationship, not the membership, for this reason.

Never hand-edit `dados/` — the bot owns it. Expect frequent
`github-actions[bot]` commits titled "Dados: coleta automatica das NTN-B".

## Stack and constraints

| | |
|---|---|
| Language | **Plain JavaScript (ESM)** + JSX. **No TypeScript** — do not add it. |
| UI | React 18, function components + hooks only. |
| Build | Vite 5 (`"type": "module"`) |
| Dependencies | **react + react-dom only** at runtime. No UI kit, no chart library, no CSV parser, no state manager. Charts are hand-rolled SVG (`Sparkline`, `AreaChart`, `CurvaChart`); CSV parsing is hand-rolled and streaming. Keep it that way unless asked. In devDependencies there is one addition beyond vite: **jsdom**, used only by `scripts/fumaca.mjs` — nothing in `src/` or `server/` may import it. It is **pinned to `^26`, and that pin is load-bearing**: jsdom 27+ requires Node ≥20.19 and jsdom 30 requires Node ≥22.22, while this project (and the CI runner) is on Node 18+/20. Upgrading it makes `npm run fumaca` die on the runner with `webidl.util.markAsUncloneable is not a function` — from the bundled `undici`, not from any code here. jsdom 26 declares `engines.node: ">=18"` and does not depend on undici at all. |
| Styling | One global stylesheet, `src/styles.css`. No CSS modules, no Tailwind. |
| Tests / lint | **No test runner, no ESLint, no Prettier** — don't invent an `npm test`. What exists is three plain scripts: `npm run build`, `npm run verificar` (`scripts/verificar.mjs`, dependency-free) and `npm run fumaca` (`scripts/fumaca.mjs`, mounts the app in jsdom). CI runs all three on every PR. |
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
npm run fumaca     # mounts the app in a DOM and opens every tab
npm run preview

node .github/scripts/coletar-tesouro.mjs --dry-run   # collect and report only
TESOURO_DESDE=2015-01-01 node .github/scripts/coletar-tesouro.mjs --dry-run
```

**Run all three — no two of them overlap.** `vite build` only bundles `src/`,
so it never parses `server/`: a broken import, a column regex that stopped
matching, a catalogue slug inconsistent with its tipo+vencimento, or a
duplicated constant that drifted all pass the build and fail at request time.
`scripts/verificar.mjs` covers that half.

Neither of those **renders a component**. The build packages code that throws
the moment it runs, and `verificar` never looks at `src/components/`. That gap
shipped a real bug: on 22/08/2026 the `useState("real")` declaration of
`familiaId` vanished from `Curva.jsx` while the JSX kept using it, so the Curva
tab died with a `ReferenceError` as soon as anyone opened it — build green,
verificar green, production broken.

`scripts/fumaca.mjs` closes that third gap. It mounts the real `App` in a jsdom
DOM, serves `/api` from the real `server/datalayer.js`, and clicks through every
tab. **Mounting with data is the load-bearing part**: that bug sat *after* the
`if (!dados) return <Skeletons/>` guard, so rendering without data stops short
of it, and server-side rendering never runs `useEffect` at all — the state would
stay `null` either way. Only a real DOM with populated responses executes the
body of the component.

If you add a tab to `TABS` in `App.jsx`, add its label to `ABAS_ESPERADAS` in
`scripts/fumaca.mjs` — otherwise the new screen has no coverage at all.

`.github/workflows/ci.yml` runs all three on every PR.

## Architecture

```
index.html            entry, fonts, PWA tags (lang="pt-BR")
src/
  main.jsx            mounts React + service worker (PROD only, auto-reload on update)
  App.jsx             frame: topbar (brand + IPCA 12m), 5 tabs, full-screen Detalhe
  api.js              the only data import for the UI — thin fetch wrappers over /api
  format.js           pt-BR formatting (num, taxa, pct, pp, anos, reais, dataBR, …)
  destaques.js        which maturities the user follows (localStorage, per device)
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
    bcb.js            IPCA, Selic, CDI, PTAX via SGS
    globais.js        Fed (FRED csv) + ECB (Data Portal csv) — collector only
    noticias.js       Google News RSS per region — request-time, best-effort
    yahoo.js          Ibovespa (^BVSP) chart API — request-time, best-effort
api/                  Vercel functions: titulos, detalhe, curva, macro, mercado, noticias
dados/                the committed data (bot-owned) — see "the bridge" above
.github/
  workflows/coletar-tesouro.yml   scheduled collection + dry-run on claude/** push
  workflows/ci.yml                build + verificar + fumaça on PRs
  scripts/coletar-tesouro.mjs     the collector itself
scripts/verificar.mjs           invariantes do server/ (sem dependência)
scripts/fumaca.mjs              monta o app num DOM e abre cada aba (jsdom)
```

The Painel's **Moldura** renders its six cards in a fixed order — IPCA |
Ibovespa, EUR/BRL | USD/BRL, CDI | Selic — inside a single `.grid-2`, so the
card order *is* the row pairing. Ibovespa and both FX pairs show **12-month and
1-week variation**; Ibovespa leads with the 12-month figure instead of the index
level (171.032 points says nothing without a reference). Those windows come from
`variacaoPeriodo()` in `server/util.js` and are computed **before** the
`slice(-120)` that trims the payload — 120 daily points is ~6 months, so
computing them after the trim silently yields `null` for the 12-month figure.
It returns `null` (rendered `—`) when the series doesn't reach back far enough,
rather than comparing against the oldest point available and calling that a
year. Yahoo therefore fetches `range=2y`, not `1y`. They render **unconditionally**, showing "—"
when a source is down: a card that disappears reflows the grid and breaks the
pairing. Below 460px the grid collapses to one column and it becomes a list in
the same order — expected, not a regression.

The seven tabs in `App.jsx` are `Painel · Títulos · Curva · Mercado ·
Calculadora · Notícias · Alertas`, and `Detalhe` replaces the whole frame when
a slug is selected.
`App.jsx` loads `getTitulos()` **once** and passes `dados` down to Painel /
Títulos / Calculadora / Alertas; `Curva` and `Detalhe` fetch their own
endpoints. So a new field on the `getTitulos` payload reaches four screens for
free.

### The one data path

The UI never fetches a source directly. `src/api.js` exposes four calls:

```
getTitulos()         -> { categorias, destaques, macro, desatualizados, pendente, aviso }
getDetalhe(slug, tf) -> { item, pontos, estatisticas, fluxos, notaHistorico }
getCurva()           -> { curvas: [real, prefixada], implicita, ... }  (LFT fica fora)
getMacro()           -> IPCA / Selic / CDI / PTAX do BCB (+ decisão do Copom)
getMercado()         -> decisões Copom/Fed/BCE + câmbio + CDI × Selic
getNoticias()        -> manchetes por região (best-effort)
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

### The curve has two rules of its own

**`PRAZO_MINIMO_CURVA = 1.5` years.** A bond near maturity has an exploding
annualised rate — small PU noise becomes percentage points as the term goes to
zero. Measured across the whole history, as each point's absolute deviation from
its own curve's belly (3–6y) **on the same date**: IPCA+ deviates 1.88pp at 1.00y,
1.11pp at 1.25y, then **0.38pp at 1.50y** and stays there; Prefixado's p90 falls
from 3.43pp at 0.75y to ~1.8pp from 1.00y on. Below the floor the point describes
the maturity arriving, not the curve. Real readings that were being plotted: a
−3.12% "real rate" and a 12.99% one, both from bonds days from maturity.

**A past curve is built from the bonds alive THEN, not the ones alive today.**
`curvaEm(dataISO)` filters `vencimento > dataISO` over the full history, matured
bonds included. Building it from today's survivors deletes exactly the maturities
that have since expired, so the short end silently shifts right by the lookback
window — the one-year-ago real curve started at 3.67y against today's 2.67y, and
a reader comparing the two was reading the crop, not the market. `verificar.mjs`
asserts both rules.

(The real curve's short end still sits at 3.67y a year ago, and that one is
honest: the only shorter IPCA+ then were the 2026s at 0.92y, below the floor.
There was a genuine gap in the NTN-B offering.)

### The duration axis

Each curve point carries `duration` (Macaulay, years) and `comCupom`, and the
Curva screen toggles the x-axis between term and duration. Two things make it
honest, and `verificar.mjs` asserts both:

- **Duration is computed at that curve's own date, with that day's rate** — not
  today's. Duration shortens as time passes and moves with the rate level;
  reusing today's value would shift the whole historical line along the axis,
  which is the very thing being compared.
- **`CurvaChart` re-sorts by whichever field it plots.** Switching axes reorders
  the bonds — an NTN-B 2060 with coupons (d≈13.4y) sits *left* of a 2040
  zero-coupon (d≈13.9y) — and drawing the polyline in the old order makes the
  line double back on itself.

Why it earns its place: on the term axis, every coupon bond from 2030 to 2060
spreads across 34 years; on the duration axis they all fall between ~3.5y and
~13.4y. Buying term is not buying interest-rate risk in the same proportion, and
the term axis hides that completely.

### One polyline per family

Zero-coupon and coupon bonds do **not** lie on one curve, on either axis, and
the chart no longer pretends they do: `separarFamilias()` splits every series
into two polylines before drawing.

The old single line was not merely imprecise, it was drawing an artefact. Five
NTN-B maturities (2032, 2035, 2040, 2045, 2050) exist in **both** forms — same
date, different rates — so at those terms the polyline jumped vertically at a
constant x and came back. That zigzag was the line stitching two curves
together, not the shape of the market. Seven such terms exist across the two
families today; `verificar.mjs` asserts at least one still does, because if that
ever stops being true the reason for the split has gone with it.

Split, both lines are smooth and the **gap between them** becomes the readable
quantity: on the long end the coupon bond yields a consistent ~0.07 p.p. more
(13.9y: 7.45% vs 7.37%; 18.7y: 7.44% vs 7.37%; 23.9y: 7.43% vs 7.36%).

Two details are load-bearing, both checked:

- **Markers come from the full point list, not from the groups.** A family with
  a single point draws no line — but its marker must still appear, or the bond
  vanishes from the chart entirely.
- **Every curve point carries `comCupom` as a boolean.** Without it the splitter
  silently lumps everything into one group and the stitching comes back with no
  visible failure.

Point shape encodes the family (filled = zero-coupon, ring = coupon) and size
encodes ⭐. The filled dot's radius is 2.6 against a 2px line: at the old
radius 2 the disc disappeared into the line it sat on. The implied-inflation
chart has no families — its points are derived from both sides and carry no
`comCupom` — so `separarFamilias` returns it untouched and the legend drops the
shape entries.

### The legend draws the real line

`CurvaLegenda` (in `CurvaChart.jsx`) renders **from the same `series` array the
chart draws**, reusing the exported `TRACEJADO` constant, so a swatch cannot
drift from its line. It used to be three hand-written `<span><i>` swatches in
`Curva.jsx`: solid 14×3px rectangles differing only in colour, which meant the
one-year-ago line was **dashed in the chart and solid in the legend** — on a
phone, `--muted` versus `--accent-2` in a 14px bar is not a distinction anyone
can make. Each series therefore carries a `rotulo`; add a curve and its legend
entry comes with it.

The ⭐ marker is in the legend too (a bigger dot **on** today's line, which is
exactly how it renders), and only when a point on screen actually has it —
explaining an absent marker is noise.

**The dash pattern is NOT shared, and that is the point.** A round linecap
extends every dash by `strokeWidth/2` at each end, so it eats a whole
`strokeWidth` out of the declared gap. The chart draws at 1.4px, where `"4 3"`
leaves a 1.6px gap you can see; the legend draws thicker (2.4px) so it reads on
a phone, and the same `"4 3"` left **0.6px** — a solid bar to the naked eye, the
very defect the legend rewrite was meant to fix. So the legend uses a butt cap,
where the declared gap *is* the visible gap, and `TRACEJADO_LEGENDA = "6 5"`,
which divides the 28px swatch into exactly three full dashes.

`verificar.mjs` computes the **visible** gap on both sides
(`vão = gap − strokeWidth` for a round cap, `gap` for a butt cap) and requires
≥ 1.5px, plus a swatch wide enough for ≥ 2.5 dashes. Don't "unify" the two
constants — that is exactly the regression the check exists for. It also asserts
no `className="legenda"` is left in `Curva.jsx` and that every series entry
carries a `rotulo`.

### Implied inflation (`implicita`)

Derived from the two curves, never fetched: `(1+nominal)/(1+real) − 1`, the
Fisher relation and **not** the subtraction — at 14.33% nominal against 7.57%
real, subtracting gives 6.76% and the right answer is 6.29%, and that number is
the one deciding between IPCA+ and Prefixado.

LTN/NTN-F mature on 01/01 and NTN-B on 15/05 or 15/08, so no pair lines up: the
real curve is **interpolated** at each nominal point's term, and only inside the
observed range — `interporTaxa()` returns `null` rather than extrapolating.
Nominal points sharing a term are averaged first, so the derived curve doesn't
inherit the sawtooth of mixing two instruments.

It is **not an inflation forecast** — it carries an inflation risk premium and a
liquidity difference, so it sits above true expectations. The UI says so; keep
it saying so.

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

### The download retries; the parse does not

`varrerSerie()` retries the **connection** up to 4 times with backoff (2s, 4s,
8s) before giving up. Reason: `tesourotransparente.gov.br` intermittently
refuses connections, and without a retry one `UND_ERR_CONNECT_TIMEOUT` failed
the whole job with exit 1 — which emails the repo owner about a network hiccup
that fixes itself. It happened on most days between 29/08 and 02/09/2026, and
a later run in the same day always succeeded, so no data was ever lost — only
noise was produced.

Two boundaries are deliberate: a **4xx is not retried** (if the resource moved,
more attempts only delay the error that needs to surface), and the retry covers
only the connection — once the body starts streaming, a reopen would duplicate
points.

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
| `CUPOM_SEMESTRAL_NTNF` | `server/util.js` | `src/components/Calculadora.jsx` |
| periodicity labels | `ROTULO_PERIODICIDADE` in `server/util.js` | `PERIODICIDADE` in `src/format.js` |

`verificar.mjs` compares both sides.

## Who chooses the Painel's "Acompanhados de perto"

**The user does**, via the star on each row of the Títulos tab. The choice is
per-device (`localStorage`, see `src/destaques.js`) and never leaves the
browser.

The state lives in `App.jsx`, not in a screen: Títulos writes it and Painel
reads it, so it has to be common to both. `App` resolves it once and passes
`marcados` (a Set) plus the ready-made `itensDestaque` down.

Three states, and the last two are **not** the same thing:

| Stored | Meaning | Painel shows |
|---|---|---|
| absent (`null`) | never chose | the catalogue's `destaque` entries, so a fresh install isn't empty |
| `[...]` | chose these | those |
| `[]` | un-starred everything | the invitation to choose — **not** the defaults resurrected |

That last distinction matters: reviving defaults someone just removed would
read as the app ignoring them.

Two things deliberately follow the **user's** choice rather than the
catalogue's: the Painel's stale-price banner (warning about a bond nobody
tracks is noise; staying quiet about a tracked one is worse) and the ⭐ on the
Curva screen (otherwise the app would mark different bonds in two places).

The ⭐ in **`dados/ntnb.json` stays catalogue-driven** — that file is public and
a personal watchlist must not leak into it. Don't "unify" the two.

A Títulos row is a `<div>` with two buttons inside (open detail, toggle star),
not a single `<button>`: a button inside a button is invalid HTML and browsers
disagree on it — clicking the star would also open the detail.

## Family semantics (the thing that breaks if you're careless)

The same number means three different things across families:

| Family | `taxa` means | duration |
|---|---|---|
| ipca / ipca-juros | **real** % a.a. above IPCA | yes (coupon 6%) |
| prefixado / prefixado-juros | **nominal** % a.a., inflation not deducted | yes (coupon 10%) |
| selic | **spread** over Selic (ágio/deságio, can be negative) | **null by design** |

Everything downstream keys off this:

- `classificarTitulo()` in `server/util.js` is the single authority on family
  names (both long forms and ANBIMA acronyms) and carries `cupomAnual`.
  RendA+/Educa+ return `null` on purpose.
- `temDuration(tipo)` gates every duration computation. Do not "fix" the LFT by
  computing duration on its spread — a number with the look of analysis and the
  value of none.
- `unidadeTaxa(tipo)` in `src/format.js` is the display-side label. Never show
  a rate without it: an 8% real and a 13% nominal are not comparable, and the
  two yield curves are kept separate for the same reason (their gap is implied
  inflation).
- The Calculadora excludes LFT, and its terminal-value copy switches between
  "a preços de hoje" (IPCA+) and "reais nominais" (prefixado) — that switch is
  load-bearing honesty, not styling. Every mention of the rate itself comes from
  a single `rotuloTaxa` ("taxa real" / "taxa nominal") derived from `t.tipo`.
  Four separate places used to say "taxa real" unconditionally, so a Prefixado
  at 14% read as 14% *above* inflation — the numbers were right and the label
  was not. Never write either phrase by hand there; `verificar.mjs` fails if you
  do.

To add another family: teach `classificarTitulo()`, add the category in
`catalogo.js`, give it a sibling bridge file in the collector. Never reshape an
existing bridge file.

## Fed / ECB / news (the non-Tesouro sources)

- **Fed**: FRED's public `fredgraph.csv` (DFEDTARU/DFEDTARL) — key-less; the
  real FRED API needs a key, this endpoint doesn't. **ECB**: ECB Data Portal
  `csvdata` (DFR + MRR), key-less. Both are read by the **collector** (policy
  changes ~8×/year; twice daily is plenty) into `dados/global.json`, with
  keep-previous-on-failure per source — same contract as the CEPEA cache in
  Cana-Tracker. The Copom decision is derived live from SGS 432.
- "Decision dates" are **effective dates** derived from the series (the day the
  value changed), not meeting dates. The UI says "vigente desde" — keep it that
  way — **except when that date is still in the future**, where it says "a
  partir de". The ECB announces a change before it takes force (it starts with
  the next reserve maintenance period), so the ECB Data Portal series routinely
  carries a forward-dated row: on 13/09/2026 the screen read "vigente desde
  16/09/2026", which says nothing.

  The **rate shown is deliberately the new one**, not the one still in force.
  This screen is a market overview, and the announced rate is the one already
  priced in and the one anyone investing from here actually gets. Only the
  preposition changes. `vigencia()` in `src/format.js` owns the choice, compares
  in **America/Sao_Paulo** (past 21:00 a UTC comparison has already rolled the
  day and would call a rate that started today "future"), and `verificar.mjs`
  imports it and exercises all three branches — format.js has no imports of its
  own, so it loads in plain node. Never write either preposition by hand in
  `Mercado.jsx`; the check fails if you do.
- **Ibovespa**: Yahoo Finance's public chart endpoint (`^BVSP`), request-time.
  It is **not** in `MACRO` — that list is "BCB SGS series", and the BCB does not
  publish Ibovespa among them. Guessing an SGS number would have labelled some
  unrelated series "IBOVESPA", so the Yahoo route was taken instead (the same
  one Cana-Tracker uses for NY contracts). `extrairSerie()` is pure and
  fixture-tested: the payload is deeply nested
  (`chart.result[0].indicators.quote[0].close`) and a careless refactor returns
  an empty array rather than throwing, which would show "—" with no clue why.
- **News**: Google News RSS per region, regex-parsed (house rule: no deps),
  request-time with a 20-min in-process cache, best-effort via `allSettled` —
  one dead region never blanks the others. Headlines are context, not data: the
  screen links to original sources and says the selection is the aggregator's.
  The collector **probes** the feeds on every run and logs the result — that log
  is the only place with open network where the RSS parser can be checked
  against the real feed.

## Conventions## Conventions

- **Portuguese everywhere** — identifiers (`carregar`, `pontos`,
  `desatualizado`, `vivo`), UI copy, and comments. Don't mix in English names.
  The one exception is `dados/*.json`, which is an interchange format: dot
  decimals and ISO dates, documented in the README.
- **Comments explain *why*.** Every module opens with a header comment stating
  its job and the reasoning behind non-obvious choices (why the collector
  exists, why `createRequire` and not `readFile`, why parsing is tolerant).
  Match that density — it's the house style.
- **Numbers go through `src/format.js`** (`num`, `taxa`, `reais`, `pct`, `pp`,
  `anos`, `dataBR`, …) and render with the `mono` class. `num(v, 0)` is the
  no-decimals form, for index points (Ibovespa) — it has its own branch because
  the fallback formatter has `minimumFractionDigits: 2` and would silently
  ignore the request. Note `pct` vs `pp`:
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
- `server/cache.js` loads the JSON via `createRequire` **on purpose**, and every
  `require()` takes a **literal path written at the call site**. Both halves
  matter:
  - Don't "modernise" it to `readFile` — the tracer won't see the file.
  - Don't refactor the three requires into a `carregar(caminho)` helper. It
    looks identical and is not: `@vercel/nft` analyses statically, so a path
    arriving via a variable resolves to nothing, the JSON ships **outside** the
    function bundle, the `require` throws, the `try/catch` swallows it, and the
    deployed app sits in "aguardando coleta" forever — while the build, the
    local pre-flight and `verificar` all pass, because locally the files are
    just there on disk.

  This is not hypothetical: it broke the first Vercel deploy of this repo.
  `verificar.mjs` now fails if any `require()` in `cache.js` uses a non-literal
  path.
- **`vercel.json` belts what `cache.js` braces.** It declares
  `functions["api/*.js"].includeFiles = "dados/**"`, forcing the data files
  into every function bundle regardless of what the tracer concludes on its own.
  The literal-`require` rule above is still the primary mechanism and must stay
  — this is the second line of defence, because the failure it guards against
  is invisible everywhere except production: build, `verificar` and a local
  handler pre-flight all pass while the deployed app shows nothing. Two cheap
  guarantees are worth it for a fault with no local signal.

  Keep the pattern `api/*.js`, **not** `api/**/*.js`. The functions are all flat
  in `api/`, and Vercel **fails the build** when a `functions` pattern matches
  nothing — with `**` that hinges on the glob accepting zero segments, which is
  risk for no gain. A failed build is worse than the bug it guards: the previous
  deployment stays live and every later fix silently fails to ship. If a
  `api/sub/thing.js` ever appears, add an entry rather than switching to `**`.
- **`dados/` must never be added to `.gitignore` or a `.vercelignore`.** The
  data files are deliberately committed — that is the whole bridge — and
  ignoring them would empty the app in production while leaving dev perfect.
- The service worker (`public/sw.js`) is **network-first for navigation**,
  **cache-first for hashed `/assets/*`**, and never caches `/api/*`. `CACHE` is
  the version string to bump (`"tesouro-tracker-v1"`); `SHELL` is the precached
  list. (Same naming as Cana-Tracker, inverse of ETF Tracker.)
- `src/main.jsx` registers that worker in production, checks hourly, and reloads
  **once** when a new version installs over an existing controller.
- **Per-device user state lives in `localStorage`, never in the repo** — it is
  public, and what someone tracks reveals what they hold. Two keys, and they
  must stay distinct (`verificar.mjs` checks that):

  | Key | Written by | What |
  |---|---|---|
  | `tesouro-tracker-alertas` | `components/Alertas.jsx` (inline, no module) | rate alerts |
  | `tesouro-tracker-destaques` | `src/destaques.js` | which maturities show in the Painel |
- A broken change fails the Vercel build and the previous deploy stays live;
  `npm run build` locally is still the right pre-push check.

## Git

- Develop on the branch you were given; commit with clear pt-BR messages; push
  with `git push -u origin <branch>`.
- Don't open a PR unless the user asks.
- Expect automated `github-actions[bot]` commits touching `dados/` — rebase/pull
  before pushing rather than fighting them, and don't hand-edit those files.
