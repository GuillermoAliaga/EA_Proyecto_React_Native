import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { theme } from '../../config/theme';
import { ROLES } from '../../models/user.model';
import type { User, UserInput, UserRole } from '../../models/user.model';
import { createUser, getUser, updateUser } from '../../services/user.service';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { ErrorView, LoadingView } from '../ui/StateViews';
import { Header } from '../layout/Header';
import { ScreenWrapper } from '../layout/ScreenWrapper';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserForm({ userId }: { userId?: string }) {
  const editing = Boolean(userId);
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    void getUser(userId, controller.signal)
      .then((result) => {
        setUser(result);
        setName(result.name);
        setEmail(result.email);
        setRole(result.role);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el usuario.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [userId, loadAttempt]);

  const submit = async () => {
    if (name.trim().length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFormError('Introduce un email válido.');
      return;
    }
    if ((!editing || password.length > 0) && password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const payload: UserInput = {
      name: name.trim(),
      email: email.trim(),
      role,
      ...(password ? { password } : {}),
    };
    setSaving(true);
    setFormError(null);
    try {
      if (userId) await updateUser(userId, payload);
      else await createUser({ ...payload, password });
      showToast(editing ? 'Usuario actualizado.' : 'Usuario creado.');
      router.replace('/(protected)/users');
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView title="Cargando usuario..." />;
  if (loadError) {
    return (
      <ErrorView
        title="No se pudo cargar el usuario"
        description={loadError}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }
  if (editing && !user) return <LoadingView title="Cargando usuario..." />;

  return (
    <ScreenWrapper scroll>
      <Header title={editing ? 'Editar usuario' : 'Nuevo usuario'} />
      <AppInput
        label="Nombre"
        value={name}
        onChangeText={(value) => { setName(value); setFormError(null); }}
        autoCapitalize="words"
        autoComplete="name"
      />
      <AppInput
        label="Email"
        value={email}
        onChangeText={(value) => { setEmail(value); setFormError(null); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <View style={styles.field}>
        <Text style={styles.label}>Rol</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={role} onValueChange={(value: UserRole) => setRole(value)}>
            {ROLES.map((item) => <Picker.Item key={item} label={item} value={item} />)}
          </Picker>
        </View>
      </View>
      <AppInput
        label="Contraseña"
        value={password}
        onChangeText={(value) => { setPassword(value); setFormError(null); }}
        secureTextEntry
        autoComplete="new-password"
        placeholder={editing ? 'Dejar vacía para conservarla' : 'Mínimo 6 caracteres'}
      />
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
      <AppButton title={editing ? 'Guardar cambios' : 'Crear usuario'} onPress={() => void submit()} loading={saving} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  pickerWrap: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  error: { color: theme.colors.danger, fontSize: 14 },
});
