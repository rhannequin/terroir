import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSlugMap } from './slug';
import type { AopRecord } from './types';

const DATA_PATH = path.join(process.cwd(), 'public/data/aops.json');

export interface AopWithSlug {
  aop: AopRecord;
  slug: string;
}

let cache: AopWithSlug[] | null = null;

export async function loadAopsWithSlugs(): Promise<AopWithSlug[]> {
  if (cache) return cache;
  const text = await readFile(DATA_PATH, 'utf-8');
  const aops = JSON.parse(text) as AopRecord[];
  const slugs = buildSlugMap(aops);
  cache = aops.map((aop) => ({ aop, slug: slugs.get(aop.ida)! }));
  return cache;
}

export async function getAopStaticPaths(): Promise<
  Array<{ params: { slug: string }; props: { aop: AopRecord; slug: string } }>
> {
  const items = await loadAopsWithSlugs();
  return items.map(({ aop, slug }) => ({
    params: { slug },
    props: { aop, slug },
  }));
}
