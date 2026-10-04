import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>{start}-{end} dari {total}</Text>
      <View style={styles.controls}>
        <Pressable disabled={page <= 1} onPress={() => onChange(page - 1)} style={[styles.btn, page <= 1 && styles.btnDisabled]}>
          <Ionicons name="chevron-back" size={16} color={page <= 1 ? colors.slate400 : colors.navy} />
        </Pressable>
        <View style={styles.pageBadge}><Text style={styles.pageText}>{page} / {totalPages}</Text></View>
        <Pressable disabled={page >= totalPages} onPress={() => onChange(page + 1)} style={[styles.btn, page >= totalPages && styles.btnDisabled]}>
          <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? colors.slate400 : colors.navy} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 18 },
  info: { color: colors.slate500, fontSize: 11, fontWeight: "700" },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  btnDisabled: { opacity: 0.5 },
  pageBadge: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  pageText: { color: colors.brandDark, fontSize: 11, fontWeight: "800" },
});
