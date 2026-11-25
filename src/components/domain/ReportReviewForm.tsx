import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { Report, ReportStatus } from '../../models/report.model';
import { REPORT_STATUSES } from '../../models/report.model';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getReport, updateReport } from '../../services/report.service';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { ErrorView, LoadingView } from '../ui/StateViews';
import { Header } from '../layout/Header';
import { ScreenWrapper } from '../layout/ScreenWrapper';

export function ReportReviewForm({ reportId }: { reportId: string }) {
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    void getReport(reportId, controller.signal)
      .then((result) => {
        setReport(result);
        setStatus(result.status);
        setAdminNotes(result.adminNotes ?? '');
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la denuncia.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reportId, loadAttempt]);

  const submit = async () => {
    if (adminNotes.length > 500) {
      setFormError('Las notas no pueden superar los 500 caracteres.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await updateReport(reportId, { status, adminNotes: adminNotes.trim() });
      showToast('Denuncia actualizada.');
      router.replace('/(protected)/reports');
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar la denuncia.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView title="Cargando denuncia..." />;
  if (loadError || !report) {
    return (
      <ErrorView
        title="No se pudo cargar la denuncia"
        description={loadError ?? 'La denuncia solicitada no está disponible.'}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }

  return (
    <ScreenWrapper scroll>
      <Header title="Revisar denuncia" />
      <AppInput label="Tipo de objetivo" value={report.targetType} editable={false} style={{ backgroundColor: colors.background, color: colors.textSecondary }} />
      <AppInput label="Identificador del objetivo" value={report.targetId} editable={false} style={{ backgroundColor: colors.background, color: colors.textSecondary }} />
      <AppInput label="Motivo" value={report.reason} editable={false} style={{ backgroundColor: colors.background, color: colors.textSecondary }} />
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Descripción original</Text>
        <TextInput
          accessibilityLabel="Descripción original"
          value={report.description}
          editable={false}
          multiline
          textAlignVertical="top"
          style={[styles.multiline, { borderColor: colors.border, color: colors.textSecondary, backgroundColor: colors.background }]}
        />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Estado</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker style={{ color: colors.text }} selectedValue={status} onValueChange={(value: ReportStatus) => setStatus(value)}>
            {REPORT_STATUSES.map((item) => <Picker.Item key={item} label={item} value={item} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Notas del administrador</Text>
        <TextInput
          accessibilityLabel="Notas del administrador"
          value={adminNotes}
          onChangeText={(value) => {
            setAdminNotes(value.slice(0, 500));
            setFormError(null);
          }}
          multiline
          maxLength={500}
          textAlignVertical="top"
          style={[styles.multiline, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Añade notas para la revisión"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.counter, { color: colors.textSecondary }]}>{adminNotes.length}/500 caracteres</Text>
      </View>
      {formError ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{formError}</Text> : null}
      <AppButton title="Guardar revisión" onPress={() => void submit()} loading={saving} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  pickerWrap: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  multiline: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  counter: { alignSelf: 'flex-end', fontSize: 12 },
  error: { fontSize: 14 },
});
