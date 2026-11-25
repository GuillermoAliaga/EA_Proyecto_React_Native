import { CATEGORIES, SUBCATEGORIES } from '../models/activity.model';
import { apiClient } from './apiClient';

export interface CategoryOption {
  _id?: string;
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
}

export const FALLBACK_CATEGORIES: CategoryOption[] = [
  {
    name: 'Sport',
    slug: CATEGORIES[0],
    subcategories: [
      { name: 'Baloncesto', slug: SUBCATEGORIES[0] },
      { name: 'Running', slug: SUBCATEGORIES[1] },
    ],
  },
  {
    name: 'Ocio',
    slug: CATEGORIES[1],
    subcategories: [
      { name: 'Arcade', slug: SUBCATEGORIES[2] },
      { name: 'Juegos de mesa y TCG', slug: SUBCATEGORIES[3] },
    ],
  },
];

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeCategory(value: unknown): CategoryOption | null {
  const record = recordOf(value);
  const name = typeof value === 'string'
    ? value
    : String(record?.name ?? record?.slug ?? '').trim();
  const slug = typeof value === 'string'
    ? value.trim().toUpperCase()
    : String(record?.slug ?? record?.name ?? '').trim().toUpperCase();
  if (!slug) return null;

  const rawSubcategories = Array.isArray(record?.subcategories) ? record.subcategories : [];
  const subcategories = rawSubcategories
    .map((item) => {
      const subcategory = recordOf(item);
      const subName = typeof item === 'string'
        ? item
        : String(subcategory?.name ?? subcategory?.slug ?? '').trim();
      const subSlug = typeof item === 'string'
        ? item.trim().toUpperCase()
        : String(subcategory?.slug ?? subcategory?.name ?? '').trim().toUpperCase();
      return subSlug ? { name: subName, slug: subSlug } : null;
    })
    .filter((item): item is { name: string; slug: string } => item !== null);

  return {
    ...(typeof record?._id === 'string' ? { _id: record._id } : {}),
    name,
    slug,
    subcategories,
  };
}

export async function getCategories(signal?: AbortSignal): Promise<CategoryOption[]> {
  try {
    const response = await apiClient<unknown>('/categories', { signal });
    const record = recordOf(response);
    const values = Array.isArray(response)
      ? response
      : Array.isArray(record?.data)
        ? record.data
        : Array.isArray(record?.items)
          ? record.items
          : [];
    const categories = values
      .map(normalizeCategory)
      .filter((item): item is CategoryOption => item !== null);
    return categories.length ? categories : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}
