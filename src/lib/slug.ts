import { normalize } from './text';

export function slugify(name: string): string {
  return normalize(name)
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/['’‘ʼ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface SluggedAop {
  ida: number;
  name: string;
}

export function buildSlugMap<T extends SluggedAop>(
  aops: T[],
): Map<number, string> {
  const counts = new Map<string, number>();
  for (const a of aops) {
    const base = slugify(a.name);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  const out = new Map<number, string>();
  for (const a of aops) {
    const base = slugify(a.name);
    out.set(a.ida, (counts.get(base) ?? 0) > 1 ? `${base}-${a.ida}` : base);
  }
  return out;
}
