import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Activity, UserRole } from '../../models';
import { theme } from '../../config/theme';
import { AppBadge } from '../ui/AppBadge';
import { AppButton } from '../ui/AppButton';
import { AppCard } from '../ui/AppCard';

interface ActivityCardProps {
  activity: Activity;
  role: UserRole;
  userId?: string;
  selected?: boolean;
  busy?: boolean;
  onSelect?: () => void;
  onJoin?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

function formatPrice(price: number): string {
  if (price === 0) return 'Gratis';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatSchedule(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Fecha por confirmar';

  const date = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(start);
  const times = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date}, ${times.format(start)}–${times.format(end)}`;
}

function truncate(text: string, length = 140): string {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

export function ActivityCard({
  activity,
  role,
  userId,
  selected = false,
  busy = false,
  onSelect,
  onJoin,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: ActivityCardProps) {
  const maxParticipants = activity.capacity.maxParticipants;
  const participantCount = activity.participants.length;
  const isEnrolled = Boolean(
    userId && activity.participants.some((participant) => participant.userId === userId),
  );
  const hasOpenSpots =
    activity.status === 'OPEN' && participantCount < maxParticipants && !activity.deleted;

  return (
    <AppCard style={styles.card}>
      <View style={styles.titleRow}>
        {role === 'ADMIN' && onSelect ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={onSelect}
            style={[styles.checkbox, selected && styles.checkboxSelected]}
          >
            <Text style={styles.checkboxText}>{selected ? '✓' : ''}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{activity.title}</Text>
        <AppBadge label={activity.deleted ? 'Archivada' : activity.status} />
      </View>

      <View style={styles.badges}>
        <AppBadge label={activity.category} />
        <AppBadge label={activity.subcategory} />
        <AppBadge label={activity.modality} />
      </View>

      <Text style={styles.description}>{truncate(activity.description)}</Text>
      <Text style={styles.detail}>{activity.location.addressName}</Text>
      <Text style={styles.detail}>
        {formatSchedule(activity.schedule.startTime, activity.schedule.endTime)}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.price}>{formatPrice(activity.pricing.price)}</Text>
        <Text style={styles.detail}>
          Plazas: {participantCount}/{maxParticipants}
        </Text>
      </View>

      {role === 'USER' && isEnrolled ? (
        <AppButton title="Inscrito" variant="secondary" disabled />
      ) : role === 'USER' && hasOpenSpots ? (
        <AppButton title="Inscribirse" onPress={onJoin} loading={busy} disabled={busy} />
      ) : null}

      {role === 'ADMIN' ? (
        <View style={styles.actions}>
          <AppButton title="Editar" variant="secondary" onPress={onEdit} />
          {activity.deleted ? (
            <AppButton title="Restaurar" variant="secondary" onPress={onRestore} loading={busy} />
          ) : (
            <AppButton title="Archivar" variant="ghost" onPress={onArchive} loading={busy} />
          )}
          <AppButton title="Eliminar" variant="danger" onPress={onDelete} loading={busy} />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  checkbox: {
    width: 24,
    height: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkboxText: { color: theme.colors.surface, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  description: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  detail: { color: theme.colors.textSecondary, fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
