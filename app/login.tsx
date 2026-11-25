import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Header } from '../src/components/layout/Header';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { AppButton } from '../src/components/ui/AppButton';
import { AppInput } from '../src/components/ui/AppInput';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/config/theme';

export default function LoginScreen() {
  const { signIn, initializationError, retryInitialization } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/(protected)');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.form}>
        <Header title="Iniciar sesión" subtitle="Accede a tu cuenta" />
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
          autoComplete="password"
        />
        {error || initializationError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error ?? initializationError}
          </Text>
        ) : null}
        {initializationError ? (
          <AppButton
            title="Reintentar conexión"
            variant="ghost"
            onPress={() => void retryInitialization()}
            disabled={loading}
          />
        ) : null}
        <AppButton
          title="Entrar"
          onPress={() => void handleLogin()}
          loading={loading}
          disabled={!email.trim() || !password}
        />
        <Link href="/register" style={styles.link}>¿No tienes cuenta? Regístrate</Link>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, justifyContent: 'center', gap: 18, width: '100%', maxWidth: 480, alignSelf: 'center' },
  link: { color: theme.colors.primary, textAlign: 'center', fontWeight: '600' },
  error: { color: theme.colors.danger, fontSize: 14 },
});
