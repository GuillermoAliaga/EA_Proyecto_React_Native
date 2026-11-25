import { useLocalSearchParams } from 'expo-router';
import { UserForm } from '../../../../src/components/domain/UserForm';
import { LoadingView } from '../../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../../src/hooks/useRequireRole';

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAdmin = useRequireRole(['ADMIN']);
  if (!isAdmin || !id) return <LoadingView />;
  return <UserForm userId={Array.isArray(id) ? id[0] : id} />;
}
