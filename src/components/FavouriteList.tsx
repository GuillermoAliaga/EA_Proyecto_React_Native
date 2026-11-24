import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';

import { $favouritesList } from '../stores/favourites';
import { FavouriteButton } from './FavouriteButton';

export function FavouritesList() {
  const books = useStore($favouritesList);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis favoritos</Text>
      <Text style={styles.subtitle}>
        {books.length} {books.length === 1 ? 'libro' : 'libros'}
      </Text>

      <FlatList
        data={books}
        keyExtractor={(book) => book._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <FavouriteButton book={item} />
          </View>
        )}
        contentContainerStyle={books.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Todavía no tienes favoritos</Text>
            <Text style={styles.emptySubtitle}>Marca la estrella de un libro para verlo aquí</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 12 },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' },
  emptyContainer: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#475569' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8' },
});