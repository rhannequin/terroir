import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

interface Dish {
  id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  category: string;
  region: string;
  locationType: string;
  centroid: [number, number];
}

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DISHES_PATH = path.join(ROOT, 'public/data/dishes.json');

let dishes: Dish[];

beforeAll(async () => {
  const raw = await readFile(DISHES_PATH, 'utf-8');
  dishes = JSON.parse(raw);
});

describe('public/data/dishes.json', () => {
  it('contains a reasonable number of dishes', () => {
    expect(dishes.length).toBeGreaterThan(50);
    expect(dishes.length).toBeLessThan(500);
  });

  it('has the expected shape on every entry', () => {
    for (const d of dishes) {
      expect(typeof d.id, `${d.id}: id`).toBe('string');
      expect(d.id.length, `${d.id}: empty id`).toBeGreaterThan(0);
      expect(typeof d.name?.fr, `${d.id}: name.fr`).toBe('string');
      expect(typeof d.name?.en, `${d.id}: name.en`).toBe('string');
      expect(typeof d.description?.fr, `${d.id}: description.fr`).toBe(
        'string',
      );
      expect(typeof d.description?.en, `${d.id}: description.en`).toBe(
        'string',
      );
      expect(typeof d.category, `${d.id}: category`).toBe('string');
      expect(typeof d.region, `${d.id}: region`).toBe('string');
      expect(['commune', 'department', 'region', 'area']).toContain(
        d.locationType,
      );
      expect(Array.isArray(d.centroid), `${d.id}: centroid array`).toBe(true);
      expect(d.centroid, `${d.id}: centroid length`).toHaveLength(2);
    }
  });

  it('has unique ids across the whole list', () => {
    const ids = new Set(dishes.map((d) => d.id));
    expect(ids.size).toBe(dishes.length);
  });

  it('has finite, non-zero centroid coordinates within Earth bounds', () => {
    for (const d of dishes) {
      const [lng, lat] = d.centroid;
      expect(Number.isFinite(lng), `${d.id}: lng not finite`).toBe(true);
      expect(Number.isFinite(lat), `${d.id}: lat not finite`).toBe(true);
      expect(lng !== 0 || lat !== 0, `${d.id}: centroid is (0,0)`).toBe(true);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });

  it('has most dishes located inside metropolitan France', () => {
    const inMetro = dishes.filter(
      ({ centroid: [lng, lat] }) =>
        lng >= -5.5 && lng <= 10 && lat >= 41 && lat <= 51.5,
    ).length;
    expect(inMetro / dishes.length).toBeGreaterThan(0.95);
  });
});
