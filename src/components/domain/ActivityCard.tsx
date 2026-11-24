import { StyleSheet, Text, View } from 'react-native';
import type { Activity } from '../../models/activity.model';
import { AppBadge } from '../ui/AppBadge';
import { AppCard } from '../ui/AppCard';
import { theme } from '../../config/theme';

export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <AppCard>
      <View style={styles.heading}>
        <Text style={styles.title}>{activity.title}</Text>
        <AppBadge label={activity.status} />
      </View>
      <Text style={styles.description}>{activity.description}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  description: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 14 },
});
