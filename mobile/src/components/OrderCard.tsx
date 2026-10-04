import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { Order } from "../types/api";

const statusMeta: Record<string, { label: string; bg: string; text: string }> = {
  RECEIVED: { label: "Received", bg: colors.brandSoft, text: colors.brandDark },
  WASHING: { label: "Washing", bg: colors.warningSoft, text: colors.warning },
  DRYING: { label: "Drying", bg: colors.warningSoft, text: colors.warning },
  IRONING: { label: "Ironing", bg: colors.warningSoft, text: colors.warning },
  READY: { label: "Ready", bg: colors.successSoft, text: colors.success },
  COMPLETED: { label: "Completed", bg: colors.successSoft, text: colors.success },
  CANCELLED: { label: "Cancelled", bg: colors.dangerSoft, text: colors.danger },
};

const paymentMeta: Record<string, { label: string; text: string }> = {
  UNPAID: { label: "Belum Lunas", text: colors.danger },
  PARTIAL: { label: "Sebagian", text: colors.warning },
  PAID: { label: "Lunas", text: colors.success },
  REFUNDED: { label: "Refund", text: colors.slate500 },
};

export default function OrderCard({
  order,
  onPress,
  onEdit,
  onDelete,
}: {
  order: Order;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const meta = statusMeta[order.status] ?? { label: order.status, bg: colors.slate100, text: colors.slate600 };
  const pay = paymentMeta[order.paymentStatus] ?? { label: order.paymentStatus, text: colors.slate500 };
  const canManage = order.status === "RECEIVED" && !(order.payments && order.payments.length > 0);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <Text style={styles.code}>{order.orderCode}</Text>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.customer} numberOfLines={1}>{order.customer?.name ?? "Customer"}</Text>
      <Text style={[styles.paymentLabel, { color: pay.text }]}>{pay.label}</Text>
      <View style={styles.bottom}>
        <Text style={styles.total}>Rp {Number(order.total).toLocaleString("id-ID")}</Text>
        <View style={styles.actions}>
          {canManage && onEdit ? (
            <Pressable hitSlop={8} onPress={onEdit} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={16} color={colors.brand} />
            </Pressable>
          ) : null}
          {canManage && onDelete ? (
            <Pressable hitSlop={8} onPress={onDelete} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </Pressable>
          ) : null}
          <Text style={styles.action}>View →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate200, padding: 14, marginBottom: 10 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  code: { fontSize: 12, fontWeight: "800", color: colors.navy, flexShrink: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  customer: { marginTop: 10, color: colors.slate600, fontSize: 13, fontWeight: "600" },
  paymentLabel: { fontSize: 10, fontWeight: "800", marginTop: 4 },
  bottom: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.slate50, alignItems: "center", justifyContent: "center" },
  action: { color: colors.brand, fontWeight: "800", fontSize: 12 },
});
