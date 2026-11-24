import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../config/theme';
import type { UserRole } from '../../models/user.model';

export function AdminMenu({ role }: { role: UserRole }) {
  if (role !== 'ADMIN') return null;

  return (
    <Link href="/(protected)/users" asChild>
      <Pressable style={styles.link}>
        <Text style={styles.text}>Administración de usuarios</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { paddingVertical: 12 },
  text: { color: theme.colors.primary, fontWeight: '600' },
});
