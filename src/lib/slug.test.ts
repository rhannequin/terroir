import { describe, expect, it } from 'vitest';
import { buildSlugMap, slugify } from './slug';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Comté')).toBe('comte');
    expect(slugify('Brie de Meaux')).toBe('brie-de-meaux');
  });

  it('drops apostrophes and curly apostrophes', () => {
    expect(slugify("Agneau de l'Aveyron")).toBe('agneau-de-laveyron');
    expect(slugify('Pomme de terre de l’Île de Ré')).toBe(
      'pomme-de-terre-de-lile-de-re',
    );
  });

  it('collapses runs of separators and trims them', () => {
    expect(slugify('  Foie --- Gras  ')).toBe('foie-gras');
    expect(slugify("Provence-Alpes-Côte d'Azur")).toBe(
      'provence-alpes-cote-dazur',
    );
  });

  it('strips diacritics and ligatures', () => {
    expect(slugify('Bœuf de Charolles')).toBe('boeuf-de-charolles');
  });
});

describe('buildSlugMap', () => {
  it('returns base slugs when names are unique', () => {
    const map = buildSlugMap([
      { ida: 1, name: 'Comté' },
      { ida: 2, name: 'Brie de Meaux' },
    ]);
    expect(map.get(1)).toBe('comte');
    expect(map.get(2)).toBe('brie-de-meaux');
  });

  it('appends ida when multiple AOPs share the same slug', () => {
    const map = buildSlugMap([
      { ida: 1, name: 'Pruneaux' },
      { ida: 2, name: 'Pruneaux' },
      { ida: 3, name: 'Cassis' },
    ]);
    expect(map.get(1)).toBe('pruneaux-1');
    expect(map.get(2)).toBe('pruneaux-2');
    expect(map.get(3)).toBe('cassis');
  });
});
