import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityCard } from '../../../src/components/domain/ActivityCard';
import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { AppButton } from '../../../src/components/ui/AppButton';
import { AppInput } from '../../../src/components/ui/AppInput';
import { EmptyView, ErrorView, LoadingView } from '../../../src/components/ui/StateViews';
import { useAuth } from '../../../src/context/AuthContext';
import { useDebounce } from '../../../src/hooks/useDebounce';
import type { Activity, ActivityStatus } from '../../../src/models';
import {
  bulkDeleteActivities,
  bulkSoftDeleteActivities,
  deleteActivity,
  getActivities,
  joinActivity,
  leaveActivity,
  restoreActivity,
  softDeleteActivity,
} from '../../../src/services/activity.service';
import { getCategories } from '../../../src/services/category.service';
import type { CategoryOption } from '../../../src/services/category.service';
import { useToast } from '../../../src/context/ToastContext';
import { useTheme } from '../../../src/context/ThemeContext';

const PAGE_SIZE = 8;
const ACTIVITY_STATUSES: ActivityStatus[] = ['OPEN', 'FULL', 'COMPLETED', 'CANCELLED'];

type RouteParams = {
  search?: string | string[];
  page?: string | string[];
  category?: string | string[];
  subcategory?: string | string[];
  status?: string | string[];
  showDeleted?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function pageNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function ActivitiesScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const role = user?.role ?? 'USER';
  const isAdmin = role === 'ADMIN';
  const canCreate = role === 'ADMIN' || role === 'STORE_HOST';

  const search = firstParam(params.search);
  const page = pageNumber(firstParam(params.page));
  const category = firstParam(params.category);
  const subcategory = firstParam(params.subcategory);
  const status = firstParam(params.status);
  const showDeleted = isAdmin && firstParam(params.showDeleted) === 'true';

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 400);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setSearchText(search), [search]);

  useEffect(() => {
    if (debouncedSearch === search) return;
    router.setParams({
      search: debouncedSearch || undefined,
      page: '1',
    });
  }, [debouncedSearch, search]);

  useEffect(() => {
    const controller = new AbortController();
    void getCategories(controller.signal).then((result) => {
      if (!controller.signal.aborted) setCategories(result);
    });
    return () => controller.abort();
  }, []);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      category: category || undefined,
      subcategory: subcategory || undefined,
      status: status || undefined,
      showDeleted: isAdmin ? showDeleted : undefined,
    }),
    [page, search, category, subcategory, status, isAdmin, showDeleted],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void getActivities(query, controller.signal)
      .then((result) => {
        setActivities(result.data);
        setTotalPages(result.totalPages);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setActivities([]);
        setTotalPages(0);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar las actividades.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, reloadKey]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, search, category, subcategory, status, showDeleted]);

  const updateFilters = useCallback(
    (next: { category?: string; status?: string; showDeleted?: boolean }) => {
      const nextCategory = next.category === undefined ? category : next.category;
      const nextStatus = next.status === undefined ? status : next.status;
      const nextShowDeleted = next.showDeleted === undefined ? showDeleted : next.showDeleted;
      router.setParams({
        category: nextCategory || undefined,
        subcategory: next.category === undefined ? subcategory || undefined : undefined,
        status: nextStatus || undefined,
        showDeleted: nextShowDeleted ? 'true' : undefined,
        page: '1',
      });
    },
    [category, subcategory, status, showDeleted],
  );

  const runMutation = async (id: string, operation: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await operation();
      showToast(message);
      setSelectedIds([]);
      setReloadKey((key) => key + 1);
    } catch (mutationError) {
      showToast(
        mutationError instanceof Error ? mutationError.message : 'No se pudo completar la acción.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const confirmAction = (title: string, message: string, action: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: action },
    ]);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const runBulkAction = async (operation: (ids: string[]) => Promise<void>, message: string) => {
    const ids = [...selectedIds];
    setBusyId('bulk');
    try {
      await operation(ids);
      showToast(message);
      setSelectedIds([]);
      setReloadKey((key) => key + 1);
    } catch (mutationError) {
      showToast(
        mutationError instanceof Error ? mutationError.message : 'No se pudo completar la acción.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const selectedCategory = categories.find((item) => item.slug === category);

  return (
    <ScreenWrapper>
      <Header title="Actividades" />
      {canCreate ? (
        <AppButton
          title="+ Nueva Actividad"
          onPress={() => router.push('/(protected)/activities/new')}
        />
      ) : null}
      <AppInput
        label="Buscar"
        placeholder="Título, descripción o dirección"
        value={searchText}
        onChangeText={(value) => {
          setSearchText(value);
          setSelectedIds([]);
        }}
        returnKeyType="search"
      />
      <View style={styles.filters}>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            accessibilityLabel="Filtrar por categoría"
            selectedValue={category}
            onValueChange={(value: string) =>
              updateFilters({ category: value, status, showDeleted })
            }
            style={[styles.picker, { color: colors.text }]}
          >
            <Picker.Item label="Todas las categorías" value="" />
            {categories.map((item) => (
              <Picker.Item key={item.slug} label={item.name} value={item.slug} />
            ))}
          </Picker>
        </View>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            accessibilityLabel="Filtrar por estado"
            selectedValue={status}
            onValueChange={(value: string) =>
              updateFilters({ category, status: value, showDeleted })
            }
            style={[styles.picker, { color: colors.text }]}
          >
            <Picker.Item label="Todos los estados" value="" />
            {ACTIVITY_STATUSES.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
      </View>
      {selectedCategory?.subcategories.length ? (
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            accessibilityLabel="Filtrar por subcategoría"
            selectedValue={firstParam(params.subcategory)}
            onValueChange={(value: string) =>
              router.setParams({
                subcategory: value || undefined,
                page: '1',
              })
            }
            style={[styles.picker, { color: colors.text }]}
          >
            <Picker.Item label="Todas las subcategorías" value="" />
            {selectedCategory.subcategories.map((item) => (
              <Picker.Item key={item.slug} label={item.name} value={item.slug} />
            ))}
          </Picker>
        </View>
      ) : null}
      {isAdmin ? (
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Ver archivadas</Text>
          <Switch
            accessibilityLabel="Ver archivadas"
            value={showDeleted}
            onValueChange={(value) => updateFilters({ category, status, showDeleted: value })}
            trackColor={{ true: colors.primary }}
          />
        </View>
      ) : null}
      {isAdmin && selectedIds.length ? (
        <View style={styles.bulkActions}>
          <Text style={[styles.selectedLabel, { color: colors.text }]}>{selectedIds.length} seleccionadas</Text>
          <AppButton
            title="Archivar selección"
            variant="secondary"
            loading={busyId === 'bulk'}
            onPress={() =>
              confirmAction(
                'Archivar actividades',
                `¿Archivar ${selectedIds.length} actividades seleccionadas?`,
                () => void runBulkAction(bulkSoftDeleteActivities, 'Actividades archivadas.'),
              )
            }
          />
          <AppButton
            title="Eliminar selección"
            variant="danger"
            loading={busyId === 'bulk'}
            onPress={() =>
              confirmAction(
                'Eliminar actividades',
                `¿Eliminar definitivamente ${selectedIds.length} actividades? Esta acción no se puede deshacer.`,
                () => void runBulkAction(bulkDeleteActivities, 'Actividades eliminadas.'),
              )
            }
          />
        </View>
      ) : null}

      {error && !loading ? (
        <ErrorView title="No se pudieron cargar las actividades" description={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : loading && activities.length === 0 ? (
        <LoadingView title="Cargando actividades..." />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => setReloadKey((key) => key + 1)}
              tintColor={colors.primary}
            />
          }
          data={activities}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              role={role}
              userId={user?._id}
              selected={selectedIds.includes(item._id)}
              busy={busyId === item._id}
              onSelect={() => toggleSelected(item._id)}
              onJoin={() =>
                void runMutation(
                  item._id,
                  () => joinActivity(item._id),
                  'Te has inscrito en la actividad.',
                )
              }
              onLeave={() =>
                void runMutation(
                  item._id,
                  () => leaveActivity(item._id, role),
                  'Te has desapuntado de la actividad.',
                )
              }
              onEdit={() =>
                router.push({
                  pathname: '/(protected)/activities/[id]/edit',
                  params: { id: item._id },
                })
              }
              onArchive={() =>
                confirmAction(
                  'Archivar actividad',
                  `¿Archivar «${item.title}»?`,
                  () =>
                    void runMutation(
                      item._id,
                      () => softDeleteActivity(item._id),
                      'Actividad archivada.',
                    ),
                )
              }
              onRestore={() =>
                void runMutation(
                  item._id,
                  () => restoreActivity(item._id),
                  'Actividad restaurada.',
                )
              }
              onDelete={() =>
                confirmAction(
                  'Eliminar actividad',
                  `¿Eliminar definitivamente «${item.title}»? Esta acción no se puede deshacer.`,
                  () =>
                    void runMutation(
                      item._id,
                      () => deleteActivity(item._id),
                      'Actividad eliminada.',
                    ),
                )
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyView
              title="No hay actividades"
              description="Prueba a cambiar los filtros o crea una nueva actividad."
            />
          }
          ListFooterComponent={
            <View style={styles.pagination}>
              <AppButton
                title="Anterior"
                variant="secondary"
                disabled={page <= 1}
                onPress={() => router.setParams({ page: String(page - 1) })}
              />
              <Text style={[styles.pageLabel, { color: colors.textSecondary }]}>
                Página {page} de {Math.max(totalPages, 1)}
              </Text>
              <AppButton
                title="Siguiente"
                variant="secondary"
                disabled={totalPages === 0 || page >= totalPages}
                onPress={() => router.setParams({ page: String(page + 1) })}
              />
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: 8 },
  pickerWrap: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {},
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  bulkActions: { gap: 8 },
  selectedLabel: { fontWeight: '600' },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: 16 },
  separator: { height: 12 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 16,
  },
  pageLabel: { fontSize: 13 },
});
