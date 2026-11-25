import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Polyline } from 'react-native-maps';
import type { Activity, UserRole } from '../../models';
import { useTheme } from '../../context/ThemeContext';
import { AppCard } from '../ui/AppCard';

interface ActivitiesMapProps {
  activities: Activity[];
  userId?: string;
  role: UserRole;
  busyId?: string | null;
  onToggleParticipation: (activity: Activity) => void;
}

function isValidCoordinate(activity: Activity): boolean {
  const coordinates = activity.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [longitude, latitude] = coordinates;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function ActivitiesMap({
  activities,
  userId,
  role,
  busyId,
  onToggleParticipation,
}: ActivitiesMapProps) {
  const mapRef = useRef<MapView>(null);
  const { colors } = useTheme();
  const mappedActivities = useMemo(
    () => activities.filter((activity) => !activity.deleted && isValidCoordinate(activity)),
    [activities],
  );

  useEffect(() => {
    if (!mappedActivities.length) return;
    const markerCoordinates = mappedActivities.map((activity) => ({
      latitude: activity.location.coordinates[1],
      longitude: activity.location.coordinates[0],
    }));
    const routeCoordinates = mappedActivities.flatMap((activity) =>
      (activity.route?.path.coordinates ?? []).map(([longitude, latitude]) => ({
        latitude,
        longitude,
      })).filter(({ latitude, longitude }) =>
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180,
      ),
    );
    const coordinates = [...markerCoordinates, ...routeCoordinates];
    const timer = setTimeout(() => {
      if (coordinates.length === 1) {
        mapRef.current?.animateToRegion(
          {
            ...coordinates[0],
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          },
          350,
        );
      } else {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mappedActivities]);

  if (!mappedActivities.length) {
    return (
      <AppCard style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No hay actividades próximas con una ubicación válida para mostrar.
        </Text>
      </AppCard>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: mappedActivities[0].location.coordinates[1],
          longitude: mappedActivities[0].location.coordinates[0],
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        accessibilityLabel="Mapa de actividades próximas"
        showsUserLocation={false}
      >
        {mappedActivities.map((activity) => {
          const enrolled = Boolean(
            userId && activity.participants.some((participant) => participant.userId === userId),
          );
          const canUnenroll =
            enrolled && activity.status !== 'COMPLETED' && activity.status !== 'CANCELLED';
          const canEnroll =
            !enrolled &&
            activity.status === 'OPEN' &&
            activity.participants.length < activity.capacity.maxParticipants;
          const canToggle = role === 'USER' && (canUnenroll || canEnroll);
          const buttonLabel = enrolled ? 'Desapuntarme' : 'Inscribirme';

          return (
            <Marker
              key={activity._id}
              identifier={activity._id}
              coordinate={{
                latitude: activity.location.coordinates[1],
                longitude: activity.location.coordinates[0],
              }}
              title={activity.title}
              description={activity.location.addressName}
            >
              <Callout
                onPress={
                  canToggle && busyId !== activity._id
                    ? () => onToggleParticipation(activity)
                    : undefined
                }
                tooltip={false}
              >
                <View style={styles.callout}>
                  <Text style={[styles.category, { color: colors.textSecondary }]}>
                    {activity.category} · {activity.subcategory}
                    {activity.location.isStoreLocation ? ' · Tienda oficial' : ''}
                  </Text>
                  <Text style={[styles.title, { color: colors.text }]}>{activity.title}</Text>
                  <Text style={[styles.address, { color: colors.textSecondary }]}>
                    {activity.location.addressName}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {activity.participants.length}/{activity.capacity.maxParticipants} plazas ·{' '}
                    {activity.pricing.price > 0 ? `${activity.pricing.price} €` : 'Gratis'}
                  </Text>
                  {enrolled ? (
                    <Text style={[styles.meta, { color: colors.primary }]}>Ya estás inscrito</Text>
                  ) : null}
                  {canToggle ? (
                    <Text style={[styles.action, { color: colors.primary }]}>
                      {busyId === activity._id
                        ? 'Procesando...'
                        : `Pulsa para ${buttonLabel.toLowerCase()}`}
                    </Text>
                  ) : null}
                </View>
              </Callout>
            </Marker>
          );
        })}
        {mappedActivities.map((activity) => {
          const coordinates = (activity.route?.path.coordinates ?? [])
            .filter(([longitude, latitude]) =>
              Number.isFinite(longitude) &&
              Number.isFinite(latitude) &&
              longitude >= -180 &&
              longitude <= 180 &&
              latitude >= -90 &&
              latitude <= 90,
            )
            .map(([longitude, latitude]) => ({ latitude, longitude }));
          if (coordinates.length < 2) return null;
          return (
            <Polyline
              key={`route-${activity._id}`}
              coordinates={coordinates}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
  },
  map: StyleSheet.absoluteFill,
  empty: { minHeight: 90, justifyContent: 'center' },
  emptyText: { textAlign: 'center', fontSize: 14 },
  callout: { width: 220, gap: 5, padding: 4 },
  category: { fontSize: 11 },
  title: { fontSize: 15, fontWeight: '700' },
  address: { fontSize: 12 },
  meta: { fontSize: 12 },
  action: { marginTop: 4, fontSize: 13, fontWeight: '700' },
});
