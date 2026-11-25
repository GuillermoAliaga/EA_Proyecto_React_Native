import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header } from '../src/components/layout/Header';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { AppButton } from '../src/components/ui/AppButton';
import { AppInput } from '../src/components/ui/AppInput';
import { register } from '../src/services/auth.service';
import { useTheme } from '../src/context/ThemeContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Introduce un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los términos para continuar.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace({ pathname: '/login', params: { registered: '1' } });
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'No se pudo crear la cuenta.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.form}>
        <Header title="Crear cuenta" subtitle="Regístrate para continuar" />
        <AppInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />
        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <AppInput
          label="Repetir contraseña"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
          autoComplete="new-password"
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => setAcceptedTerms((accepted) => !accepted)}
          style={styles.terms}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.textSecondary, backgroundColor: colors.surface },
              acceptedTerms && { borderColor: colors.primary, backgroundColor: colors.primary },
            ]}
          >
            {acceptedTerms ? <Text style={[styles.checkmark, { color: colors.surface }]}>✓</Text> : null}
          </View>
          <Text style={[styles.termsLabel, { color: colors.text }]}>Acepto los términos y condiciones</Text>
        </Pressable>
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        <AppButton
          title="Registrarme"
          onPress={() => void handleRegister()}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
  },
  checkmark: { fontWeight: '700' },
  termsLabel: { flex: 1, fontSize: 14 },
  error: { fontSize: 14 },
});
