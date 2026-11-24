import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../config/theme';

export function AppBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#e8eaf6',
  },
  label: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
});
