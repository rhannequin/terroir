import { describe, expect, it } from 'vitest';
import { escapeHtml, normalize } from './text';

describe('normalize', () => {
  it('lowercases ASCII text', () => {
    expect(normalize('Bordeaux')).toBe('bordeaux');
  });

  it('strips French diacritics so accented and unaccented match', () => {
    expect(normalize('Pâté en croûte')).toBe('pate en croute');
    expect(normalize('Comté')).toBe(normalize('comte'));
  });

  it('handles cedilla, oeuf-style ligatures and tildes', () => {
    expect(normalize('Niçoise')).toBe('nicoise');
    expect(normalize('Mañana')).toBe('manana');
  });

  it('returns empty string for empty input', () => {
    expect(normalize('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml('<a href="x">b & c</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;b &amp; c&lt;/a&gt;',
    );
  });

  it('escapes single quotes too (safe inside attribute values)', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('returns the input unchanged when no escapable characters are present', () => {
    expect(escapeHtml('plain text')).toBe('plain text');
  });
});
