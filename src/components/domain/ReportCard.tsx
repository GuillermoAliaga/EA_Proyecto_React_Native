import { StyleSheet, Text, View } from 'react-native';
import type { Report } from '../../models/report.model';
import { theme } from '../../config/theme';
import { AppBadge } from '../ui/AppBadge';
import { AppCard } from '../ui/AppCard';

export function ReportCard({ report }: { report: Report }) {
  return (
    <AppCard>
      <View style={styles.heading}>
        <Text style={styles.title}>{report.reason}</Text>
        <AppBadge label={report.status} />
      </View>
      <Text style={styles.target}>Objetivo: {report.targetType}</Text>
      {report.description ? <Text style={styles.description}>{report.description}</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  target: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 14 },
  description: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 14 },
});
