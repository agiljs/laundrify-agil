import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function MetricCard({ label, value, icon, accent = colors.brand }: { label: string; value: string; icon: string; accent?: string }) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: `${accent}18` }]}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ card: { flex: 1, minWidth: 0, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate200, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 }, icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 }, label: { color: colors.slate500, fontSize: 12, fontWeight: "600" }, value: { color: colors.navy, fontSize: 21, fontWeight: "800", marginTop: 4 } });
