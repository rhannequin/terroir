import { describe, expect, it } from 'vitest';
import { classifyAop } from './aop';

describe('classifyAop', () => {
  it('classifies the canonical IGP value as IGP', () => {
    expect(classifyAop('IGP')).toBe('igp');
    expect(classifyAop('igp')).toBe('igp');
  });

  it("classifies the legacy 'IG' value as IGP", () => {
    expect(classifyAop('IG')).toBe('igp');
  });

  it('treats AOP, AOC and unknown values as AOP', () => {
    expect(classifyAop('AOP')).toBe('aop');
    expect(classifyAop('AOC')).toBe('aop');
    expect(classifyAop('something-else')).toBe('aop');
  });

  it('treats null and empty input as AOP', () => {
    expect(classifyAop(null)).toBe('aop');
    expect(classifyAop('')).toBe('aop');
    expect(classifyAop('   ')).toBe('aop');
  });
});
