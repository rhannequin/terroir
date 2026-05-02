export const defaultLang = 'fr' as const;

export const languages = {
  fr: 'Français',
  en: 'English',
} as const;

export const htmlLang = {
  fr: 'fr',
  en: 'en-GB',
} as const;

export const ui = {
  fr: {
    'site.title': 'Terroir',
  },
  en: {
    'site.title': 'Terroir',
  },
} as const;

export type Lang = keyof typeof ui;
