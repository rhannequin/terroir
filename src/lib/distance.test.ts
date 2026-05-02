import { describe, expect, it } from 'vitest';
import { formatDistanceParts, haversineKm } from './distance';

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(48.85, 2.35, 48.85, 2.35)).toBe(0);
  });

  it('approximates the Paris–Marseille great-circle distance (~661 km)', () => {
    const km = haversineKm(48.8566, 2.3522, 43.2965, 5.3698);
    expect(km).toBeGreaterThan(655);
    expect(km).toBeLessThan(670);
  });

  it('is symmetric in its arguments', () => {
    const a = haversineKm(48.85, 2.35, 43.3, 5.4);
    const b = haversineKm(43.3, 5.4, 48.85, 2.35);
    expect(a).toBeCloseTo(b, 9);
  });
});

describe('formatDistanceParts', () => {
  it('uses metres rounded to the nearest 10 below 1 km', () => {
    expect(formatDistanceParts(0.1234)).toEqual({ unit: 'm', value: 120 });
    expect(formatDistanceParts(0.456)).toEqual({ unit: 'm', value: 460 });
  });

  it('floors very short distances to a 10 m minimum', () => {
    expect(formatDistanceParts(0)).toEqual({ unit: 'm', value: 10 });
    expect(formatDistanceParts(0.003)).toEqual({ unit: 'm', value: 10 });
  });

  it('keeps one-decimal precision for short kilometres (1 ≤ km < 10)', () => {
    expect(formatDistanceParts(2.4)).toEqual({ unit: 'km', value: 2.4 });
    expect(formatDistanceParts(9.9)).toEqual({ unit: 'km', value: 9.9 });
  });

  it('rounds to whole kilometres at 10 km and above', () => {
    expect(formatDistanceParts(10)).toEqual({ unit: 'km', value: 10 });
    expect(formatDistanceParts(123.4)).toEqual({ unit: 'km', value: 123 });
  });
});
