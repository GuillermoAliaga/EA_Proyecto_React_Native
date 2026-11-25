import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AppButton } from './AppButton';

interface StateViewProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function LoadingView({ title = 'Cargando...' }: { title?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

export function EmptyView({ title, description, icon = '—' }: StateViewProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.icon, { color: colors.textSecondary }]}>{icon}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}
    </View>
  );
}

export function ErrorView({
  title = 'No se pudo completar la solicitud',
  description,
  onRetry,
}: Omit<StateViewProps, 'title'> & { title?: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.icon, { color: colors.danger }]}>!</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}
      <AppButton title="Reintentar" onPress={onRetry} style={styles.retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  icon: { fontSize: 36, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 15, textAlign: 'center' },
  retry: { marginTop: 8, minWidth: 150 },
});
