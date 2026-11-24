import { Pressable, StyleSheet, Text } from 'react-native';
import { useStore } from '@nanostores/react';

import type { Book } from '../models';
import { $favourites, toggleFavourite } from '../stores/favourites';

export function FavouriteButton({ book }: { book: Book }) {
  // useStore hace que el componente se repinte cuando cambian los favoritos
  const favourites = useStore($favourites);
  const isFavourite = Boolean(favourites[book._id]);

  return (
    <Pressable
      onPress={() => toggleFavourite(book)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavourite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      accessibilityState={{ selected: isFavourite }}
      style={styles.button}
    >
      <Text style={styles.star}>{isFavourite ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4 },
  star: { fontSize: 24 },
});