import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function ActivitiesMap(_props: Record<string, unknown>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa interactivo (solo móvil)</Text>
      <Text style={styles.subtitle}>
        Abre la aplicación en Expo Go (Android o iOS) para visualizar el mapa y las rutas de actividades.
      </Text>
    </View>
  );
}

export default ActivitiesMap;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
});