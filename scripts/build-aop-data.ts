/**
 * Builds public/data/aops.json from INAO open data + commune centroids.
 *
 * Sources (Open Licence 2.0 / Etalab):
 *  - Aires et produits AOC/AOP/IGP    (data.gouv.fr, INAO) — products per area + signe
 *  - Aires géographiques des AOC/AOP  (data.gouv.fr, INAO) — communes per AOP/AOC area
 *  - Aire géographique des IGP        (data.gouv.fr, INAO) — communes per IGP/IG area
 *  - Commune centroids                 (geo.api.gouv.fr)
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV } from './lib/csv';
import { loadSource, type Source } from './lib/fetch-cache';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CACHE_DIR = path.join(ROOT, '.cache');
const OUT_PATH = path.join(ROOT, 'public/data/aops.json');

const SOURCES = {
  communesAires: {
    name: 'communes-aires-aop',
    url: 'https://static.data.gouv.fr/resources/aires-geographiques-des-aoc-aop/20251009-122320/2025-10-09-comagri-communes-aires-ao.csv',
    file: 'communes-aires.csv',
    encoding: 'latin1',
  },
  communesAiresIg: {
    name: 'communes-aires-ig',
    url: 'https://static.data.gouv.fr/resources/aire-geographique-des-igp-et-des-ig/20251009-122625/2025-10-09-comagri-communes-aires-ig.csv',
    file: 'communes-aires-ig.csv',
    encoding: 'latin1',
  },
  airesProduits: {
    name: 'aires-produits',
    url: 'https://static.data.gouv.fr/resources/aires-et-produits-aoc-aop-et-igp/20251009-122906/2025-03-10-comagri-aires-produits.csv',
    file: 'aires-produits.csv',
    encoding: 'latin1',
  },
  communesCentroids: {
    name: 'communes-centroids',
    url: 'https://geo.api.gouv.fr/communes?fields=code,nom,centre,codeDepartement,codeRegion,surface&format=json',
    file: 'communes-centroids.json',
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
  communeCount: number;
  centroid: [number, number]; // [lng, lat]
}

interface CommuneFeature {
  code: string;
  nom?: string;
  centre: { coordinates: [number, number] };
  /** Area in hectares; absent for some non-metropolitan/synthetic codes. */
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

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * If the AOP name contains the full name of one of its member communes as a
 * complete word, return that commune's centroid. When several match (e.g. an
 * AOP that names two communes), pick the longest commune name — the more
 * specific match. Returns null if no commune name appears in the AOP name.
 */
function findPinpointCentroid(
  aopName: string,
  memberCommunes: Set<string>,
  communeByCode: Map<string, CommuneInfo>,
): [number, number] | null {
  const aopNorm = ' ' + normalizeForMatch(aopName) + ' ';
  let bestCentroid: [number, number] | null = null;
  let bestLen = 0;
  for (const code of memberCommunes) {
    const info = communeByCode.get(code);
    if (!info?.name) continue;
    const nameNorm = normalizeForMatch(info.name);
    if (nameNorm.length < 4) continue;
    if (aopNorm.includes(' ' + nameNorm + ' ') && nameNorm.length > bestLen) {
      bestCentroid = info.centroid;
      bestLen = nameNorm.length;
    }
  }
  return bestCentroid;
}

async function main(): Promise<void> {
  const [communesText, communesIgText, produitsText, centroidsJson] =
    await Promise.all([
      loadSource(SOURCES.communesAires, CACHE_DIR),
      loadSource(SOURCES.communesAiresIg, CACHE_DIR),
      loadSource(SOURCES.airesProduits, CACHE_DIR),
      loadSource(SOURCES.communesCentroids, CACHE_DIR),
    ]);

  const communeByCode = new Map<string, CommuneInfo>();
  for (const c of JSON.parse(centroidsJson) as CommuneFeature[]) {
    communeByCode.set(c.code, {
      name: c.nom?.trim() ?? null,
      centroid: c.centre.coordinates,
      weight: c.surface && c.surface > 0 ? c.surface : 1,
    });
  }

  // aires-produits.csv: IDA;Aire;Signe FR;Signe UE;IdProduit;Produit;Référence
  // Each row is one (area, product) pair. Dedupe products with a Set so a
  // duplicate INAO row never inflates the displayed product count.
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

  // Two complementary commune-area files: AOP/AOC areas in one, IGP/IG areas
  // in the other. Different column orders — normalise via field accessors.
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

  // communes-aires.csv (AOP/AOC): CI;Département;Commune;Art;Aire géographique;IDA
  for (const row of parseCSV(communesText).slice(1)) {
    if (row.length < 6) continue;
    addCommune(Number(row[5]), row[0].trim());
  }

  // communes-aires-ig.csv (IGP/IG): Signe UE;IDA;Date MAJ;Aire;CI;Dép;Commune;Art;Actual
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

    // Surface-weighted fallback centroid: a tiny urban commune shouldn't pull
    // the marker as much as a vast rural one in the same AOP.
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

    // Prefer the eponymous commune when one exists in the AOP — Rivesaltes
    // AOP should pin to the commune Rivesaltes, not to the surface-weighted
    // centroid of the wider appellation.
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
