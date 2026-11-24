import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../config/theme';

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, paddingVertical: 8 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15 },
});
