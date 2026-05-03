import { describe, expect, it } from 'vitest';
import {
  buildCentroidMaps,
  resolveLocation,
  type CentroidMaps,
  type DishLocation,
} from './locations';

const maps: CentroidMaps = {
  communes: new Map([['13055', [5.4, 43.3]]]),
  departments: new Map([['74', [6.5, 46.0]]]),
  regions: new Map([['53', [-2.8, 48.2]]]),
};

describe('resolveLocation', () => {
  it('looks up commune centroids by INSEE code', () => {
    const loc: DishLocation = { type: 'commune', insee: '13055' };
    expect(resolveLocation(loc, maps)).toEqual([5.4, 43.3]);
  });

  it('looks up department centroids by code', () => {
    const loc: DishLocation = { type: 'department', code: '74' };
    expect(resolveLocation(loc, maps)).toEqual([6.5, 46.0]);
  });

  it('looks up region centroids by code', () => {
    const loc: DishLocation = { type: 'region', code: '53' };
    expect(resolveLocation(loc, maps)).toEqual([-2.8, 48.2]);
  });

  it('returns the bespoke centroid for area locations', () => {
    const loc: DishLocation = {
      type: 'area',
      name: 'Aubrac',
      centroid: [2.85, 44.62],
    };
    expect(resolveLocation(loc, maps)).toEqual([2.85, 44.62]);
  });

  it('returns the geographic centre of France for national dishes', () => {
    expect(resolveLocation({ type: 'national' }, maps)).toEqual([
      2.4554, 46.6033,
    ]);
  });

  it('returns null for unknown codes', () => {
    expect(
      resolveLocation({ type: 'commune', insee: '00000' }, maps),
    ).toBeNull();
    expect(
      resolveLocation({ type: 'department', code: '99' }, maps),
    ).toBeNull();
    expect(resolveLocation({ type: 'region', code: '99' }, maps)).toBeNull();
  });
});

describe('buildCentroidMaps', () => {
  it('aggregates communes into commune, department and region centroid maps', () => {
    const json = JSON.stringify([
      // Two communes in dept 01 / region 84
      {
        code: '01001',
        centre: { coordinates: [5.0, 46.0] },
        codeDepartement: '01',
        codeRegion: '84',
        surface: 100,
      },
      {
        code: '01002',
        centre: { coordinates: [6.0, 47.0] },
        codeDepartement: '01',
        codeRegion: '84',
        surface: 100,
      },
      // One in dept 13 / region 93
      {
        code: '13055',
        centre: { coordinates: [5.4, 43.3] },
        codeDepartement: '13',
        codeRegion: '93',
        surface: 240,
      },
    ]);
    const maps = buildCentroidMaps(json);
    expect(maps.communes.size).toBe(3);
    expect(maps.communes.get('01001')).toEqual([5.0, 46.0]);
    // dept 01 = mean of equal-weight communes
    expect(maps.departments.get('01')).toEqual([5.5, 46.5]);
    // region 84 = same (its only communes are the two in dept 01)
    expect(maps.regions.get('84')).toEqual([5.5, 46.5]);
    expect(maps.departments.get('13')).toEqual([5.4, 43.3]);
  });

  it('uses surface as the weight when present', () => {
    const json = JSON.stringify([
      {
        code: 'A',
        centre: { coordinates: [0, 0] },
        codeDepartement: 'D',
        surface: 1,
      },
      {
        code: 'B',
        centre: { coordinates: [10, 10] },
        codeDepartement: 'D',
        surface: 9,
      },
    ]);
    const maps = buildCentroidMaps(json);
    // Weighted mean: (0*1 + 10*9)/10 = 9 for both axes
    expect(maps.departments.get('D')).toEqual([9, 9]);
  });

  it('skips communes missing a code or centre', () => {
    const json = JSON.stringify([
      {
        code: '01001',
        centre: { coordinates: [5.0, 46.0] },
        codeDepartement: '01',
      },
      { code: '', centre: { coordinates: [0, 0] } },
      { code: '03' },
    ]);
    const maps = buildCentroidMaps(json);
    expect(maps.communes.size).toBe(1);
    expect(maps.departments.size).toBe(1);
  });
});
