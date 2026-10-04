import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { Order } from "../types/api";
import { deleteOrder, getOrders } from "../services/order.service";
import OrderCard from "../components/OrderCard";
import MetricCard from "../components/MetricCard";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { colors } from "../theme/colors";
import { useFeedback } from "../providers/FeedbackProvider";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua" },
  { value: "RECEIVED", label: "Received" },
  { value: "WASHING", label: "Washing" },
  { value: "DRYING", label: "Drying" },
  { value: "IRONING", label: "Ironing" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_OPTIONS = [
  { value: "ALL", label: "Semua" },
  { value: "UNPAID", label: "Belum Lunas" },
  { value: "PARTIAL", label: "Sebagian" },
  { value: "PAID", label: "Lunas" },
];

export default function OrdersScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { showSuccess, showError, confirm } = useFeedback();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setOrders(await getOrders());
    } catch {
      showError("Gagal memuat order", "Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const inProgress = orders.filter((o) => ["WASHING", "DRYING", "IRONING", "READY"].includes(o.status));
  const paid = orders.filter((o) => o.paymentStatus === "PAID");
  const unpaid = orders.filter((o) => o.paymentStatus !== "PAID");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        !q ||
        o.orderCode.toLowerCase().includes(q) ||
        (o.customer?.name ?? "").toLowerCase().includes(q) ||
        (o.customer?.phone ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchPayment = paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) { setSearch(value); setPage(1); }
  function applyFilter(status: string, payment: string) { setStatusFilter(status); setPaymentFilter(payment); setPage(1); setFilterOpen(false); }
  function resetFilter() { setStatusFilter("ALL"); setPaymentFilter("ALL"); setPage(1); setFilterOpen(false); }

  async function handleDelete(order: Order) {
    const ok = await confirm({
      title: "Hapus order ini?",
      message: `Order ${order.orderCode} akan dihapus permanen dan tidak dapat dikembalikan.`,
      confirmText: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteOrder(order.id);
      showSuccess("Order dihapus", `${order.orderCode} berhasil dihapus.`);
      await load();
    } catch (e) {
      showError("Gagal menghapus order", (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Terjadi kesalahan.");
    }
  }

  const filterActive = statusFilter !== "ALL" || paymentFilter !== "ALL";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>OPERATIONS</Text>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.subtitle}>Kelola seluruh pesanan laundry.</Text>
          </View>
          <Pressable style={styles.newBtn} onPress={() => navigation.navigate("OrderForm", undefined)}>
            <Ionicons name="add" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard label="Total Order" value={String(orders.length)} icon="▣" />
          <MetricCard label="Sedang Berjalan" value={String(inProgress.length)} icon="⟳" accent={colors.warning} />
        </View>
        <View style={styles.metricGrid}>
          <MetricCard label="Sudah Bayar" value={String(paid.length)} icon="✓" accent={colors.success} />
          <MetricCard label="Belum Lunas" value={String(unpaid.length)} icon="!" accent={colors.danger} />
        </View>

        <SearchBar
          value={search}
          onChangeText={updateSearch}
          placeholder="Cari kode order / nama customer..."
          onFilterPress={() => setFilterOpen(true)}
          filterActive={filterActive}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Order</Text>
          <Text style={styles.count}>{filtered.length}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : paginated.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={30} color={colors.slate400} />
            <Text style={styles.emptyText}>Belum ada order yang cocok.</Text>
          </View>
        ) : (
          paginated.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}
              onEdit={() => navigation.navigate("OrderForm", { orderId: order.id })}
              onDelete={() => void handleDelete(order)}
            />
          ))
        )}

        <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </ScrollView>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Filter Order</Text>

            <Text style={styles.modalLabel}>Status Order</Text>
            <View style={styles.chipWrap}>
              {STATUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setStatusFilter(opt.value)}
                  style={[styles.chip, statusFilter === opt.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, statusFilter === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.modalLabel, { marginTop: 18 }]}>Status Pembayaran</Text>
            <View style={styles.chipWrap}>
              {PAYMENT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setPaymentFilter(opt.value)}
                  style={[styles.chip, paymentFilter === opt.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, paymentFilter === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.resetBtn} onPress={resetFilter}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={() => applyFilter(statusFilter, paymentFilter)}>
                <Text style={styles.applyText}>Terapkan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 112 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: colors.brand, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.navy, fontSize: 28, fontWeight: "900", marginTop: 4 },
  subtitle: { color: colors.slate500, fontSize: 13, marginTop: 5 },
  newBtn: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 4 },
  metricGrid: { flexDirection: "row", gap: 12, marginTop: 18 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 6 },
  sectionTitle: { color: colors.navy, fontSize: 18, fontWeight: "900" },
  count: { backgroundColor: colors.brandSoft, color: colors.brandDark, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
  emptyText: { color: colors.slate400, fontSize: 12, fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30 },
  modalTitle: { color: colors.navy, fontSize: 20, fontWeight: "900", marginBottom: 16 },
  modalLabel: { color: colors.slate500, fontSize: 11, fontWeight: "800", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50 },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.slate600, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colors.white },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  resetBtn: { flex: 1, height: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  resetText: { color: colors.slate600, fontWeight: "800" },
  applyBtn: { flex: 1, height: 50, borderRadius: 15, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  applyText: { color: colors.white, fontWeight: "800" },
});
