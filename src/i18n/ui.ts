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
    'map.label': 'Carte interactive des AOP et plats français',
    'error.dataLoad': 'Impossible de charger les données.',
    'error.retry': 'Réessayer',
    'dish.category.main': 'Plat principal',
    'dish.category.soup': 'Soupe',
    'dish.category.starter': 'Entrée',
    'dish.category.side': 'Accompagnement',
    'dish.category.charcuterie': 'Charcuterie',
    'dish.category.cheese-dish': 'Plat fromager',
    'dish.category.pastry': 'Pâtisserie',
    'dish.category.dessert': 'Dessert',
    'dish.category.snack': 'En-cas',
    'filter.toggle': 'Filtres',
    'filter.title': 'Filtres',
    'filter.close': 'Fermer',
    'filter.type.legend': 'Type',
    'filter.type.aop': 'AOP',
    'filter.type.igp': 'IGP',
    'filter.type.dish': 'Plats',
    'filter.search.label': 'Rechercher',
    'filter.search.placeholder': 'Nom, produit, région…',
    'filter.reset': 'Tout réinitialiser',
    'filter.results.one': '{count} résultat',
    'filter.results.other': '{count} résultats',
  },
  en: {
    'site.title': 'Terroir',
    'aop.product.one': 'product',
    'aop.product.other': 'products',
    'map.label': 'Interactive map of French AOPs and dishes',
    'error.dataLoad': 'Failed to load data.',
    'error.retry': 'Try again',
    'dish.category.main': 'Main course',
    'dish.category.soup': 'Soup',
    'dish.category.starter': 'Starter',
    'dish.category.side': 'Side',
    'dish.category.charcuterie': 'Charcuterie',
    'dish.category.cheese-dish': 'Cheese dish',
    'dish.category.pastry': 'Pastry',
    'dish.category.dessert': 'Dessert',
    'dish.category.snack': 'Snack',
    'filter.toggle': 'Filters',
    'filter.title': 'Filters',
    'filter.close': 'Close',
    'filter.type.legend': 'Type',
    'filter.type.aop': 'AOP',
    'filter.type.igp': 'IGP',
    'filter.type.dish': 'Dishes',
    'filter.search.label': 'Search',
    'filter.search.placeholder': 'Name, product, region…',
    'filter.reset': 'Reset all',
    'filter.results.one': '{count} result',
    'filter.results.other': '{count} results',
  },
} as const;

export type Lang = keyof typeof ui;
