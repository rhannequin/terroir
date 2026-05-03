// Builds public/data/aops.json from INAO CSVs + commune centroids.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categorizeProduct, type ProductCategory } from './lib/categorize';
import { parseCSV } from './lib/csv';
import { loadSource, type Source } from './lib/fetch-cache';
import { findPinpointCentroid } from './lib/pinpoint';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CACHE_DIR = path.join(ROOT, '.cache');
const OUT_PATH = path.join(ROOT, 'public/data/aops.json');

const SOURCES = {
  communesAires: {
    name: 'communes-aires-aop',
    url: 'https://static.data.gouv.fr/resources/aires-geographiques-des-aoc-aop/20251009-122320/2025-10-09-comagri-communes-aires-ao.csv',
    file: 'communes-aires.csv',
    encoding: 'windows-1252',
  },
  communesAiresIg: {
    name: 'communes-aires-ig',
    url: 'https://static.data.gouv.fr/resources/aire-geographique-des-igp-et-des-ig/20251009-122625/2025-10-09-comagri-communes-aires-ig.csv',
    file: 'communes-aires-ig.csv',
    encoding: 'windows-1252',
  },
  airesProduits: {
    name: 'aires-produits',
    url: 'https://static.data.gouv.fr/resources/aires-et-produits-aoc-aop-et-igp/20251009-122906/2025-03-10-comagri-aires-produits.csv',
    file: 'aires-produits.csv',
    encoding: 'windows-1252',
  },
  communesCentroids: {
    name: 'communes-centroids',
    url: 'https://geo.api.gouv.fr/communes?fields=code,nom,centre,codeDepartement,codeRegion,surface&format=json',
    file: 'communes-centroids.json',
    encoding: 'utf-8',
  },
  siqoReferential: {
    name: 'siqo-referential',
    url: 'https://www.data.gouv.fr/api/1/datasets/r/76e54568-9786-4e15-8e48-dc3b8f44011d',
    file: 'siqo-referential.csv',
    encoding: 'utf-8',
  },
} as const satisfies Record<string, Source>;

interface Aire {
  ida: number;
  name: string;
  signeFR: string | null;
  signeUE: string | null;
  products: string[];
}

interface AopOutput {
  ida: number;
  name: string;
  signeUE: string | null;
  signeFR: string | null;
  products: string[];
  category: ProductCategory;
  communeCount: number;
  centroid: [number, number]; // [lng, lat]
}

interface CommuneFeature {
  code: string;
  nom?: string;
  centre: { coordinates: [number, number] };
  surface?: number;
}

interface CommuneInfo {
  name: string | null;
  centroid: [number, number];
  weight: number;
}

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}|[\u0080-\u009F\u0152\u0153'\u2018\u2019\u201B\\]/gu, '')
    .trim();
}

interface SiqoLookup {
  byName: Map<string, ProductCategory>;
  byProduct: Map<string, ProductCategory>;
  productKeysByLength: string[];
}

function buildSiqoLookup(csvText: string): SiqoLookup {
  const rows = parseCSV(csvText.replace(/^\uFEFF/, ''), ',');
  const header = rows[0] ?? [];
  const iApp = header.indexOf('appellation');
  const iCls = header.indexOf('classe_ue');
  const iCat = header.indexOf('categorie');
  const iProd = header.indexOf('produit');
  const byName = new Map<string, ProductCategory>();
  const byProduct = new Map<string, ProductCategory>();
  for (const row of rows.slice(1)) {
    const category = categorizeProduct(row[iCls]?.trim(), row[iCat]?.trim());
    const name = row[iApp]?.trim();
    const product = row[iProd]?.trim();
    if (name) byName.set(normalizeKey(name), category);
    if (product) byProduct.set(normalizeKey(product), category);
  }
  const productKeysByLength = [...byProduct.keys()].sort(
    (a, b) => b.length - a.length,
  );
  return { byName, byProduct, productKeysByLength };
}

function resolveCategory(
  aire: { name: string; products: string[] },
  siqo: SiqoLookup,
): ProductCategory {
  for (const p of aire.products) {
    const hit = siqo.byProduct.get(normalizeKey(p));
    if (hit) return hit;
  }
  const byName = siqo.byName.get(normalizeKey(aire.name));
  if (byName) return byName;
  for (const p of aire.products) {
    const key = normalizeKey(p);
    for (const sk of siqo.productKeysByLength) {
      if (sk.length > 6 && (key === sk || key.startsWith(sk + ' '))) {
        return siqo.byProduct.get(sk)!;
      }
    }
  }
  return 'other';
}

async function main(): Promise<void> {
  const [communesText, communesIgText, produitsText, centroidsJson, siqoText] =
    await Promise.all([
      loadSource(SOURCES.communesAires, CACHE_DIR),
      loadSource(SOURCES.communesAiresIg, CACHE_DIR),
      loadSource(SOURCES.airesProduits, CACHE_DIR),
      loadSource(SOURCES.communesCentroids, CACHE_DIR),
      loadSource(SOURCES.siqoReferential, CACHE_DIR),
    ]);

  const siqo = buildSiqoLookup(siqoText);

  const communeByCode = new Map<string, CommuneInfo>();
  for (const c of JSON.parse(centroidsJson) as CommuneFeature[]) {
    communeByCode.set(c.code, {
      name: c.nom?.trim() ?? null,
      centroid: c.centre.coordinates,
      weight: c.surface && c.surface > 0 ? c.surface : 1,
    });
  }

  const aireById = new Map<number, Aire>();
  const productSetById = new Map<number, Set<string>>();
  for (const row of parseCSV(produitsText).slice(1)) {
    if (row.length < 6) continue;
    const ida = Number(row[0]);
    if (!Number.isFinite(ida)) continue;
    const product = row[5].trim();
    let aire = aireById.get(ida);
    if (!aire) {
      aire = {
        ida,
        name: row[1].trim(),
        signeFR: trimOrNull(row[2]),
        signeUE: trimOrNull(row[3]),
        products: [],
      };
      aireById.set(ida, aire);
      productSetById.set(ida, new Set());
    }
    if (product) productSetById.get(ida)!.add(product);
  }
  for (const [ida, set] of productSetById) {
    const aire = aireById.get(ida);
    if (aire) aire.products = [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  const communesByIda = new Map<number, Set<string>>();
  function addCommune(ida: number, ci: string): void {
    if (!ci || !Number.isFinite(ida)) return;
    let set = communesByIda.get(ida);
    if (!set) {
      set = new Set();
      communesByIda.set(ida, set);
    }
    set.add(ci);
  }

  for (const row of parseCSV(communesText).slice(1)) {
    if (row.length < 6) continue;
    addCommune(Number(row[5]), row[0].trim());
  }

  for (const row of parseCSV(communesIgText).slice(1)) {
    if (row.length < 5) continue;
    addCommune(Number(row[1]), row[4].trim());
  }

  const result: AopOutput[] = [];
  let aireMissing = 0;
  let communeMissing = 0;
  let centroidless = 0;
  let pinpointed = 0;
  for (const [ida, communes] of communesByIda) {
    const aire = aireById.get(ida);
    if (!aire) {
      aireMissing++;
      continue;
    }

    let sumLng = 0;
    let sumLat = 0;
    let sumWeight = 0;
    let n = 0;
    for (const code of communes) {
      const info = communeByCode.get(code);
      if (!info) {
        communeMissing++;
        continue;
      }
      const [lng, lat] = info.centroid;
      sumLng += lng * info.weight;
      sumLat += lat * info.weight;
      sumWeight += info.weight;
      n++;
    }
    if (n === 0 || sumWeight === 0) {
      centroidless++;
      continue;
    }

    const pinpoint = findPinpointCentroid(aire.name, communes, communeByCode);
    if (pinpoint) pinpointed++;
    const centroid: [number, number] = pinpoint ?? [
      sumLng / sumWeight,
      sumLat / sumWeight,
    ];

    result.push({
      ida,
      name: aire.name,
      signeUE: aire.signeUE,
      signeFR: aire.signeFR,
      products: aire.products,
      category: resolveCategory(aire, siqo),
      communeCount: communes.size,
      centroid,
    });
  }

  result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(result, null, 2) + '\n');

  const sizeKB = ((await stat(OUT_PATH)).size / 1024).toFixed(1);
  console.log(
    `\nWrote ${path.relative(ROOT, OUT_PATH)} (${result.length} AOPs, ${sizeKB} KB)`,
  );
  console.log(
    `  · ${pinpointed} pinned to an eponymous commune; ${result.length - pinpointed} fell back to surface-weighted centroid`,
  );
  const catCounts: Record<string, number> = {};
  for (const r of result)
    catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
  const catSummary = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  console.log(`  · categories: ${catSummary}`);
  if (aireMissing > 0)
    console.log(
      `  · ${aireMissing} areas in communes CSV with no row in produits CSV`,
    );
  if (communeMissing > 0)
    console.log(`  · ${communeMissing} commune codes with no centroid lookup`);
  if (centroidless > 0)
    console.log(
      `  · ${centroidless} areas dropped (no commune centroid resolved)`,
    );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
