import { useLocalSearchParams } from 'expo-router';
import { ActivityForm } from '../../../../src/components/domain/ActivityForm';
import { LoadingView } from '../../../../src/components/ui/StateViews';
import { useRequireRole } from '../../../../src/hooks/useRequireRole';

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAdmin = useRequireRole(['ADMIN']);
  return isAdmin ? <ActivityForm activityId={id} /> : <LoadingView />;
}
