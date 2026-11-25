import { Redirect } from 'expo-router';
import { LoadingView } from '../src/components/ui/StateViews';
import { useAuth } from '../src/context/AuthContext';

export default function IndexScreen() {
  const { user, isInitializing, initializationError } = useAuth();

  if (isInitializing) return <LoadingView title="Comprobando sesión..." />;
  if (initializationError) return <Redirect href="/login" />;

  return <Redirect href={user ? '/(protected)' : '/login'} />;
}
