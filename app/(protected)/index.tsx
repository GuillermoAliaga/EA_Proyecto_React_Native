import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return <View style={styles.container}><Text style={styles.label}>Home</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
