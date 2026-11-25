import { Redirect, Tabs, usePathname } from 'expo-router';
import { ErrorView, LoadingView } from '../../src/components/ui/StateViews';
import { useAuth } from '../../src/context/AuthContext';
import { AdminMenu } from '../../src/components/layout/AdminMenu';
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
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <AdminMenu role={user.role} />,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.navigationActive,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.navigation },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarLabel: 'Inicio' }} />
      <Tabs.Screen
        name="activities/index"
        options={{ title: 'Actividades', tabBarLabel: 'Actividades' }}
      />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarLabel: 'Chat' }} />
      <Tabs.Screen
        name="reports/new"
        options={{ title: 'Denunciar', tabBarLabel: 'Denunciar' }}
      />
      <Tabs.Screen name="reports/index" options={{ href: null, title: 'Gestión de denuncias' }} />
      <Tabs.Screen name="reports/[id]/edit" options={{ href: null, title: 'Revisión de denuncia' }} />
      <Tabs.Screen name="reports/review" options={{ href: null, title: 'Revisión de denuncias' }} />
      <Tabs.Screen name="users/index" options={{ href: null, title: 'Gestión de usuarios' }} />
      <Tabs.Screen name="users/new" options={{ href: null, title: 'Nuevo usuario' }} />
      <Tabs.Screen name="users/[id]/edit" options={{ href: null, title: 'Editar usuario' }} />
    </Tabs>
  );
}
