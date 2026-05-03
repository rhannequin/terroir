# Contributing to Terroir

Terroir is an open-source map of French AOPs, IGPs, and traditional regional dishes. Anything from a one-line dish addition to a full new locale is welcome.

## Ways to contribute

### Add a traditional dish

Dishes live in [`scripts/data/dishes.ts`](scripts/data/dishes.ts) as a TypeScript array. To add one, append a new entry following the existing pattern:

```ts
{
  id: 'cassoulet',
  name: { fr: 'Cassoulet', en: 'Cassoulet' },
  description: {
    fr: 'Ragoût de haricots blancs et de viandes confites, mijoté longuement.',
    en: 'Slow-cooked stew of white beans and confit meats.',
  },
  category: 'main',
  region: 'Languedoc',
  location: { type: 'commune', insee: '11069' },
}
```

Field notes:

- `id`: kebab-case, unique across the file.
- `name` and `description`: both languages required (the `fr` and `en` keys must always be present together).
- `category`: one of `main`, `soup`, `starter`, `side`, `charcuterie`, `cheese-dish`, `pastry`, `dessert`, `snack` (defined in [`src/lib/types.ts`](src/lib/types.ts)).
- `region`: free-form display string, used in popups.
- `location`: one of the shapes from [`scripts/lib/locations.ts`](scripts/lib/locations.ts):
  - `{ type: 'commune', insee: '<code>' }`: most precise; use the official 5-character INSEE code.
  - `{ type: 'department', code: '<code>' }`
  - `{ type: 'region', code: '<code>' }`
  - `{ type: 'area', name: '<label>', centroid: [lng, lat] }`: for cross-administrative areas.
  - `{ type: 'national' }`: France-wide specialities.

After editing the file:

```sh
npm run build:data
```

This regenerates `public/data/dishes.json`. Commit both `scripts/data/dishes.ts` and the regenerated JSON in the same PR.

If you don't know the INSEE code, open an issue with the [dish suggestion template](.github/ISSUE_TEMPLATE/dish_suggestion.yml) and someone can finish the lookup.

### Add a new locale

The site currently ships in French (default) and British English. To add a new locale (e.g. German):

1. Add the locale to `src/i18n/ui.ts`:
   - extend the `languages` and `htmlLang` maps
   - add a full sibling object under `ui` with **every** key translated, the parity test in `src/i18n/ui.test.ts` will fail otherwise.
2. Create `src/pages/<locale>/index.astro` mirroring `src/pages/en/index.astro`.
3. Update the `i18n.locales` array in `astro.config.mjs`.

The language switcher in `BaseLayout.astro` iterates the locale list, so a new locale appears automatically once registered.

### Code or bug fix

1. Fork and create a branch.
2. Run `npm install` (Node version is pinned in [`.tool-versions`](.tool-versions); [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev/) will pick it up).
3. Make your change.
4. Run [`./bin/ci`](bin/ci), it mirrors what GitHub Actions runs and must be green.
5. Open a PR.

The codebase uses TypeScript strict mode, ESLint, Prettier, and Vitest. The existing UI cares about accessibility (skip-link, ARIA labels, focus rings, `prefers-reduced-motion`); match that for new UI.

### Report an issue

Use the issue templates:

- **Bug report**: something broken on the site.
- **Dish suggestion**: propose a dish for the map (no coding required).
- **AOP correction**: name, location, or product mistake on an AOP/IGP.
- **Feature request**: a new capability or improvement.

## Local setup

```sh
asdf install      # or `mise install`, picks up Node from .tool-versions
npm install
npm run dev       # http://localhost:4321/terroir/
```

Useful commands are listed in the [README](README.md#commands).

## Before opening a PR

- [ ] `./bin/ci` is green locally.
- [ ] If you changed dish data, you ran `npm run build:data` and committed the regenerated `public/data/dishes.json`.
- [ ] If you changed user-facing strings, you added them in **both** `fr` and `en` in `src/i18n/ui.ts`.
- [ ] If you changed the UI, you included a screenshot or short recording in the PR description.
- [ ] Your PR title is descriptive and references any related issue.

## Data sources and licensing

Terroir's code is MIT-licensed. The AOP data is built from open INAO datasets distributed by data.gouv.fr under the [Open Licence 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) and from the `geo.api.gouv.fr` commune dataset. Contributions must respect those upstream licences (see the [README data pipeline section](README.md#data-pipeline) for details).

## Code of Conduct

The project follows a [Code of Conduct](CODE_OF_CONDUCT.md).
