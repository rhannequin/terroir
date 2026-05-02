import { describe, expect, it } from 'vitest';
import { parseCSV } from './csv';

describe('parseCSV', () => {
  it('splits unquoted fields on the semicolon delimiter', () => {
    expect(parseCSV('a;b;c\nd;e;f')).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ]);
  });

  it('preserves empty fields, including a trailing empty field', () => {
    expect(parseCSV('a;;c\n;b;')).toEqual([
      ['a', '', 'c'],
      ['', 'b', ''],
    ]);
  });

  it('treats semicolons inside quoted fields as content, not delimiters', () => {
    expect(parseCSV('"a;b";c')).toEqual([['a;b', 'c']]);
  });

  it('decodes escaped double quotes ("") inside quoted fields', () => {
    expect(parseCSV('"a""b";c')).toEqual([['a"b', 'c']]);
  });

  it('handles CRLF line endings identically to LF', () => {
    expect(parseCSV('a;b\r\nc;d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('does not emit a phantom empty row for a trailing newline', () => {
    expect(parseCSV('a;b\n')).toEqual([['a', 'b']]);
  });

  it('mixes quoted and unquoted fields on the same row', () => {
    expect(parseCSV('"a";b;"c"')).toEqual([['a', 'b', 'c']]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });
});
