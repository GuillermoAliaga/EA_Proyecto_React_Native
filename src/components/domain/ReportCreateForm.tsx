import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { REPORT_REASONS, TARGET_TYPES } from '../../models/report.model';
import type { ReportInput, ReportReason, TargetType } from '../../models/report.model';
import { createReport } from '../../services/report.service';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { Header } from '../layout/Header';
import { ScreenWrapper } from '../layout/ScreenWrapper';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function ReportCreateForm() {
  const params = useLocalSearchParams<{ targetType?: string | string[]; targetId?: string | string[]; title?: string | string[] }>();
  const initialTargetType = firstParam(params.targetType);
  const presetTitle = firstParam(params.title);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [targetType, setTargetType] = useState<TargetType>(
    TARGET_TYPES.includes(initialTargetType as TargetType) ? (initialTargetType as TargetType) : 'ACTIVITY',
  );
  const [targetId, setTargetId] = useState(firstParam(params.targetId));
  const hasPresetActivity = initialTargetType === 'ACTIVITY' && OBJECT_ID_PATTERN.test(firstParam(params.targetId));
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmedTargetId = targetId.trim();
    const trimmedDescription = description.trim();
    if (!OBJECT_ID_PATTERN.test(trimmedTargetId)) {
      setError('Introduce un identificador válido de 24 caracteres hexadecimales.');
      return;
    }
    if (trimmedDescription.length < 5 || trimmedDescription.length > 1000) {
      setError('La descripción debe tener entre 5 y 1000 caracteres.');
      return;
    }

    const payload: ReportInput = {
      targetType,
      targetId: trimmedTargetId,
      reason,
      description: trimmedDescription,
    };
    setSaving(true);
    setError(null);
    try {
      await createReport(payload);
      showToast('Denuncia enviada correctamente.');
      router.replace('/(protected)/(tabs)/activities');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la denuncia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <Header title="Nueva denuncia" subtitle="Describe el contenido que quieres reportar." />
      {hasPresetActivity ? (
        <Text style={[styles.selectedActivity, { color: colors.text }]}>Actividad denunciada: {presetTitle || 'Actividad seleccionada'}</Text>
      ) : null}
      {!hasPresetActivity ? <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Tipo de objetivo</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker style={{ color: colors.text }} selectedValue={targetType} onValueChange={(value: TargetType) => setTargetType(value)}>
            {TARGET_TYPES.map((type) => <Picker.Item key={type} label={type} value={type} />)}
          </Picker>
        </View>
      </View> : null}
      {!hasPresetActivity ? <AppInput
        label="Identificador del objetivo"
        value={targetId}
        onChangeText={setTargetId}
        autoCapitalize="none"
        placeholder="ID del usuario o actividad"
      /> : null}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Motivo</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Picker style={{ color: colors.text }} selectedValue={reason} onValueChange={(value: ReportReason) => setReason(value)}>
            {REPORT_REASONS.map((item) => <Picker.Item key={item} label={item} value={item} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
        <TextInput
          accessibilityLabel="Descripción"
          value={description}
          onChangeText={(value) => {
            setDescription(value.slice(0, 1000));
            setError(null);
          }}
          multiline
          maxLength={1000}
          textAlignVertical="top"
          style={[styles.multiline, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Explica el motivo de la denuncia"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.counter, { color: colors.textSecondary }]}>{description.length}/1000 caracteres (mínimo 5)</Text>
      </View>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      <AppButton title="Enviar denuncia" onPress={() => void submit()} loading={saving} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  selectedActivity: { fontSize: 15, fontWeight: '600' },
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
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  counter: { alignSelf: 'flex-end', fontSize: 12 },
  error: { fontSize: 14 },
});
