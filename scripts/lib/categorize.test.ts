import { describe, expect, it } from 'vitest';
import { categorizeProduct } from './categorize';

describe('categorizeProduct', () => {
  const cases: [string, string, string][] = [
    ['Vins', 'Vin tranquille', 'wine'],
    ['Vins', 'Vin mousseux', 'wine'],
    ['Eaux-de-vie de vin et de marc', 'Eaux-de-vie de vin', 'spirit'],
    ['Autres boissons alcoolisées', 'Cidre', 'cider'],
    ['Autres boissons alcoolisées', 'Poiré', 'cider'],
    ['Eaux-de-vie de cidre et de poiré', 'Eaux-de-vie de cidre et de poiré', 'spirit'],
    ['Fromages', 'Pâte pressée non cuite', 'cheese'],
    ['Viandes (et abats) frais', 'Volaille', 'meat'],
    ['Produits à base de viande (cuits, salés, fumés, etc.)', 'Charcuterie', 'charcuterie'],
    ['Poissons, mollusques, crustacés frais et produits dérivés', 'Poisson', 'seafood'],
    ['Huiles et matières grasses (beurre, margarine, huiles, etc.)', 'Huile', 'oil'],
    ['Huiles et matières grasses (beurre, margarine, huiles, etc.)', 'Beurre', 'cheese'],
    ['Huiles et matières grasses (beurre, margarine, huiles, etc.)', 'Crème', 'cheese'],
    ["Fruits, légumes et céréales en l'état ou transformés", 'Légume-feuille', 'produce'],
    ["Fruits, légumes et céréales en l'état ou transformés", 'Olive', 'produce'],
    ["Autres produits d'origine animale (oeufs, miel, etc.)", 'Miel', 'honey'],
    ['Sel', 'Sel', 'other'],
    ['Pâtes alimentaires', 'Pâtes', 'other'],
    ['', '', 'other'],
  ];

  for (const [cls, cat, expected] of cases) {
    it(`${cls || '∅'} / ${cat || '∅'} → ${expected}`, () => {
      expect(categorizeProduct(cls, cat)).toBe(expected);
    });
  }

  it('handles undefined input', () => {
    expect(categorizeProduct(undefined, undefined)).toBe('other');
  });
});
