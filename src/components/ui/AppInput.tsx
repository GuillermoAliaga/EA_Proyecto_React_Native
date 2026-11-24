import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { theme } from '../../config/theme';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AppInput({ label, error, secureTextEntry, style, ...props }: AppInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const canTogglePassword = Boolean(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={canTogglePassword && !passwordVisible}
          {...props}
        />
        {canTogglePassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setPasswordVisible((visible) => !visible)}
            hitSlop={8}
          >
            <Text style={styles.toggleText}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  inputContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
  },
  input: { flex: 1, minHeight: 46, color: theme.colors.text, fontSize: 16 },
  inputError: { borderColor: theme.colors.danger },
  error: { color: theme.colors.danger, fontSize: 13 },
  toggleText: { color: theme.colors.primary, fontWeight: '600', padding: 6 },
});
