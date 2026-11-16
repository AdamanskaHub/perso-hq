# Personal HQ

A personal command centre for becoming more deliberate, creative and capable. It is built to make
opening it feel inspiring and starting meaningful creative work easier. It is not a conventional
productivity dashboard.

> **Create, don't merely consume. But rest is a valid deliberate choice.**

React + TypeScript + Vite. No backend, no database, no analytics, no external APIs or fonts.

## What's in it

| Section | What it does |
| --- | --- |
| **Identity Engine** (hero) | A daily doctrine (30 included), chosen deterministically by *local calendar date*. On some evenings (roughly 2 in 5) a reflective question (15 included) replaces it. Auto morning/evening by time of day (evening = 17:00 to 04:00), with a manual Auto / Morning / Evening switch. Choosing Evening manually always shows the question. |
| **Main Quest** | Project title, one next action, optional context, link to your existing Kanban board. *Begin mission* opens a distraction-free focus view with a link to your existing timer. *Completed* records a win, clears the mission and assigns nothing new. There is an Undo. |
| **Side Quests** | Compact list: add, edit, complete, delete (with confirmation). Completed items live in a collapsible area. |
| **Trophy Room** | Title, date, description, optional link and optional image. Images are resized in the browser and stored locally. |
| **Character Development** | Areas with an objective, actions, reflections and book/resource links. At most three areas are in focus; the rest are archived. No daily check-ins. |
| **Life Admin** | Plain checklist: add, edit, check, delete (with Undo), hide completed. |
| **Data and links** | Export / import JSON, editable Kanban and timer links, storage meter, reset. |

First use loads clearly editable example content. It is written **once**, and never overwrites existing data on refresh or redeploy.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

Requires Node 18+ (developed on Node 22).

## Your data: important

Data is stored in **this browser's localStorage, on this device only**. It does **not** sync between
your laptop, phone or other browsers, and clearing site data erases it. The app says so in the
interface. To move or back up your data, use **Export data** (top right, and in *Data and links*),
then **Import data** on the other device.

- Exports include a schema version and **all trophy images** (embedded), so a round trip loses nothing.
- Imports are fully validated first (structure, types, http(s)-only links, image format and size,
  duplicate ids, schema version). Invalid or newer-format files are rejected with a clear message and nothing
  changes. A valid file still needs explicit confirmation before it replaces your data.
- If saved data ever can't be read, the app keeps a backup copy, **pauses saving so it cannot overwrite it**,
  and offers to download it, import a file, or start fresh.
- If the browser's storage is full, you get a visible "Not saved" banner; your last saved state is kept.
- Trophy images: PNG/JPEG/WebP/GIF up to 10 MB are resized (max 1000 px, about 260 KB; small PNGs stay PNG for crisp
  pixel art). GIFs become still images. Browsers allow roughly 5 MB, so a few dozen images fit.

## Replace the hero illustration

The hero is an original built-in SVG landscape that shifts between morning and evening palettes. To use your own
artwork, save it as `public/hero.jpg` (landscape, 1600×700 or larger). It is picked up automatically, with no
code change. Keep text out of the image; all text is real HTML. Only use artwork you have the rights to.

## Deploy to Vercel

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel: **Add New → Project**, import the repository.
3. Vercel detects Vite. Build command `npm run build`, output directory `dist`. Deploy.
   (Or CLI: `npm i -g vercel && vercel --prod`.)

`vercel.json` only adds small security headers (no-referrer, nosniff, noindex).

### Protecting the site (checked against Vercel's docs, November 2026)

Personal HQ has no login of its own. The simplest suitable option is **Vercel Authentication with the "All Deployments"
scope**:

1. Open the project → **Settings → Deployment Protection** (the sidebar shows it under *Security*).
2. Under **Vercel Authentication**, choose **All Deployments**.
3. Save.

What the docs say:

- Vercel Authentication is available on **all plans, including Hobby**.
- Since the "Protect production deployments for free on every plan" change, the **All Deployments** scope covers the
  **production domain as well as previews**, at no extra cost. Previously protecting production needed a paid add-on.
- Visitors must sign in to a **Vercel account with access to the project/team**. That works for just you, but not for
  people without access.
- **Password Protection** (a shared password) is a separate, paid feature (Enterprise, or a paid add-on on Pro at about
  $20 per project per month as described in the changelog). It is not needed for personal use.
- "Production only" protection and Trusted IPs are Enterprise features.
- New projects have Vercel Authentication on by default, but the default **Standard Protection** scope leaves the production
  custom domain public. You must select **All Deployments** to protect production.

Plans and pricing change, so confirm in the dashboard before relying on it. Docs:
[Deployment Protection](https://vercel.com/docs/deployment-protection),
[Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication),
[free production protection changelog](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan).

Note that the browser-storage data is per origin: your `*.vercel.app` URL and a custom domain are separate stores.

## Project structure

```
src/
  types.ts              All stored-data interfaces + SCHEMA_VERSION
  storage/
    repository.ts       DataRepository interface + localStorage implementation (the ONLY place that touches storage)
    index.ts            Which repository the app uses (swap here)
    validate.ts         Import/load validation + export builder
    migrate.ts          Schema-version upgrades (empty for v1)
    images.ts           Trophy image resizing + limits
  hooks/useStore.tsx    React state + save-on-change, load issue/save error handling
  lib/                  identity.ts (date/mode/doctrine logic), util.ts, exportData.ts
  data/                 doctrines.ts (30), challenges.ts (15 + starters), seed.ts (first-run content)
  components/           Hero, MainQuest, SideQuests, TrophyRoom, CharacterDev, LifeAdmin, DataPanel, modal/toast/confirm
  styles.css            Theme (CSS variables at the top)
```

## V1 limitations

- Device-specific storage; no sync, no accounts, no backups other than your exports.
- About 5 MB browser budget (images are the main cost).
- No notifications, reminders, due dates, recurring tasks or analytics, by design.
- The mode override resets on refresh; Auto is the default.
- Wins can't be deleted individually in the UI (they're in exports).
- Dates use the browser's local time zone.

## Future cloud-sync migration path

All persistence goes through the `DataRepository` interface in `src/storage/repository.ts` (`load`, `save`, `usageBytes`).

1. Pick a backend (e.g. Supabase, Vercel Postgres or Firestore) and put auth in front of it.
2. Implement `DataRepository` against it. The stored shape is a single versioned `AppData` document, so the first version
   can be one row or document per user. Later you can normalise into tables per section (the types already
   have stable ids).
3. Make `load()` async (the interface and `StoreProvider` are the only places to change) and add optimistic saving with retry.
4. One-time migration: import a JSON export through the same `parseImport`, then write it to the backend.
5. Move trophy images from embedded data URLs to object storage (keep `image` as a URL) and bump `SCHEMA_VERSION` with a
   `migrate.ts` step.
6. Swap the export in `src/storage/index.ts`. Components don't change.
