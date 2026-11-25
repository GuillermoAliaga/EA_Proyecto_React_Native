import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { LoadingView } from '../src/components/ui/StateViews';
import { useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';

function AppNavigator() {
  const { isInitializing } = useAuth();
  if (isInitializing) return <LoadingView title="Comprobando sesión..." />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
