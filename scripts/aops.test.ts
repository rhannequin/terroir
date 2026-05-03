import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { PRODUCT_CATEGORIES, type ProductCategory } from './lib/categorize';

interface Aop {
  ida: number;
  name: string;
  signeUE: string | null;
  products: string[];
  category: ProductCategory;
  region: string;
  centroid: [number, number];
}

const KNOWN_CATEGORIES = new Set<string>(PRODUCT_CATEGORIES);

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const AOPS_PATH = path.join(ROOT, 'public/data/aops.json');

let aops: Aop[];

beforeAll(async () => {
  const raw = await readFile(AOPS_PATH, 'utf-8');
  aops = JSON.parse(raw);
});

describe('public/data/aops.json', () => {
  it('contains a plausible number of AOPs', () => {
    expect(aops.length).toBeGreaterThan(1000);
    expect(aops.length).toBeLessThan(2000);
  });

  it('has the expected shape on every entry', () => {
    for (const a of aops) {
      expect(typeof a.ida, `entry ${a.ida}: ida`).toBe('number');
      expect(typeof a.name, `entry ${a.ida}: name`).toBe('string');
      expect(a.name.length, `entry ${a.ida}: empty name`).toBeGreaterThan(0);
      expect(Array.isArray(a.products), `entry ${a.ida}: products`).toBe(true);
      expect(typeof a.region, `entry ${a.ida}: region`).toBe('string');
      expect(Array.isArray(a.centroid), `entry ${a.ida}: centroid array`).toBe(
        true,
      );
      expect(a.centroid, `entry ${a.ida}: centroid length`).toHaveLength(2);
      expect(
        KNOWN_CATEGORIES.has(a.category),
        `entry ${a.ida}: unknown category ${a.category}`,
      ).toBe(true);
    }
  });

  it('puts most AOPs in the wine bucket', () => {
    const wines = aops.filter((a) => a.category === 'wine').length;
    expect(wines / aops.length).toBeGreaterThan(0.5);
  });

  it.each([
    ['Roquefort', 'cheese'],
    ['Camembert de Normandie', 'cheese'],
    ['Comté', 'cheese'],
    ['Brie de Meaux', 'cheese'],
    ['Châteauneuf-du-Pape', 'wine'],
    ['Champagne', 'wine'],
    ['Bordeaux', 'wine'],
    ['Hermitage', 'wine'],
    ['Chambolle-Musigny premier cru Les Véroilles', 'wine'],
  ])('%s is %s', (name, expected) => {
    const a = aops.find((x) => x.name === name);
    expect(a?.category).toBe(expected);
  });

  it('has no duplicate IDA values', () => {
    const idas = new Set(aops.map((a) => a.ida));
    expect(idas.size).toBe(aops.length);
  });

  it('has finite, non-zero centroid coordinates within Earth bounds', () => {
    for (const a of aops) {
      const [lng, lat] = a.centroid;
      expect(Number.isFinite(lng), `${a.name}: lng not finite`).toBe(true);
      expect(Number.isFinite(lat), `${a.name}: lat not finite`).toBe(true);
      expect(lng !== 0 || lat !== 0, `${a.name}: centroid is (0,0)`).toBe(true);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });

  it('has most centroids inside metropolitan France', () => {
    const inMetro = aops.filter(
      ({ centroid: [lng, lat] }) =>
        lng >= -5.5 && lng <= 10 && lat >= 41 && lat <= 51.5,
    ).length;
    expect(inMetro / aops.length).toBeGreaterThan(0.95);
  });
});
