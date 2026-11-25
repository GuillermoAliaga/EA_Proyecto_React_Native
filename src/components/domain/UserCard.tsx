import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { User } from '../../models/user.model';
import { theme } from '../../config/theme';
import { AppBadge } from '../ui/AppBadge';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';

interface UserCardProps {
  user: User;
  isCurrentUser?: boolean;
  selected?: boolean;
  busy?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

export function UserCard({
  user,
  isCurrentUser = false,
  selected = false,
  busy = false,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: UserCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.heading}>
        {!isCurrentUser && onSelect ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Seleccionar usuario ${user.name}`}
            accessibilityState={{ checked: selected }}
            onPress={onSelect}
            style={[styles.checkbox, selected && styles.checkboxSelected]}
          >
            <Text style={styles.checkboxText}>{selected ? '✓' : ''}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.name}>{user.name}</Text>
        <AppBadge label={user.role} />
      </View>
      <Text style={styles.email}>{user.email}</Text>
      <View style={styles.badges}>
        {user.isBanned ? <AppBadge label="Baneado" /> : null}
        {user.deleted ? <AppBadge label="Archivado" /> : null}
        {isCurrentUser ? <AppBadge label="Tu cuenta" /> : null}
      </View>
      {onEdit || onArchive || onRestore || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? <AppButton title="Editar" variant="secondary" onPress={onEdit} /> : null}
          {!user.deleted && onArchive ? (
            <AppButton
              title="Archivar"
              variant="ghost"
              onPress={onArchive}
              loading={busy}
              disabled={isCurrentUser}
            />
          ) : null}
          {!isCurrentUser && user.deleted && onRestore ? (
            <AppButton title="Restaurar" variant="secondary" onPress={onRestore} loading={busy} />
          ) : null}
          {onDelete ? (
            <AppButton
              title="Eliminar"
              variant="danger"
              onPress={onDelete}
              loading={busy}
              disabled={isCurrentUser}
            />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  name: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  email: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkboxText: { color: theme.colors.surface, fontWeight: '700' },
});
