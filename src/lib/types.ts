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

export type DishCategory =
  | 'main'
  | 'soup'
  | 'starter'
  | 'side'
  | 'charcuterie'
  | 'cheese-dish'
  | 'pastry'
  | 'dessert'
  | 'snack';

export interface AopRecord {
  ida: number;
  name: string;
  signeUE: string | null;
  products: string[];
  category: ProductCategory;
  region: string;
  centroid: [number, number];
}

export interface DishRecord {
  id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  category: DishCategory;
  region: string;
  centroid: [number, number];
}

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
