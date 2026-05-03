export type FilterType = 'aop' | 'igp' | 'dish';

export const PRODUCT_CATEGORIES = [
  'wine',
  'spirit',
  'cider',
  'cheese',
  'meat',
  'charcuterie',
  'seafood',
  'oil',
  'produce',
  'honey',
  'other',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

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
  categories: Set<ProductCategory>;
  search: string;
}

export interface FilterApplied {
  count: number;
  total: number;
  byType: Record<FilterType, number>;
  byCategory: Record<ProductCategory, number>;
}
