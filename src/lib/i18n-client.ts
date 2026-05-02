import { ui, type Lang } from '../i18n/ui';

export function getLang(): Lang {
  return document.documentElement.lang.startsWith('fr') ? 'fr' : 'en';
}

export function localeFor(lang: Lang): string {
  return lang === 'fr' ? 'fr-FR' : 'en-GB';
}

export interface ClientI18n {
  lang: Lang;
  t: (typeof ui)[Lang];
  locale: string;
  numberFmt: Intl.NumberFormat;
  pluralRules: Intl.PluralRules;
}

export function getClientI18n(): ClientI18n {
  const lang = getLang();
  const locale = localeFor(lang);
  return {
    lang,
    t: ui[lang],
    locale,
    numberFmt: new Intl.NumberFormat(locale),
    pluralRules: new Intl.PluralRules(locale),
  };
}

export function pluralKey(
  rules: Intl.PluralRules,
  count: number,
): 'one' | 'other' {
  return rules.select(count) === 'one' ? 'one' : 'other';
}
