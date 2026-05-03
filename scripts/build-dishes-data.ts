// Builds public/data/dishes.json from scripts/data/dishes.ts + geo.api.gouv.fr.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DishRecord } from '../src/lib/types';
import { dishes } from './data/dishes';
import { loadSource, type Source } from './lib/fetch-cache';
import { buildCentroidMaps, resolveLocation } from './lib/locations';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CACHE_DIR = path.join(ROOT, '.cache');
const OUT_PATH = path.join(ROOT, 'public/data/dishes.json');

const COMMUNES_SOURCE: Source = {
  name: 'communes-centroids',
  url: 'https://geo.api.gouv.fr/communes?fields=code,nom,centre,codeDepartement,codeRegion,surface&format=json',
  file: 'communes-centroids.json',
  encoding: 'utf-8',
};

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

async function main(): Promise<void> {
  const communesJson = await loadSource(COMMUNES_SOURCE, CACHE_DIR);
  const maps = buildCentroidMaps(communesJson);

  const result: DishRecord[] = [];
  const unresolved: string[] = [];
  const seenIds = new Set<string>();

  for (const dish of dishes) {
    if (seenIds.has(dish.id)) {
      throw new Error(`Duplicate dish id: ${dish.id}`);
    }
    seenIds.add(dish.id);

    const centroid = resolveLocation(dish.location, maps);
    if (!centroid) {
      unresolved.push(`${dish.id} (${dish.location.type})`);
      continue;
    }

    result.push({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      category: dish.category,
      region: dish.region,
      centroid: [round4(centroid[0]), round4(centroid[1])],
    });
  }

  result.sort((a, b) => a.name.fr.localeCompare(b.name.fr, 'fr'));

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(result, null, 2) + '\n');

  const sizeKB = ((await stat(OUT_PATH)).size / 1024).toFixed(1);
  console.log(
    `\nWrote ${path.relative(ROOT, OUT_PATH)} (${result.length} dishes, ${sizeKB} KB)`,
  );
  if (unresolved.length > 0) {
    console.log(
      `  · ${unresolved.length} dishes dropped (location did not resolve):`,
    );
    for (const u of unresolved) console.log(`    – ${u}`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
