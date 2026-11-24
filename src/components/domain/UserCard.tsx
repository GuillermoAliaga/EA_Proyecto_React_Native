import { StyleSheet, Text, View } from 'react-native';
import type { User } from '../../models/user.model';
import { theme } from '../../config/theme';
import { AppBadge } from '../ui/AppBadge';
import { AppCard } from '../ui/AppCard';

export function UserCard({ user }: { user: User }) {
  return (
    <AppCard>
      <View style={styles.heading}>
        <Text style={styles.name}>{user.name}</Text>
        <AppBadge label={user.role} />
      </View>
      <Text style={styles.email}>{user.email}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  name: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  email: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 14 },
});
