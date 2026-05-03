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

const DAIRY = new Set(['beurre', 'crème', 'lait', 'yaourt']);

export function categorizeProduct(
  classeUe: string | undefined,
  categorie: string | undefined,
): ProductCategory {
  const cls = classeUe?.toLowerCase() ?? '';
  const cat = categorie?.toLowerCase() ?? '';

  if (DAIRY.has(cat)) return 'cheese';
  if (cat === 'miel') return 'honey';
  if (cat === 'cidre' || cat === 'poiré') return 'cider';
  if (cls.startsWith('vin')) return 'wine';
  if (cls.startsWith('eaux-de-vie')) return 'spirit';
  if (cls.startsWith('autres boissons alcoolis')) return 'spirit';
  if (cls === 'fromages') return 'cheese';
  if (cls.startsWith('viandes')) return 'meat';
  if (cls.startsWith('produits à base de viande')) return 'charcuterie';
  if (cls.startsWith('poissons')) return 'seafood';
  if (cls.startsWith('huiles')) return 'oil';
  if (cls.startsWith('fruits, légumes')) return 'produce';
  return 'other';
}
