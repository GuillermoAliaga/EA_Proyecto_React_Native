import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { UserRole } from '../../models/user.model';

export function AdminMenu({ role }: { role: UserRole }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // AuthContext clears the local session even if the API cannot be reached.
    } finally {
      router.replace('/login');
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      {role === 'ADMIN' ? (
        <>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/users')}
            style={({ pressed }) => [
              styles.link,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.text, { color: colors.primary }]}>Usuarios</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/reports')}
            style={({ pressed }) => [
              styles.link,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.text, { color: colors.primary }]}>Denuncias</Text>
          </Pressable>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
        disabled={loggingOut}
        hitSlop={10}
        onPress={() => void handleLogout()}
        style={({ pressed }) => [
          styles.link,
          { backgroundColor: colors.surface, borderColor: colors.danger },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.text, { color: colors.danger }]}>{loggingOut ? 'Saliendo…' : 'Salir'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 10 },
  link: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderRadius: 14 },
  text: { fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
