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
    'aop.product.one': 'produit',
    'aop.product.other': 'produits',
    'map.label': 'Carte interactive des AOP françaises',
    'error.dataLoad': 'Impossible de charger les données des AOP.',
    'error.retry': 'Réessayer',
  },
  en: {
    'site.title': 'Terroir',
    'aop.product.one': 'product',
    'aop.product.other': 'products',
    'map.label': 'Interactive map of French AOPs',
    'error.dataLoad': 'Failed to load AOP data.',
    'error.retry': 'Try again',
  },
} as const;

export type Lang = keyof typeof ui;
