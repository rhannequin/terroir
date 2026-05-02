/**
 * Builds public/data/aops.json from INAO open data + commune centroids.
 *
 * Sources (Open Licence 2.0 / Etalab):
 *  - Aires et produits AOC/AOP/IGP   (data.gouv.fr, INAO)
 *  - Aires géographiques des AOC/AOP (data.gouv.fr, INAO)
 *  - Commune centroids                (geo.api.gouv.fr)
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV } from './lib/csv';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CACHE_DIR = path.join(ROOT, '.cache');
const OUT_PATH = path.join(ROOT, 'public/data/aops.json');

type Encoding = 'utf-8' | 'latin1';

interface Source {
  name: string;
  url: string;
  file: string;
  encoding: Encoding;
}

const SOURCES = {
  communesAires: {
    name: 'communes-aires',
    url: 'https://static.data.gouv.fr/resources/aires-geographiques-des-aoc-aop/20251009-122320/2025-10-09-comagri-communes-aires-ao.csv',
    file: 'communes-aires.csv',
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
    url: 'https://geo.api.gouv.fr/communes?fields=code,centre,surface&format=json',
    file: 'communes-centroids.json',
    encoding: 'utf-8',
  },
} as const satisfies Record<string, Source>;

async function loadSource(src: Source): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, src.file);
  try {
    await stat(cachePath);
    console.log(`[${src.name}] cache hit`);
  } catch {
    console.log(`[${src.name}] downloading…`);
    const res = await fetch(src.url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${src.url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const text =
      src.encoding === 'latin1'
        ? buf.toString('latin1')
        : buf.toString('utf-8');
    await writeFile(cachePath, text, 'utf-8');
  }
  return readFile(cachePath, 'utf-8');
}

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
  centre: { coordinates: [number, number] };
  /** Area in hectares; absent for some non-metropolitan/synthetic codes. */
  surface?: number;
}

interface CommuneInfo {
  centroid: [number, number];
  weight: number;
}

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

async function main(): Promise<void> {
  const [communesText, produitsText, centroidsJson] = await Promise.all([
    loadSource(SOURCES.communesAires),
    loadSource(SOURCES.airesProduits),
    loadSource(SOURCES.communesCentroids),
  ]);

  const communeByCode = new Map<string, CommuneInfo>();
  for (const c of JSON.parse(centroidsJson) as CommuneFeature[]) {
    communeByCode.set(c.code, {
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

  // communes-aires.csv: CI;Département;Commune;Art;Aire géographique;IDA
  const communesByIda = new Map<number, string[]>();
  for (const row of parseCSV(communesText).slice(1)) {
    if (row.length < 6) continue;
    const ci = row[0].trim();
    const ida = Number(row[5]);
    if (!ci || !Number.isFinite(ida)) continue;
    let arr = communesByIda.get(ida);
    if (!arr) {
      arr = [];
      communesByIda.set(ida, arr);
    }
    arr.push(ci);
  }

  const result: AopOutput[] = [];
  let aireMissing = 0;
  let communeMissing = 0;
  let centroidless = 0;
  for (const [ida, communes] of communesByIda) {
    const aire = aireById.get(ida);
    if (!aire) {
      aireMissing++;
      continue;
    }
    // Surface-weighted centroid: a tiny urban commune shouldn't pull the
    // marker as much as a vast rural one in the same AOP.
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
    result.push({
      ida,
      name: aire.name,
      signeUE: aire.signeUE,
      signeFR: aire.signeFR,
      products: aire.products,
      communeCount: communes.length,
      centroid: [sumLng / sumWeight, sumLat / sumWeight],
    });
  }

  result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(result));

  const sizeKB = ((await stat(OUT_PATH)).size / 1024).toFixed(1);
  console.log(
    `\nWrote ${path.relative(ROOT, OUT_PATH)} (${result.length} AOPs, ${sizeKB} KB)`,
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
