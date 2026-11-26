import { ApiError, apiClient } from './apiClient';

export interface CategoryOption {
  _id?: string;
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
  deleted?: boolean;
}

// These definitions match the backend's getSeedCategories() data.
const INITIAL_BACKEND_CATEGORIES = [
  {
    name: 'Deportes',
    slug: 'SPORT',
    subcategories: [
      { name: 'Baloncesto', slug: 'BASKETBALL' },
      { name: 'Running', slug: 'RUNNING' },
    ],
  },
  {
    name: 'Ocio',
    slug: 'LEISURE',
    subcategories: [
      { name: 'Arcade', slug: 'ARCADE' },
      { name: 'Juegos de mesa y TCG', slug: 'TCG_BOARDGAMES' },
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
    ...(typeof record?.deleted === 'boolean' ? { deleted: record.deleted } : {}),
  };
}

export async function getCategories(
  signal?: AbortSignal,
): Promise<CategoryOption[]> {
  const response = await apiClient<unknown>('/categories', { signal });
  const record = recordOf(response);
  const values = Array.isArray(response)
    ? response
    : Array.isArray(record?.data)
      ? record.data
      : Array.isArray(record?.items)
        ? record.items
        : [];
  return values
    .map(normalizeCategory)
    .filter((item): item is CategoryOption => item !== null && item.deleted !== true);
}

/** Creates missing built-in categories through the admin-only backend endpoint. */
export async function initializeDefaultCategories(): Promise<CategoryOption[]> {
  let categories = await getCategories();

  for (const definition of INITIAL_BACKEND_CATEGORIES) {
    if (categories.some((category) => category.slug === definition.slug)) continue;

    try {
      await apiClient('/categories', { method: 'POST', body: definition });
    } catch (error) {
      // Another admin may have created the category at the same time.
      if (!(error instanceof ApiError && error.status === 409)) throw error;
    }
    categories = await getCategories();
  }

  return categories;
}
