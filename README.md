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

[`scripts/build-aop-data.ts`](scripts/build-aop-data.ts) builds [`public/data/aops.json`](public/data/aops.json) from three open-data sources (Open Licence 2.0 / Etalab):

- [Aires et produits AOC/AOP/IGP](https://www.data.gouv.fr/datasets/aires-et-produits-aoc-aop-et-igp) — INAO area↔product join
- [Aires géographiques des AOC/AOP](https://www.data.gouv.fr/datasets/aires-geographiques-des-aoc-aop) — INAO area↔commune join
- [`geo.api.gouv.fr/communes`](https://geo.api.gouv.fr/communes) — commune centroids by INSEE code

Sources are downloaded into `.cache/` (gitignored) on first run. Each AOP's marker position is the average of its member commune centroids. Re-run `npm run build:data` after INAO publishes updated CSVs and commit the regenerated `public/data/aops.json`.

## Deployment

A single workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the CI checks (format, lint, typecheck, tests, build) on every push and pull request. On pushes to `main`, the deploy job runs only after the checks pass and publishes to GitHub Pages.
