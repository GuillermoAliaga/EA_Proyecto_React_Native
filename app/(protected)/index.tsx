import { useCallback, useEffect, useMemo, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActivitiesMap } from '../../src/components/domain/ActivitiesMap';
import { ActivityCard } from '../../src/components/domain/ActivityCard';
import { Header } from '../../src/components/layout/Header';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppCard } from '../../src/components/ui/AppCard';
import { ErrorView, LoadingView } from '../../src/components/ui/StateViews';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import type { ThemeMode } from '../../src/context/ThemeContext';
import { useToast } from '../../src/context/ToastContext';
import type { Activity } from '../../src/models';
import {
  getActivities,
  getJoinedActivities,
  joinActivity,
  leaveActivity,
} from '../../src/services/activity.service';

const HOME_LIMIT = 30;
type MapCategory = 'ALL' | 'SPORT' | 'LEISURE';

function isUpcoming(activity: Activity, now: number): boolean {
  const start = new Date(activity.schedule.startTime).getTime();
  return (
    Number.isFinite(start) &&
    start > now &&
    !activity.deleted &&
    activity.status !== 'CANCELLED' &&
    activity.status !== 'COMPLETED'
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, mode, setMode, isLoaded: themeLoaded } = useTheme();
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [mapCategory, setMapCategory] = useState<MapCategory>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [themeSaving, setThemeSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const activitiesRequest = getActivities(
      { page: 1, limit: HOME_LIMIT },
      controller.signal,
    );
    const joinedRequest =
      user?.role === 'USER' ? getJoinedActivities(user.role, controller.signal) : Promise.resolve([]);
    void Promise.all([activitiesRequest, joinedRequest])
      .then(([response, joined]) => {
        setActivities(response.data);
        setJoinedActivities(joined);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setActivities([]);
        setJoinedActivities([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar las actividades próximas.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey, user?.role]);

  const upcoming = useMemo(
    () =>
      activities
        .filter((activity) => isUpcoming(activity, Date.now()))
        .sort(
          (left, right) =>
            new Date(left.schedule.startTime).getTime() -
            new Date(right.schedule.startTime).getTime(),
        )
        .slice(0, 10),
    [activities],
  );
  const openActivities = activities.filter((activity) => activity.status === 'OPEN');
  const storeHostedCount = activities.filter((activity) => activity.location.isStoreLocation).length;
  const mapActivities =
    mapCategory === 'ALL'
      ? activities
      : activities.filter((activity) => activity.category.toUpperCase() === mapCategory);
  const upcomingOpen = upcoming.filter((activity) => activity.status === 'OPEN');
  const featuredActivities = (upcomingOpen.length ? upcomingOpen : upcoming).slice(0, 4);

  const toggleParticipation = useCallback(
    async (activity: Activity) => {
      if (!user || busyId) return;
      const enrolled = activity.participants.some(
        (participant) => participant.userId === user._id,
      );
      setBusyId(activity._id);
      try {
        if (enrolled) {
          if (user.role !== 'USER') return;
          await leaveActivity(activity._id, user.role);
          showToast('Te has desapuntado de la actividad.');
        } else {
          await joinActivity(activity._id);
          showToast('Te has inscrito en la actividad.');
        }
        setReloadKey((key) => key + 1);
      } catch (requestError) {
        showToast(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo actualizar la inscripción.',
        );
      } finally {
        setBusyId(null);
      }
    },
    [busyId, showToast, user],
  );

  const changeTheme = async (nextMode: ThemeMode) => {
    setThemeSaving(true);
    try {
      await setMode(nextMode);
      showToast('Preferencia de apariencia guardada.');
    } catch {
      showToast('No se pudo guardar la preferencia de apariencia.');
    } finally {
      setThemeSaving(false);
    }
  };

  if (loading && activities.length === 0 && !error) {
    return (
      <ScreenWrapper>
        <LoadingView title="Cargando actividades próximas..." />
      </ScreenWrapper>
    );
  }
  if (error) {
    return (
      <ScreenWrapper>
        <ErrorView
          title="No se pudo cargar el inicio"
          description={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      scroll
      refreshing={loading}
      onRefresh={() => setReloadKey((key) => key + 1)}
      refreshTintColor={colors.primary}
    >
      <Header title={`Hola, ${user?.name ?? 'deportista'}`} subtitle="Tu actividad, de un vistazo" />
      <View style={styles.statsRow}>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{openActivities.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Actividades abiertas</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {user?.role === 'ADMIN' ? activities.length : joinedActivities.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {user?.role === 'ADMIN' ? 'Total publicadas' : 'Tus inscripciones'}
          </Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{storeHostedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En tiendas locales</Text>
        </AppCard>
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.mapHeading}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividades en el mapa</Text>
          <Text style={[styles.mapHint, { color: colors.textSecondary }]}>
            Toca un marcador para ver los detalles e inscribirte.
          </Text>
        </View>
        <AppButton
          title="Ver todas"
          variant="ghost"
          onPress={() => router.push('/(protected)/activities')}
        />
      </View>
      <View style={[styles.themePicker, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Picker
          accessibilityLabel="Filtrar el mapa por categoría"
          selectedValue={mapCategory}
          onValueChange={(value: MapCategory) => setMapCategory(value)}
          style={{ color: colors.text }}
        >
          <Picker.Item label={`Todas (${activities.length})`} value="ALL" />
          <Picker.Item label="Deporte" value="SPORT" />
          <Picker.Item label="Ocio" value="LEISURE" />
        </Picker>
      </View>
      <ActivitiesMap
        activities={mapActivities}
        userId={user?._id}
        role={user?.role ?? 'USER'}
        busyId={busyId}
        onToggleParticipation={(activity) => void toggleParticipation(activity)}
      />

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Próximas actividades</Text>
      </View>
      {featuredActivities.length ? (
        featuredActivities.map((activity) => (
          <ActivityCard
            key={activity._id}
            activity={activity}
            role={user?.role ?? 'USER'}
            userId={user?._id}
            busy={busyId === activity._id}
            onJoin={() => void toggleParticipation(activity)}
            onLeave={() => void toggleParticipation(activity)}
            onEdit={() =>
              router.push({
                pathname: '/(protected)/activities/[id]/edit',
                params: { id: activity._id },
              })
            }
          />
        ))
      ) : (
        <AppCard>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay actividades próximas. Explora el listado para encontrar una.
          </Text>
        </AppCard>
      )}
      <AppButton
        title="Explorar actividades"
        variant="secondary"
        onPress={() => router.push('/(protected)/activities')}
      />

      <View style={styles.themeRow}>
        <Text style={[styles.themeLabel, { color: colors.text }]}>Apariencia</Text>
        <View
          style={[
            styles.themePicker,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Picker
            accessibilityLabel="Seleccionar tema de la aplicación"
            selectedValue={mode}
            enabled={!themeSaving && themeLoaded}
            onValueChange={(value: ThemeMode) => void changeTheme(value)}
            style={{ color: colors.text }}
          >
            <Picker.Item label="Según sistema" value="system" />
            <Picker.Item label="Claro" value="light" />
            <Picker.Item label="Oscuro" value="dark" />
          </Picker>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, gap: 6 },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  mapHeading: { flex: 1, gap: 4 },
  mapHint: { fontSize: 12 },
  emptyText: { textAlign: 'center', fontSize: 14 },
  themeRow: { gap: 6 },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  themePicker: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
});
