import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ReportCard } from '../../../src/components/domain/ReportCard';
import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { AppButton } from '../../../src/components/ui/AppButton';
import { AppInput } from '../../../src/components/ui/AppInput';
import { EmptyView, ErrorView, LoadingView } from '../../../src/components/ui/StateViews';
import { useToast } from '../../../src/context/ToastContext';
import { theme } from '../../../src/config/theme';
import { useRequireRole } from '../../../src/hooks/useRequireRole';
import { useDebounce } from '../../../src/hooks/useDebounce';
import type { Report, ReportStatus } from '../../../src/models';
import { REPORT_STATUSES } from '../../../src/models/report.model';
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
  const search = firstParam(params.search);
  const page = pageNumber(firstParam(params.page));
  const rawStatus = firstParam(params.status);
  const status = REPORT_STATUSES.includes(rawStatus as ReportStatus)
    ? (rawStatus as ReportStatus)
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
      showDeleted,
    }),
    [page, search, status, showDeleted],
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
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las denuncias.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, reloadKey]);

  useEffect(() => setSelectedIds([]), [page, search, status, showDeleted]);

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
      <View style={styles.pickerWrap}>
        <Picker
          accessibilityLabel="Filtrar por estado"
          selectedValue={status}
          onValueChange={(value: string) =>
            router.setParams({ status: value || undefined, page: '1' })
          }
        >
          <Picker.Item label="Todos los estados" value="" />
          {REPORT_STATUSES.map((item) => <Picker.Item key={item} label={item} value={item} />)}
        </Picker>
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Ver archivadas</Text>
        <Switch
          accessibilityLabel="Ver denuncias archivadas"
          value={showDeleted}
          onValueChange={(value) => router.setParams({ showDeleted: value ? 'true' : undefined, page: '1' })}
          trackColor={{ true: theme.colors.primary }}
        />
      </View>
      {selectedIds.length ? (
        <View style={styles.bulkActions}>
          <Text style={styles.selectedLabel}>{selectedIds.length} seleccionadas</Text>
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
      {error && reports.length === 0 && !loading ? (
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
              <Text style={styles.pageLabel}>Página {page} de {Math.max(totalPages, 1)}</Text>
              <AppButton title="Siguiente" variant="secondary" disabled={totalPages === 0 || page >= totalPages} onPress={() => router.setParams({ page: String(page + 1) })} />
            </View>
          }
        />
      )}
      {error && reports.length > 0 ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pickerWrap: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  bulkActions: { gap: 8 },
  selectedLabel: { color: theme.colors.text, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: 16 },
  separator: { height: 12 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 16 },
  pageLabel: { color: theme.colors.textSecondary, fontSize: 13 },
  inlineError: { color: theme.colors.danger, fontSize: 13 },
});
