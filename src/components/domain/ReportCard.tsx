import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Report } from '../../models/report.model';
import { useTheme } from '../../context/ThemeContext';
import { AppBadge } from '../ui/AppBadge';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';

interface ReportCardProps {
  report: Report;
  selected?: boolean;
  busy?: boolean;
  onSelect?: () => void;
  onReview?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ReportCard({
  report,
  selected = false,
  busy = false,
  onSelect,
  onReview,
  onArchive,
  onDelete,
}: ReportCardProps) {
  const { colors } = useTheme();
  return (
    <AppCard style={styles.card}>
      <View style={styles.heading}>
        {onSelect ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Seleccionar denuncia ${report._id}`}
            accessibilityState={{ checked: selected }}
            onPress={onSelect}
            style={[
              styles.checkbox,
              { borderColor: colors.textSecondary },
              selected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.checkboxText, { color: colors.surface }]}>{selected ? '✓' : ''}</Text>
          </Pressable>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>{report.reason}</Text>
        <AppBadge label={report.status} />
      </View>
      {report.deleted ? <AppBadge label="Archivada" /> : null}
      <Text style={[styles.target, { color: colors.textSecondary }]}>Objetivo: {report.targetType} · {report.targetId}</Text>
      {report.description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{report.description}</Text> : null}
      {onReview || onArchive || onDelete ? (
        <View style={styles.actions}>
          {onReview ? <AppButton title="Revisar" variant="secondary" onPress={onReview} /> : null}
          {onArchive ? <AppButton title="Archivar" variant="ghost" onPress={onArchive} loading={busy} /> : null}
          {onDelete ? <AppButton title="Eliminar" variant="danger" onPress={onDelete} loading={busy} /> : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  target: { marginTop: 8, fontSize: 14 },
  description: { marginTop: 8, fontSize: 14 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: { fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
