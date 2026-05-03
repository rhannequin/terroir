# Terroir

An interactive map of French AOPs, IGPs, and traditional regional dishes, with
geolocation to discover specialities near you.

AOP (Appellation d'Origine Protégée) and IGP (Indication Géographique Protégée)
are EU designations protecting foods produced in a specific area: AOP requires
every step of production to take place there, IGP requires at least one.

Live at https://rhannequin.github.io/terroir. Contributions are welcome,
see [CONTRIBUTING.md](CONTRIBUTING.md).

## Getting started

```sh
git clone https://github.com/rhannequin/terroir.git
cd terroir
npm install
npm run dev   # http://localhost:4321/terroir/
```

Node version is pinned in [`.tool-versions`](.tool-versions).
[asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev/) will pick it up.

Before opening a PR, run [`./bin/ci`](bin/ci) locally, it mirrors the GitHub
Actions checks.

## Tech stack

- [Astro](https://astro.build/) for static generation and i18n routing
- [Leaflet](https://leafletjs.com/) +
  [OpenStreetMap](https://www.openstreetmap.org/) for the map
- TypeScript, ESLint, Prettier, Vitest
- GitHub Pages via GitHub Actions

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
| `bin/ci`.              | Run all CI checks locally                              |

## Project structure

```
src/
├── i18n/             Translation dictionary (fr, en) + parity test
├── layouts/          Shared HTML shell (header, language switcher)
├── components/       Map, filter panel, locate control, intro panel
├── lib/              Shared utilities (markers, distance, AOP types)
└── pages/
    ├── index.astro       French homepage (default locale, served at /)
    └── en/index.astro    English homepage (served at /en/)

scripts/
├── data/dishes.ts        Source list of traditional dishes
├── build-aop-data.ts     Builds public/data/aops.json from INAO open data
├── build-dishes-data.ts  Builds public/data/dishes.json from dishes.ts
└── lib/                  Categorisation, CSV parsing, location resolution

public/data/              Generated JSON, committed to the repo
bin/ci                    Local CI script (mirrors GitHub Actions)
```

## Internationalisation

The site is bilingual: French is the default and is served at `/`; British
English is served at `/en/` with `lang="en-GB"`. Add translation strings to
`src/i18n/ui.ts`. A Vitest test enforces that both locales declare the same
keys.

To add a new locale entirely,
see [CONTRIBUTING.md](CONTRIBUTING.md#add-a-new-locale).

## Data pipeline

`npm run build:data` rebuilds two JSON files in [`public/data/`](public/data/):

- [`aops.json`](public/data/aops.json), built by [`scripts/build-aop-data.ts`](scripts/build-aop-data.ts) from open INAO data on data.gouv.fr ([Aires et produits AOC/AOP/IGP](https://www.data.gouv.fr/datasets/aires-et-produits-aoc-aop-et-igp), [Aires géographiques des AOC/AOP](https://www.data.gouv.fr/datasets/aires-geographiques-des-aoc-aop), [Aire géographique des IGP](https://www.data.gouv.fr/datasets/aire-geographique-des-igp), all under Open Licence 2.0 / Etalab), joined to commune centroids from [`geo.api.gouv.fr/communes`](https://geo.api.gouv.fr/communes). Each marker position is the surface-weighted mean of its member communes' centroids.
- [`dishes.json`](public/data/dishes.json), built by [`scripts/build-dishes-data.ts`](scripts/build-dishes-data.ts) from the list in [`scripts/data/dishes.ts`](scripts/data/dishes.ts). Each dish points to a commune, a département, a région, or a custom area with a centroid set by hand. The build resolves the location to a centroid using the same `geo.api.gouv.fr` data.

Sources are cached in `.cache/` (gitignored) on first run. Re-run
`npm run build:data` after editing `dishes.ts` or when the INAO CSVs are
updated, then commit the regenerated JSON.

To suggest or add a new dish,
see [CONTRIBUTING.md](CONTRIBUTING.md#add-a-traditional-dish).

## Deployment

A single workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs
the CI checks (format, lint, typecheck, tests, build) on every push and pull
request. On pushes to `main`, the deploy job runs only after the checks pass and
publishes to GitHub Pages.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a dish, translate to a new
locale, fix data, or contribute code. The project follows
a [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](LICENSE).
