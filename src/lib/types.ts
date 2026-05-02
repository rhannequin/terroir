export type FilterType = 'aop' | 'igp' | 'dish';

export type LocateErrorCode =
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface NearbyItem {
  id: string;
  type: FilterType;
  name: string;
  sub: string;
  distanceKm: number;
}

export interface FilterState {
  types: Set<FilterType>;
  search: string;
}

export interface FilterApplied {
  count: number;
  total: number;
  byType: Record<FilterType, number>;
}
