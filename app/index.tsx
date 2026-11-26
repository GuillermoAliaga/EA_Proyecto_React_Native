import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function IndexScreen() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(protected)/(tabs)' : '/login'} />;
}
