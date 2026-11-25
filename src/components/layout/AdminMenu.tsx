import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { UserRole } from '../../models/user.model';

export function AdminMenu({ role }: { role: UserRole }) {
  const { colors } = useTheme();
  if (role !== 'ADMIN') return null;
  return (
    <View style={styles.container}>
      <Link href="/(protected)/users" asChild>
        <Pressable accessibilityRole="button" style={styles.link}>
          <Text style={[styles.text, { color: colors.primary }]}>Usuarios</Text>
        </Pressable>
      </Link>
      <Link href="/(protected)/reports" asChild>
        <Pressable accessibilityRole="button" style={styles.link}>
          <Text style={[styles.text, { color: colors.primary }]}>Denuncias</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 },
  link: { paddingVertical: 8 },
  text: { fontSize: 13, fontWeight: '600' },
});
