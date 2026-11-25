import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { UserCard } from '../../../src/components/domain/UserCard';
import { Header } from '../../../src/components/layout/Header';
import { ScreenWrapper } from '../../../src/components/layout/ScreenWrapper';
import { AppButton } from '../../../src/components/ui/AppButton';
import { AppInput } from '../../../src/components/ui/AppInput';
import { EmptyView, ErrorView, LoadingView } from '../../../src/components/ui/StateViews';
import { useAuth } from '../../../src/context/AuthContext';
import { useToast } from '../../../src/context/ToastContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { useRequireRole } from '../../../src/hooks/useRequireRole';
import { useDebounce } from '../../../src/hooks/useDebounce';
import type { User, UserRole } from '../../../src/models';
import { ROLES } from '../../../src/models';
import {
  bulkDeleteUsers,
  bulkSoftDeleteUsers,
  deleteUser,
  getUsers,
  restoreUser,
  softDeleteUser,
} from '../../../src/services/user.service';

const PAGE_SIZE = 10;

type RouteParams = {
  search?: string | string[];
  page?: string | string[];
  role?: string | string[];
  isBanned?: string | string[];
  showDeleted?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function pageNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function UsersScreen() {
  const isAdmin = useRequireRole(['ADMIN']);
  const params = useLocalSearchParams<RouteParams>();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const search = firstParam(params.search);
  const page = pageNumber(firstParam(params.page));
  const rawRole = firstParam(params.role);
  const role = ROLES.includes(rawRole as UserRole) ? (rawRole as UserRole) : '';
  const rawIsBanned = firstParam(params.isBanned);
  const isBanned =
    rawIsBanned === 'true' ? true : rawIsBanned === 'false' ? false : undefined;
  const showDeleted = firstParam(params.showDeleted) === 'true';
  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 400);
  const [users, setUsers] = useState<User[]>([]);
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
      role: role || undefined,
      isBanned,
      showDeleted,
    }),
    [page, search, role, isBanned, showDeleted],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void getUsers(query, controller.signal)
      .then((result) => {
        setUsers(result.data);
        setTotalPages(result.totalPages);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setUsers([]);
          setTotalPages(0);
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los usuarios.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, reloadKey]);

  useEffect(() => setSelectedIds([]), [page, search, role, isBanned, showDeleted]);

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
    const ids = selectedIds.filter((id) => id !== currentUser?._id);
    if (!ids.length) return;
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
    if (id === currentUser?._id) return;
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  }, [currentUser?._id]);

  if (!isAdmin) return <LoadingView />;

  return (
    <ScreenWrapper>
      <Header title="Gestión de usuarios" subtitle="Administración (ADMIN)" />
      <AppButton title="+ Nuevo usuario" onPress={() => router.push('/(protected)/users/new')} />
      <AppInput
        label="Buscar"
        placeholder="Nombre o email"
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
            accessibilityLabel="Filtrar por rol"
            selectedValue={role}
            style={{ color: colors.text }}
            onValueChange={(value: string) =>
              router.setParams({ role: value || undefined, page: '1' })
            }
          >
            <Picker.Item label="Todos los roles" value="" />
            {ROLES.map((item) => <Picker.Item key={item} label={item} value={item} />)}
          </Picker>
        </View>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker
            accessibilityLabel="Filtrar por estado de baneo"
            selectedValue={rawIsBanned}
            style={{ color: colors.text }}
            onValueChange={(value: string) =>
              router.setParams({ isBanned: value || undefined, page: '1' })
            }
          >
            <Picker.Item label="Cualquier estado" value="" />
            <Picker.Item label="Baneados" value="true" />
            <Picker.Item label="No baneados" value="false" />
          </Picker>
        </View>
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>Ver archivados</Text>
        <Switch
          accessibilityLabel="Ver usuarios archivados"
          value={showDeleted}
          onValueChange={(value) => router.setParams({ showDeleted: value ? 'true' : undefined, page: '1' })}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {selectedIds.length ? (
        <View style={styles.bulkActions}>
          <Text style={[styles.selectedLabel, { color: colors.text }]}>{selectedIds.length} seleccionados</Text>
          <AppButton
            title="Archivar selección"
            variant="secondary"
            loading={busyId === 'bulk'}
            onPress={() => confirmAction(
              'Archivar usuarios',
              `¿Archivar ${selectedIds.length} usuarios seleccionados?`,
              () => void runBulkAction(bulkSoftDeleteUsers, 'Usuarios archivados.'),
            )}
          />
          <AppButton
            title="Eliminar selección"
            variant="danger"
            loading={busyId === 'bulk'}
            onPress={() => confirmAction(
              'Eliminar usuarios',
              `¿Eliminar definitivamente ${selectedIds.length} usuarios? Esta acción no se puede deshacer.`,
              () => void runBulkAction(bulkDeleteUsers, 'Usuarios eliminados.'),
            )}
          />
        </View>
      ) : null}
      {error && !loading ? (
        <ErrorView
          title="No se pudieron cargar los usuarios"
          description={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : loading && users.length === 0 ? (
        <LoadingView title="Cargando usuarios..." />
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
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isCurrentUser = item._id === currentUser?._id;
            return (
              <UserCard
                user={item}
                isCurrentUser={isCurrentUser}
                selected={selectedIds.includes(item._id)}
                busy={busyId === item._id}
                onSelect={!isCurrentUser ? () => toggleSelected(item._id) : undefined}
                onEdit={() => router.push({
                  pathname: '/(protected)/users/[id]/edit',
                  params: { id: item._id },
                })}
                onArchive={!item.deleted ? () => confirmAction(
                  'Archivar usuario',
                  `¿Archivar la cuenta de ${item.name}?`,
                  () => void runMutation(item._id, () => softDeleteUser(item._id), 'Usuario archivado.'),
                ) : undefined}
                onRestore={!isCurrentUser && item.deleted
                  ? () => void runMutation(item._id, () => restoreUser(item._id), 'Usuario restaurado.')
                  : undefined}
                onDelete={() => confirmAction(
                  'Eliminar usuario',
                  `¿Eliminar definitivamente la cuenta de ${item.name}? Esta acción no se puede deshacer.`,
                  () => void runMutation(item._id, () => deleteUser(item._id), 'Usuario eliminado.'),
                )}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyView title="No hay usuarios" description="No hay resultados para los filtros seleccionados." />}
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
