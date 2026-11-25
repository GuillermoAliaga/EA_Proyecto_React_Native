import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ReportCard } from '../../../src/components/domain/ReportCard';
import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { AppButton } from '../../../src/components/ui/AppButton';
import { AppInput } from '../../../src/components/ui/AppInput';
import { EmptyView, ErrorView, LoadingView } from '../../../src/components/ui/StateViews';
import { useToast } from '../../../src/context/ToastContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useRequireRole } from '../../../src/hooks/useRequireRole';
import { useDebounce } from '../../../src/hooks/useDebounce';
import type { Report, ReportReason, ReportStatus, ReportTargetType } from '../../../src/models';
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  TARGET_TYPES,
} from '../../../src/models/report.model';
import {
  bulkDeleteReports,
  bulkSoftDeleteReports,
  deleteReport,
  getReports,
  softDeleteReport,
} from '../../../src/services/report.service';

const PAGE_SIZE = 10;

type RouteParams = {
  search?: string | string[];
  page?: string | string[];
  status?: string | string[];
  reason?: string | string[];
  targetType?: string | string[];
  showDeleted?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function pageNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function ReportsScreen() {
  const isAdmin = useRequireRole(['ADMIN']);
  const params = useLocalSearchParams<RouteParams>();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const search = firstParam(params.search);
  const page = pageNumber(firstParam(params.page));
  const rawStatus = firstParam(params.status);
  const status = REPORT_STATUSES.includes(rawStatus as ReportStatus)
    ? (rawStatus as ReportStatus)
    : '';
  const rawReason = firstParam(params.reason);
  const reason = REPORT_REASONS.includes(rawReason as ReportReason)
    ? (rawReason as ReportReason)
    : '';
  const rawTargetType = firstParam(params.targetType);
  const targetType = TARGET_TYPES.includes(rawTargetType as ReportTargetType)
    ? (rawTargetType as ReportTargetType)
    : '';
  const showDeleted = firstParam(params.showDeleted) === 'true';
  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 400);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setSearchText(search), [search]);

  useEffect(() => {
    if (debouncedSearch === search) return;
    router.setParams({ search: debouncedSearch || undefined, page: '1' });
  }, [debouncedSearch, search]);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      reason: reason || undefined,
      targetType: targetType || undefined,
      showDeleted,
    }),
    [page, search, status, reason, targetType, showDeleted],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void getReports(query, controller.signal)
      .then((result) => {
        setReports(result.data);
        setTotalPages(result.totalPages);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setReports([]);
          setTotalPages(0);
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las denuncias.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, reloadKey]);

  useEffect(
    () => setSelectedIds([]),
    [page, search, status, reason, targetType, showDeleted],
  );

  const runMutation = async (id: string, operation: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await operation();
      showToast(message);
      setSelectedIds([]);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo completar la acción.');
    } finally {
      setBusyId(null);
    }
  };

  const runBulkAction = async (operation: (ids: string[]) => Promise<void>, message: string) => {
    const ids = [...selectedIds];
    setBusyId('bulk');
    try {
      await operation(ids);
      showToast(message);
      setSelectedIds([]);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo completar la acción.');
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

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  }, []);

  if (!isAdmin) return <LoadingView />;

  return (
    <ScreenWrapper>
      <Header title="Gestión de denuncias" />
      <AppButton
        title="+ Nueva denuncia"
        variant="secondary"
        onPress={() => router.push('/(protected)/reports/new')}
      />
      <AppInput
        label="Buscar denuncias"
        placeholder="Descripción, motivo o identificador"
        value={searchText}
        onChangeText={(value) => {
          setSearchText(value);
          setSelectedIds([]);
        }}
        returnKeyType="search"
      />
      <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Picker
          accessibilityLabel="Filtrar por estado"
          selectedValue={status}
          style={{ color: colors.text }}
          onValueChange={(value: string) =>
            router.setParams({ status: value || undefined, page: '1' })
          }
        >
          <Picker.Item label="Todos los estados" value="" />
          {REPORT_STATUSES.map((item) => <Picker.Item key={item} label={item} value={item} />)}
        </Picker>
      </View>
      <View style={styles.filters}>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            accessibilityLabel="Filtrar por motivo"
            selectedValue={reason}
            style={{ color: colors.text }}
            onValueChange={(value: string) =>
              router.setParams({ reason: value || undefined, page: '1' })
            }
          >
            <Picker.Item label="Todos los motivos" value="" />
            {REPORT_REASONS.map((item) => <Picker.Item key={item} label={item} value={item} />)}
          </Picker>
        </View>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            accessibilityLabel="Filtrar por tipo de objetivo"
            selectedValue={targetType}
            style={{ color: colors.text }}
            onValueChange={(value: string) =>
              router.setParams({ targetType: value || undefined, page: '1' })
            }
          >
            <Picker.Item label="Todos los objetivos" value="" />
            {TARGET_TYPES.map((item) => <Picker.Item key={item} label={item} value={item} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>Ver archivadas</Text>
        <Switch
          accessibilityLabel="Ver denuncias archivadas"
          value={showDeleted}
          onValueChange={(value) => router.setParams({ showDeleted: value ? 'true' : undefined, page: '1' })}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {selectedIds.length ? (
        <View style={styles.bulkActions}>
          <Text style={[styles.selectedLabel, { color: colors.text }]}>{selectedIds.length} seleccionadas</Text>
          <AppButton
            title="Archivar selección"
            variant="secondary"
            loading={busyId === 'bulk'}
            onPress={() => confirmAction(
              'Archivar denuncias',
              `¿Archivar ${selectedIds.length} denuncias seleccionadas?`,
              () => void runBulkAction(bulkSoftDeleteReports, 'Denuncias archivadas.'),
            )}
          />
          <AppButton
            title="Eliminar selección"
            variant="danger"
            loading={busyId === 'bulk'}
            onPress={() => confirmAction(
              'Eliminar denuncias',
              `¿Eliminar definitivamente ${selectedIds.length} denuncias? Esta acción no se puede deshacer.`,
              () => void runBulkAction(bulkDeleteReports, 'Denuncias eliminadas.'),
            )}
          />
        </View>
      ) : null}
      {error && !loading ? (
        <ErrorView
          title="No se pudieron cargar las denuncias"
          description={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : loading && reports.length === 0 ? (
        <LoadingView title="Cargando denuncias..." />
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
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              selected={selectedIds.includes(item._id)}
              busy={busyId === item._id}
              onSelect={() => toggleSelected(item._id)}
              onReview={() => router.push({
                pathname: '/(protected)/reports/[id]/edit',
                params: { id: item._id },
              })}
              onArchive={!item.deleted ? () => confirmAction(
                'Archivar denuncia',
                '¿Archivar esta denuncia?',
                () => void runMutation(item._id, () => softDeleteReport(item._id), 'Denuncia archivada.'),
              ) : undefined}
              onDelete={() => confirmAction(
                'Eliminar denuncia',
                '¿Eliminar definitivamente esta denuncia? Esta acción no se puede deshacer.',
                () => void runMutation(item._id, () => deleteReport(item._id), 'Denuncia eliminada.'),
              )}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyView title="No hay denuncias" description="No hay resultados para los filtros seleccionados." />}
          ListFooterComponent={
            <View style={styles.pagination}>
              <AppButton title="Anterior" variant="secondary" disabled={page <= 1} onPress={() => router.setParams({ page: String(page - 1) })} />
              <Text style={[styles.pageLabel, { color: colors.textSecondary }]}>Página {page} de {Math.max(totalPages, 1)}</Text>
              <AppButton title="Siguiente" variant="secondary" disabled={totalPages === 0 || page >= totalPages} onPress={() => router.setParams({ page: String(page + 1) })} />
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  bulkActions: { gap: 8 },
  selectedLabel: { fontWeight: '600' },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: 16 },
  separator: { height: 12 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 16 },
  pageLabel: { fontSize: 13 },
});
