import { ScrollView, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';

export function ScreenWrapper({
  children,
  scroll = false,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return <SafeAreaView style={styles.screen}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, padding: 20, gap: 16 },
});
