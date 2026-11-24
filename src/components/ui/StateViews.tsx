import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { theme } from '../../config/theme';
import { AppButton } from './AppButton';

interface StateViewProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function LoadingView({ title = 'Cargando...' }: { title?: string }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export function EmptyView({ title, description, icon = '—' }: StateViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function ErrorView({
  title = 'No se pudo completar la solicitud',
  description,
  onRetry,
}: Omit<StateViewProps, 'title'> & { title?: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.icon, styles.errorIcon]}>!</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
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
  icon: { color: theme.colors.textSecondary, fontSize: 36, fontWeight: '700' },
  errorIcon: { color: theme.colors.danger },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  description: { color: theme.colors.textSecondary, fontSize: 15, textAlign: 'center' },
  retry: { marginTop: 8, minWidth: 150 },
});
