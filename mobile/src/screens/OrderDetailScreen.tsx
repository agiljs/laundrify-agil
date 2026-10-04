import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../navigation/types";
import type { Order, PaymentRecord } from "../types/api";
import {
  deleteOrder,
  getOrder,
  updateOrderStatus,
} from "../services/order.service";
import { createPayment, type PaymentInput } from "../services/payment.service";
import { downloadPaymentReceipt } from "../utils/receipt";
import { colors } from "../theme/colors";
import { useFeedback } from "../providers/FeedbackProvider";

type Props = NativeStackScreenProps<RootStackParamList, "OrderDetail">;
type Method = "CASH" | "QRIS" | "BANK_TRANSFER";

const next: Record<string, string[]> = {
  RECEIVED: ["WASHING", "CANCELLED"],
  WASHING: ["DRYING", "CANCELLED"],
  DRYING: ["IRONING", "CANCELLED"],
  IRONING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
};

const METHODS: {
  value: Method;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "CASH", label: "Tunai", icon: "cash-outline" },
  { value: "QRIS", label: "QRIS", icon: "qr-code-outline" },
  { value: "BANK_TRANSFER", label: "Transfer Bank", icon: "card-outline" },
];

const methodLabel: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  BANK_TRANSFER: "Transfer Bank",
  OTHER: "Lainnya",
};

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { showSuccess, showError, confirm } = useFeedback();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState<Method>("CASH");
  const [amount, setAmount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [transactionCode, setTransactionCode] = useState("");

  const load = useCallback(async () => {
    try {
      setOrder(await getOrder(route.params.orderId));
    } catch {
      showError(
        "Gagal memuat order",
        "Order tidak ditemukan atau terjadi kesalahan.",
      );
    }
  }, [route.params.orderId, showError]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!order)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );

  const canManage =
    order.status === "RECEIVED" &&
    !(order.payments && order.payments.length > 0);
  const remaining = Math.max(
    0,
    Number(order.total) -
      (order.payments ?? [])
        .filter((p) => p.status === "SUCCESS")
        .reduce((sum, p) => sum + Number(p.amount), 0),
  );

  async function status(s: string) {
    if (!order) return;
    if (s === "CANCELLED") {
      const ok = await confirm({
        title: "Batalkan order ini?",
        message: `Order ${order.orderCode} akan dibatalkan.`,
        confirmText: "Ya, batalkan",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      setBusy(true);
      const updated = await updateOrderStatus(order.id, s);
      setOrder(updated);
      showSuccess("Status diperbarui", `Order sekarang berstatus ${s}.`);
    } catch (e) {
      showError(
        "Gagal memperbarui status",
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Status gagal diperbarui.",
      );
    } finally {
      setBusy(false);
    }
  }

  function openPayment() {
    setMethod("CASH");
    setAmount(String(remaining));
    setCashReceived("");
    setTransactionCode("");
    setPaymentOpen(true);
  }

  function selectMethod(m: Method) {
    setMethod(m);
    setAmount(String(remaining));
    setCashReceived("");
  }

  async function pay() {
    if (!order) return;
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      showError("Jumlah tidak valid", "Masukkan jumlah pembayaran yang benar.");
      return;
    }
    if (amountValue > remaining) {
      showError(
        "Jumlah melebihi tagihan",
        `Sisa tagihan hanya Rp ${remaining.toLocaleString("id-ID")}.`,
      );
      return;
    }

    const payload: PaymentInput = {
      orderId: order.id,
      method,
      amount: amountValue,
    };

    if (method === "CASH") {
      const cashValue = Number(cashReceived);
      if (!Number.isFinite(cashValue) || cashValue < amountValue) {
        showError(
          "Nominal kurang",
          `Uang tunai harus minimal Rp ${amountValue.toLocaleString("id-ID")}.`,
        );
        return;
      }
      payload.cashReceived = cashValue;
    } else if (transactionCode.trim()) {
      payload.transactionCode = transactionCode.trim();
    }

    try {
      setBusy(true);
      const result = await createPayment(payload);
      setPaymentOpen(false);
      await load();
      showSuccess(
        "Pembayaran berhasil",
        `${methodLabel[method]} • Rp ${amountValue.toLocaleString("id-ID")} tercatat.`,
      );
      void downloadPaymentReceipt(order, result.payment).catch(() => undefined);
    } catch (e) {
      showError(
        "Pembayaran gagal",
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Terjadi kesalahan.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(payment: PaymentRecord) {
    if (!order) return;
    try {
      setDownloadingId(payment.id);
      await downloadPaymentReceipt(order, payment);
    } catch {
      showError(
        "Gagal membuat bukti pembayaran",
        "Terjadi kesalahan saat membuat file PDF.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    if (!order) return;
    const ok = await confirm({
      title: "Hapus order ini?",
      message: `Order ${order.orderCode} akan dihapus permanen.`,
      confirmText: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      setBusy(true);
      await deleteOrder(order.id);
      showSuccess("Order dihapus", `${order.orderCode} berhasil dihapus.`);
      navigation.goBack();
    } catch (e) {
      showError(
        "Gagal menghapus order",
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Terjadi kesalahan.",
      );
    } finally {
      setBusy(false);
    }
  }

  const change =
    method === "CASH"
      ? Math.max(0, Number(cashReceived || 0) - Number(amount || 0))
      : 0;
  const successPayments = (order.payments ?? []).filter(
    (p) => p.status === "SUCCESS",
  );

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18 },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>ORDER DETAIL</Text>
            <Text style={styles.title}>{order.orderCode}</Text>
          </View>
          {canManage ? (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  navigation.navigate("OrderForm", { orderId: order.id })
                }
                style={styles.iconBtn}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.brand}
                />
              </Pressable>
              <Pressable
                onPress={() => void handleDelete()}
                style={styles.iconBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.hero}>
          <Text style={styles.customer}>
            {order.customer?.name ?? "Customer"}
          </Text>
          <Text style={styles.total}>
            Rp {Number(order.total).toLocaleString("id-ID")}
          </Text>
          <Text style={styles.payment}>
            Payment: {order.paymentStatus}
            {remaining > 0
              ? ` • Sisa Rp ${remaining.toLocaleString("id-ID")}`
              : ""}
          </Text>
        </View>

        <Text style={styles.section}>Services</Text>
        {order.items?.map((item) => (
          <View style={styles.item} key={item.id}>
            <Text style={styles.itemName}>
              {item.service?.name ?? "Service"} × {Number(item.quantity)}
            </Text>
            <Text style={styles.itemPrice}>
              Rp {Number(item.subtotal).toLocaleString("id-ID")}
            </Text>
          </View>
        ))}

        <Text style={styles.section}>Quick Actions</Text>
        <Pressable
          disabled={busy || remaining <= 0}
          onPress={openPayment}
          style={[styles.primary, (busy || remaining <= 0) && { opacity: 0.5 }]}
        >
          <Text style={styles.primaryText}>
            {remaining <= 0 ? "Payment Completed" : "Terima Pembayaran"}
          </Text>
        </Pressable>
        {(next[order.status] ?? []).map((s) => (
          <Pressable
            key={s}
            disabled={busy}
            onPress={() => void status(s)}
            style={[styles.secondary, s === "CANCELLED" && styles.danger]}
          >
            <Text
              style={[
                styles.secondaryText,
                s === "CANCELLED" && styles.dangerText,
              ]}
            >
              {s.replaceAll("_", " ")}
            </Text>
          </Pressable>
        ))}

        {successPayments.length > 0 ? (
          <>
            <Text style={styles.section}>Riwayat Pembayaran</Text>
            {successPayments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <Ionicons
                    name={
                      METHODS.find((m) => m.value === p.method)?.icon ??
                      "wallet-outline"
                    }
                    size={17}
                    color={colors.brand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentAmount}>
                    Rp {Number(p.amount).toLocaleString("id-ID")}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {methodLabel[p.method] ?? p.method} •{" "}
                    {new Date(p.paidAt).toLocaleDateString("id-ID")}
                    {p.transactionCode ? ` • ${p.transactionCode}` : ""}
                  </Text>
                </View>
                <Pressable
                  disabled={downloadingId === p.id}
                  onPress={() => void handleDownload(p)}
                  style={styles.downloadBtn}
                >
                  {downloadingId === p.id ? (
                    <ActivityIndicator size="small" color={colors.brand} />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={colors.brand}
                    />
                  )}
                </Pressable>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={paymentOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Terima Pembayaran</Text>

              <View style={styles.methodRow}>
                {METHODS.map((m) => (
                  <Pressable
                    key={m.value}
                    onPress={() => selectMethod(m.value)}
                    style={[
                      styles.methodChip,
                      method === m.value && styles.methodChipActive,
                    ]}
                  >
                    <Ionicons
                      name={m.icon}
                      size={16}
                      color={
                        method === m.value ? colors.white : colors.slate600
                      }
                    />
                    <Text
                      style={[
                        styles.methodChipText,
                        method === m.value && styles.methodChipTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Sisa Tagihan</Text>
              <Text style={styles.modalTotal}>
                Rp {remaining.toLocaleString("id-ID")}
              </Text>

              <Text style={styles.modalLabel}>Jumlah Pembayaran</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.slate400}
                style={styles.cashInput}
              />

              {method === "CASH" ? (
                <>
                  <Text style={styles.modalLabel}>Uang Diterima</Text>
                  <TextInput
                    value={cashReceived}
                    onChangeText={setCashReceived}
                    keyboardType="numeric"
                    placeholder="Contoh: 100000"
                    placeholderTextColor={colors.slate400}
                    style={styles.cashInput}
                  />
                  <View style={styles.change}>
                    <Text style={styles.modalLabel}>Kembalian</Text>
                    <Text style={styles.changeValue}>
                      Rp {change.toLocaleString("id-ID")}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.qrisNotice}>
                    <Ionicons
                      name={
                        method === "QRIS" ? "qr-code-outline" : "card-outline"
                      }
                      size={20}
                      color={colors.brand}
                    />
                    <Text style={styles.qrisNoticeText}>
                      {method === "QRIS"
                        ? "Minta customer scan QRIS toko, lalu catat pembayarannya di sini."
                        : "Pastikan dana sudah masuk ke rekening toko sebelum mencatat pembayaran ini."}
                    </Text>
                  </View>
                  <Text style={styles.modalLabel}>
                    Kode Transaksi (opsional)
                  </Text>
                  <TextInput
                    value={transactionCode}
                    onChangeText={setTransactionCode}
                    placeholder="Contoh: TRX-2024-00219"
                    placeholderTextColor={colors.slate400}
                    style={styles.cashInput}
                  />
                </>
              )}

              <Pressable
                disabled={busy}
                onPress={() => void pay()}
                style={[styles.primary, busy && { opacity: 0.6 }]}
              >
                <Text style={styles.primaryText}>
                  {busy ? "Memproses..." : "Konfirmasi Pembayaran"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPaymentOpen(false)}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Batal</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerActions: { flexDirection: "row", gap: 8, marginTop: -15 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: colors.navy, fontSize: 28, fontWeight: "900", marginTop: 5 },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 22,
    padding: 20,
    marginTop: 18,
    marginBottom: 24,
  },
  customer: { color: "#CBD5E1", fontSize: 14, fontWeight: "700" },
  total: { color: colors.white, fontSize: 30, fontWeight: "900", marginTop: 8 },
  payment: { color: "#7DD3FC", fontSize: 12, fontWeight: "800", marginTop: 6 },
  section: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 20,
  },
  item: {
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: { color: colors.slate700, fontWeight: "700", flex: 1 },
  itemPrice: { color: colors.navy, fontWeight: "800" },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: 15,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  primaryText: { color: colors.white, fontWeight: "800" },
  secondary: {
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.slate200,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  secondaryText: { color: colors.slate700, fontWeight: "800" },
  danger: { borderColor: "#FECACA" },
  dangerText: { color: colors.danger },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 13,
    marginBottom: 8,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAmount: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  paymentMeta: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.slate50,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: "90%",
  },
  modalTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16,
  },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  methodChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 13,
    paddingVertical: 10,
    backgroundColor: colors.slate50,
  },
  methodChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  methodChipText: { color: colors.slate600, fontSize: 11, fontWeight: "800" },
  methodChipTextActive: { color: colors.white },
  modalLabel: {
    color: colors.slate500,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 5,
    marginTop: 12,
  },
  modalTotal: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  cashInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: colors.navy,
    marginBottom: 4,
  },
  change: {
    backgroundColor: colors.successSoft,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  changeValue: { color: colors.success, fontSize: 20, fontWeight: "900" },
  qrisNotice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.brandSoft,
    borderRadius: 14,
    padding: 13,
    marginTop: 8,
    alignItems: "flex-start",
  },
  qrisNoticeText: {
    flex: 1,
    color: colors.brandDark,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
});
