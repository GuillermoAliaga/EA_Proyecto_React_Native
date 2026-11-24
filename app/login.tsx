import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Header } from '../src/components/layout/Header';
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper';
import { AppButton } from '../src/components/ui/AppButton';
import { AppInput } from '../src/components/ui/AppInput';
import { useToast } from '../src/context/ToastContext';
import { theme } from '../src/config/theme';

export default function LoginScreen() {
  const { showToast } = useToast();

  return (
    <ScreenWrapper scroll>
      <View style={styles.form}>
        <Header title="Iniciar sesión" subtitle="Accede a tu cuenta" />
        <AppInput label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" />
        <AppInput label="Contraseña" secureTextEntry />
        <AppButton
          title="Entrar"
          onPress={() => showToast('La autenticación se conectará en una siguiente fase.')}
        />
        <Link href="/register" style={styles.link}>¿No tienes cuenta? Regístrate</Link>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, justifyContent: 'center', gap: 18, width: '100%', maxWidth: 480, alignSelf: 'center' },
  link: { color: theme.colors.primary, textAlign: 'center', fontWeight: '600' },
});
