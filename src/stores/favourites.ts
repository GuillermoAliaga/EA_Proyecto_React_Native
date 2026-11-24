import { atom, computed } from 'nanostores';

import type { Book } from '../models';

export const $favourites = atom<Record<string, Book>>({});

export const $favouritesList = computed($favourites, (favourites) => Object.values(favourites));

export const toggleFavourite = (book: Book) => {
  const current = $favourites.get();

  if (current[book._id]) {
    const { [book._id]: _removed, ...rest } = current;
    $favourites.set(rest);
  } else {
    $favourites.set({ ...current, [book._id]: book });
  }
};