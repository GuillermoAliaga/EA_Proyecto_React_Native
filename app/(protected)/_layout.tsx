import { Redirect, Stack, usePathname } from 'expo-router';
import { AdminMenu } from '../../src/components/layout/AdminMenu';
import { ErrorView, LoadingView } from '../../src/components/ui/StateViews';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function ProtectedLayout() {
  const { user, isInitializing, initializationError, retryInitialization } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();

  if (isInitializing) return <LoadingView title="Comprobando sesión..." />;
  if (initializationError) {
    return (
      <ErrorView
        title="No se pudo conectar"
        description={initializationError}
        onRetry={() => void retryInitialization()}
      />
    );
  }
  if (!user) {
    return <Redirect href={{ pathname: '/login', params: { redirect: pathname } }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerRight: () => <AdminMenu role={user.role} />,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="activities/new" options={{ title: 'Nueva actividad' }} />
      <Stack.Screen name="activities/[id]/edit" options={{ title: 'Editar actividad' }} />
      <Stack.Screen name="reports/index" options={{ title: 'Denuncias' }} />
      <Stack.Screen name="reports/[id]/edit" options={{ title: 'Revisión de denuncia' }} />
      <Stack.Screen name="reports/review" options={{ title: 'Revisión de denuncias' }} />
      <Stack.Screen name="users/index" options={{ title: 'Usuarios' }} />
      <Stack.Screen name="users/new" options={{ title: 'Nuevo usuario' }} />
      <Stack.Screen name="users/[id]/edit" options={{ title: 'Editar usuario' }} />
    </Stack>
  );
}
