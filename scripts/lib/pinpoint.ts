import { normalize } from '../../src/lib/text';

export interface PinpointCommune {
  name: string | null;
  centroid: [number, number];
}

function normalizeForMatch(s: string): string {
  return normalize(s).replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function findPinpointCentroid(
  aopName: string,
  memberCommunes: Iterable<string>,
  communeByCode: Map<string, PinpointCommune>,
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
