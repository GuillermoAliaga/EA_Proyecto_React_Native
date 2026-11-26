const CATEGORY_LABELS: Record<string, string> = {
  SPORT: 'Deportes',
  LEISURE: 'Ocio',
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  BASKETBALL: 'Baloncesto',
  RUNNING: 'Running',
  ARCADE: 'Arcade & Lucha',
  TCG_BOARDGAMES: 'TCG y Juegos de Mesa',
};

export function categoryLabel(slug: string, fallback?: string): string {
  return CATEGORY_LABELS[slug.toUpperCase()] ?? fallback ?? slug;
}

export function subcategoryLabel(slug: string, fallback?: string): string {
  return SUBCATEGORY_LABELS[slug.toUpperCase()] ?? fallback ?? slug;
}
