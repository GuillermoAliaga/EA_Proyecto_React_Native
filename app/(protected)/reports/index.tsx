import { StyleSheet, Text, View } from 'react-native';

export default function ReportsScreen() {
  return <View style={styles.container}><Text style={styles.label}>Denunciar</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
