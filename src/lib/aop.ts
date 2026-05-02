import type { FilterType } from './types';

export function classifyAop(signe: string | null): FilterType {
  const s = signe?.trim().toLowerCase() ?? '';
  if (s === 'igp' || s === 'ig') return 'igp';
  return 'aop';
}
