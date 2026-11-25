import { Redirect, Tabs } from 'expo-router';
import { ErrorView, LoadingView } from '../../src/components/ui/StateViews';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/config/theme';

export default function ProtectedLayout() {
  const { user, isInitializing, initializationError, retryInitialization } = useAuth();

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
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.navigationActive,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.navigation },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="activities/index" options={{ title: 'Actividades' }} />
      <Tabs.Screen name="reports/index" options={{ title: 'Denuncias' }} />
      <Tabs.Screen
        name="users/index"
        options={{
          title: 'Usuarios',
          href: user.role === 'ADMIN' ? undefined : null,
        }}
      />
    </Tabs>
  );
}
