# Terroir

An interactive map of French AOP (Appellation d'Origine Protégée) and traditional dishes, with geolocation to discover specialities near you.

Live at https://rhannequin.github.io/terroir/.

## Tech stack

- [Astro](https://astro.build/) — static site generator with built-in i18n routing
- [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) — interactive map
- TypeScript, ESLint, Prettier, Vitest
- Deployed to GitHub Pages via GitHub Actions

## Prerequisites

- Node.js — version pinned in [`.tool-versions`](.tool-versions). Use [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev/) to install the matching version automatically.

## Commands

| Command                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm install`          | Install dependencies                                   |
| `npm run dev`          | Start the dev server at http://localhost:4321/terroir/ |
| `npm run build`        | Build the production site to `dist/`                   |
| `npm run preview`      | Preview the production build locally                   |
| `npm run lint`         | Run ESLint                                             |
| `npm run format`       | Format all files with Prettier                         |
| `npm run format:check` | Check formatting without writing                       |
| `npm run typecheck`    | Type-check `.astro` and TypeScript files               |
| `npm test`             | Run Vitest tests                                       |
| `npm run build:data`   | Rebuild `public/data/aops.json` from INAO open data    |

## Project structure

```
src/
├── i18n/          Translation dictionary (fr, en) + tests
├── layouts/       Shared HTML shell (header, language switcher)
├── components/    Reusable UI (map, etc.)
└── pages/
    ├── index.astro      French homepage (default locale, served at /)
    └── en/index.astro   English homepage (served at /en/)
```

## Internationalisation

The site is bilingual: French is the default and is served at `/`; British English is served at `/en/` with `lang="en-GB"`. Add translation strings to `src/i18n/ui.ts`. A Vitest test enforces that both locales declare the same keys.

To add a new page in both locales, create `src/pages/foo.astro` and `src/pages/en/foo.astro`.

## Data pipeline

`npm run build:data` regenerates two JSON files in [`public/data/`](public/data/):

- [`aops.json`](public/data/aops.json), built by [`scripts/build-aop-data.ts`](scripts/build-aop-data.ts) from open INAO data on data.gouv.fr — [Aires et produits AOC/AOP/IGP](https://www.data.gouv.fr/datasets/aires-et-produits-aoc-aop-et-igp) and [Aires géographiques des AOC/AOP](https://www.data.gouv.fr/datasets/aires-geographiques-des-aoc-aop) (Open Licence 2.0 / Etalab) — joined to commune centroids from [`geo.api.gouv.fr/communes`](https://geo.api.gouv.fr/communes). Each AOP's marker position is the surface-weighted mean of its member communes' centroids.
- [`dishes.json`](public/data/dishes.json), built by [`scripts/build-dishes-data.ts`](scripts/build-dishes-data.ts) from the hand-curated list in [`scripts/data/dishes.ts`](scripts/data/dishes.ts). Each dish points to a commune (Bouillabaisse → Marseille), a département (Tartiflette → Haute-Savoie), a région (Crêpe bretonne → Bretagne) or a bespoke area with a hand-set centroid (Aubrac, Pays Basque…). The build resolves the location to a centroid using the same `geo.api.gouv.fr` data.

Sources are cached in `.cache/` (gitignored) on first run. Re-run `npm run build:data` after editing `dishes.ts` or whenever INAO publishes updated CSVs, then commit the regenerated JSON.

## Deployment

A single workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the CI checks (format, lint, typecheck, tests, build) on every push and pull request. On pushes to `main`, the deploy job runs only after the checks pass and publishes to GitHub Pages.
