import { describe, expect, it } from 'vitest';
import { defaultLang, htmlLang, ui } from './ui';

describe('i18n', () => {
  it('keeps the same translation keys across all locales', () => {
    const frKeys = Object.keys(ui.fr).sort();
    const enKeys = Object.keys(ui.en).sort();
    expect(frKeys).toEqual(enKeys);
  });

  it('uses en-GB for the English HTML lang attribute', () => {
    expect(htmlLang.en).toBe('en-GB');
    expect(htmlLang.fr).toBe('fr');
  });

  it('defaults to French', () => {
    expect(defaultLang).toBe('fr');
  });
});
