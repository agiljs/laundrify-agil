import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createCustomer, deleteCustomer, getCustomers, updateCustomer, updateMembership } from "../services/customer.service";
import type { Customer } from "../types/api";
import { colors } from "../theme/colors";
import MetricCard from "../components/MetricCard";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useFeedback } from "../providers/FeedbackProvider";

const PAGE_SIZE = 10;
const MEMBERSHIP_OPTIONS = [
  { value: "ALL", label: "Semua" },
  { value: "MEMBER", label: "Member" },
  { value: "NONE", label: "Non-member" },
];

type FormState = { name: string; phone: string; email: string; address: string };
const EMPTY_FORM: FormState = { name: "", phone: "", email: "", address: "" };

export default function CustomersScreen() {
  const { showSuccess, showError, confirm } = useFeedback();
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setCustomers(await getCustomers());
    } catch {
      showError("Gagal memuat customer", "Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const members = customers.filter((c) => c.membershipType === "MEMBER");
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints ?? 0), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchSearch = !q || `${c.name} ${c.phone} ${c.customerCode}`.toLowerCase().includes(q);
      const matchMembership = membershipFilter === "ALL" || c.membershipType === membershipFilter;
      return matchSearch && matchMembership;
    });
  }, [customers, search, membershipFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(v: string) { setSearch(v); setPage(1); }

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setFormOpen(true); }
  function openEdit(c: Customer) {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? "", address: c.address ?? "" });
    setFormOpen(true);
  }

  async function submitForm() {
    if (!form.name.trim() || !form.phone.trim()) {
      showError("Data belum lengkap", "Nama dan nomor telepon wajib diisi.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
    };
    try {
      setSubmitting(true);
      if (editingId) {
        await updateCustomer(editingId, payload);
        showSuccess("Customer diperbarui", `${payload.name} berhasil diperbarui.`);
      } else {
        await createCustomer(payload);
        showSuccess("Customer ditambahkan", `${payload.name} berhasil ditambahkan.`);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      showError("Gagal menyimpan customer", (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleMembership(customer: Customer) {
    const next = customer.membershipType === "MEMBER" ? "NONE" : "MEMBER";
    const ok = await confirm({
      title: next === "MEMBER" ? "Aktifkan membership?" : "Nonaktifkan membership?",
      message: `${next === "MEMBER" ? "Aktifkan" : "Nonaktifkan"} membership untuk ${customer.name}.`,
    });
    if (!ok) return;
    try {
      await updateMembership(customer.id, next, next === "MEMBER" ? 5 : 0);
      showSuccess("Membership diperbarui", `${customer.name} sekarang ${next === "MEMBER" ? "menjadi member" : "bukan member"}.`);
      await load();
    } catch (e) {
      showError("Gagal memperbarui membership", (e as Error).message);
    }
  }

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      title: "Hapus customer ini?",
      message: `${customer.name} akan dihapus dari daftar customer.`,
      confirmText: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCustomer(customer.id);
      showSuccess("Customer dihapus", `${customer.name} berhasil dihapus.`);
      await load();
    } catch (e) {
      showError("Gagal menghapus customer", (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Terjadi kesalahan.");
    }
  }

  const filterActive = membershipFilter !== "ALL";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>CUSTOMER MANAGEMENT</Text>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>Customer dan membership dalam satu menu.</Text>
          </View>
          <Pressable style={styles.newBtn} onPress={openCreate}>
            <Ionicons name="add" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard label="Total Pelanggan" value={String(customers.length)} icon="◎" />
          <MetricCard label="Member" value={String(members.length)} icon="★" accent={colors.warning} />
        </View>
        <View style={styles.metricGridSingle}>
          <MetricCard label="Total Loyalty Points" value={totalLoyaltyPoints.toLocaleString("id-ID")} icon="✦" accent={colors.success} />
        </View>

        <SearchBar
          value={search}
          onChangeText={updateSearch}
          placeholder="Cari nama / telepon / kode..."
          onFilterPress={() => setFilterOpen(true)}
          filterActive={filterActive}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Customer</Text>
          <Text style={styles.count}>{filtered.length}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : paginated.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={30} color={colors.slate400} />
            <Text style={styles.emptyText}>Belum ada customer yang cocok.</Text>
          </View>
        ) : (
          paginated.map((customer) => (
            <View key={customer.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
                  <Text style={styles.meta}>{customer.customerCode} • {customer.phone}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: customer.membershipType === "MEMBER" ? colors.successSoft : colors.slate100 }]}>
                  <Text style={{ color: customer.membershipType === "MEMBER" ? colors.success : colors.slate500, fontSize: 10, fontWeight: "800" }}>
                    {customer.membershipType}
                  </Text>
                </View>
              </View>
              <View style={styles.points}>
                <Text style={styles.pointsText}>{customer.loyaltyPoints} loyalty points</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => void toggleMembership(customer)} style={styles.manage}>
                    <Text style={styles.manageText}>{customer.membershipType === "MEMBER" ? "Remove member" : "Make member"}</Text>
                  </Pressable>
                  <Pressable onPress={() => openEdit(customer)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={15} color={colors.brand} />
                  </Pressable>
                  <Pressable onPress={() => void handleDelete(customer)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </ScrollView>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Filter Customer</Text>
            <Text style={styles.modalLabel}>Status Membership</Text>
            <View style={styles.chipWrap}>
              {MEMBERSHIP_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => { setMembershipFilter(opt.value); setPage(1); }}
                  style={[styles.chip, membershipFilter === opt.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, membershipFilter === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.applyBtn} onPress={() => setFilterOpen(false)}>
              <Text style={styles.applyText}>Terapkan</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modal}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>{editingId ? "Edit Customer" : "Customer Baru"}</Text>

                <Text style={styles.modalLabel}>Nama</Text>
                <TextInput value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Nama customer" placeholderTextColor={colors.slate400} style={styles.formInput} />

                <Text style={styles.modalLabel}>Nomor Telepon</Text>
                <TextInput value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="08xxxxxxxxxx" placeholderTextColor={colors.slate400} keyboardType="phone-pad" style={styles.formInput} />

                <Text style={styles.modalLabel}>Email (opsional)</Text>
                <TextInput value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="email@contoh.com" placeholderTextColor={colors.slate400} keyboardType="email-address" autoCapitalize="none" style={styles.formInput} />

                <Text style={styles.modalLabel}>Alamat (opsional)</Text>
                <TextInput value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Alamat lengkap" placeholderTextColor={colors.slate400} style={[styles.formInput, styles.textarea]} multiline />

                <Pressable disabled={submitting} onPress={() => void submitForm()} style={[styles.applyBtn, submitting && { opacity: 0.6 }]}>
                  <Text style={styles.applyText}>{submitting ? "Menyimpan..." : "Simpan"}</Text>
                </Pressable>
                <Pressable onPress={() => setFormOpen(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Batal</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  metricGridSingle: { marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 6 },
  sectionTitle: { color: colors.navy, fontSize: 18, fontWeight: "900" },
  count: { backgroundColor: colors.brandSoft, color: colors.brandDark, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
  emptyText: { color: colors.slate400, fontSize: 12, fontWeight: "600" },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate200, padding: 15, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brandDark, fontSize: 17, fontWeight: "900" },
  name: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  meta: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  points: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.slate100 },
  pointsText: { color: colors.slate600, fontSize: 11, fontWeight: "700" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  manage: { paddingVertical: 7, paddingHorizontal: 10, backgroundColor: colors.brandSoft, borderRadius: 10 },
  manageText: { color: colors.brandDark, fontSize: 10, fontWeight: "800" },
  iconBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.slate50, alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30, maxHeight: "88%" },
  modalTitle: { color: colors.navy, fontSize: 20, fontWeight: "900", marginBottom: 16 },
  modalLabel: { color: colors.slate500, fontSize: 11, fontWeight: "800", marginBottom: 8, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50 },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.slate600, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colors.white },
  applyBtn: { height: 50, borderRadius: 15, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 20 },
  applyText: { color: colors.white, fontWeight: "800" },
  cancelBtn: { height: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center", marginTop: 10 },
  cancelText: { color: colors.slate600, fontWeight: "800" },
  formInput: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 14, paddingHorizontal: 15, height: 48, color: colors.navy, backgroundColor: colors.slate50 },
  textarea: { height: 76, paddingTop: 12, textAlignVertical: "top" },
});
