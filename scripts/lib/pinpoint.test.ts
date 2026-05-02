import { describe, expect, it } from 'vitest';
import { findPinpointCentroid, type PinpointCommune } from './pinpoint';

const communes = new Map<string, PinpointCommune>([
  ['11069', { name: 'Castelnaudary', centroid: [1.95, 43.32] }],
  ['11422', { name: 'Lasbordes', centroid: [1.97, 43.32] }],
  ['33063', { name: 'Bordeaux', centroid: [-0.58, 44.84] }],
  ['33550', { name: 'Talence', centroid: [-0.59, 44.8] }],
]);

describe('findPinpointCentroid', () => {
  it('pins the AOP to its eponymous commune when one exists', () => {
    expect(
      findPinpointCentroid(
        'Cassoulet de Castelnaudary',
        ['11069', '11422'],
        communes,
      ),
    ).toEqual([1.95, 43.32]);
  });

  it('matches the longest eponymous commune name when multiple are mentioned', () => {
    const wide = new Map<string, PinpointCommune>([
      ['1', { name: 'Pauillac', centroid: [-0.74, 45.2] }],
      ['2', { name: 'Haut-Médoc', centroid: [-0.7, 45.18] }],
    ]);
    expect(
      findPinpointCentroid('Haut-Médoc Pauillac', ['1', '2'], wide),
    ).toEqual([-0.7, 45.18]);
  });

  it('returns null when no commune name appears in the AOP name', () => {
    expect(
      findPinpointCentroid("Vin de l'Orléanais", ['33063'], communes),
    ).toBeNull();
  });

  it('ignores commune names shorter than 4 characters to avoid false positives', () => {
    const tiny = new Map<string, PinpointCommune>([
      ['x', { name: 'Aix', centroid: [5.45, 43.53] }],
    ]);
    expect(findPinpointCentroid('Aix-en-Provence', ['x'], tiny)).toBeNull();
  });

  it('matches case- and accent-insensitively', () => {
    const accented = new Map<string, PinpointCommune>([
      ['m', { name: 'Sète', centroid: [3.7, 43.4] }],
    ]);
    expect(
      findPinpointCentroid('Bourride sétoise', ['m'], accented),
    ).toBeNull();
    expect(findPinpointCentroid('De SETE blah', ['m'], accented)).toEqual([
      3.7, 43.4,
    ]);
  });
});
