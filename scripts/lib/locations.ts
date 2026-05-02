/**
 * Location types and centroid resolver shared by the AOP and dishes builders.
 *
 * Dishes can be tied to a specific commune (Bouillabaisse → Marseille), a whole
 * département (Tartiflette → Haute-Savoie), a région (Crêpe bretonne → Bretagne),
 * or a bespoke area that doesn't match any administrative boundary (Aubrac,
 * Pays Basque, Périgord). Pick the resolution that fits the dish.
 *
 * geo.api.gouv.fr only exposes `centre` on the /communes endpoint, so
 * département and région centroids are computed by surface-weighted averaging
 * of their member communes.
 */

export type DishLocation =
  | { type: 'commune'; insee: string }
  | { type: 'department'; code: string }
  | { type: 'region'; code: string }
  | { type: 'area'; name: string; centroid: [number, number] };

export interface CentroidMaps {
  communes: Map<string, [number, number]>;
  departments: Map<string, [number, number]>;
  regions: Map<string, [number, number]>;
}

export function resolveLocation(
  loc: DishLocation,
  maps: CentroidMaps,
): [number, number] | null {
  switch (loc.type) {
    case 'commune':
      return maps.communes.get(loc.insee) ?? null;
    case 'department':
      return maps.departments.get(loc.code) ?? null;
    case 'region':
      return maps.regions.get(loc.code) ?? null;
    case 'area':
      return loc.centroid;
  }
}

interface CommuneFeature {
  code: string;
  centre?: { coordinates: [number, number] };
  codeDepartement?: string;
  codeRegion?: string;
  /** Area in hectares; absent for some non-metropolitan/synthetic codes. */
  surface?: number;
}

interface WeightedSum {
  lng: number;
  lat: number;
  weight: number;
}

function add(
  map: Map<string, WeightedSum>,
  key: string,
  lng: number,
  lat: number,
  w: number,
): void {
  const s = map.get(key) ?? { lng: 0, lat: 0, weight: 0 };
  s.lng += lng * w;
  s.lat += lat * w;
  s.weight += w;
  map.set(key, s);
}

function finalise(
  sums: Map<string, WeightedSum>,
): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  for (const [key, s] of sums) {
    if (s.weight > 0) out.set(key, [s.lng / s.weight, s.lat / s.weight]);
  }
  return out;
}

/**
 * Builds commune, department and region centroid maps from the
 * geo.api.gouv.fr /communes payload. The URL must request `centre`,
 * `codeDepartement`, `codeRegion` (and ideally `surface`) fields.
 */
export function buildCentroidMaps(rawJson: string): CentroidMaps {
  const features = JSON.parse(rawJson) as CommuneFeature[];
  const communes = new Map<string, [number, number]>();
  const deptSums = new Map<string, WeightedSum>();
  const regionSums = new Map<string, WeightedSum>();

  for (const f of features) {
    if (!f.code || !f.centre?.coordinates) continue;
    const [lng, lat] = f.centre.coordinates;
    const weight = f.surface && f.surface > 0 ? f.surface : 1;

    communes.set(f.code, [lng, lat]);
    if (f.codeDepartement) add(deptSums, f.codeDepartement, lng, lat, weight);
    if (f.codeRegion) add(regionSums, f.codeRegion, lng, lat, weight);
  }

  return {
    communes,
    departments: finalise(deptSums),
    regions: finalise(regionSums),
  };
}
