import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { Customer, ServiceItem } from "../types/api";
import { getCustomers } from "../services/customer.service";
import { getActiveServices } from "../services/service.service";
import { createOrder, getOrder, updateOrder } from "../services/order.service";
import { colors } from "../theme/colors";
import { useFeedback } from "../providers/FeedbackProvider";

type Props = NativeStackScreenProps<RootStackParamList, "OrderForm">;
type CartLine = { service: ServiceItem; quantity: number };

export default function OrderFormScreen({ route, navigation }: Props) {
  const orderId = route.params?.orderId;
  const isEdit = !!orderId;
  const { showSuccess, showError } = useFeedback();
  const insets = useSafeAreaInsets();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function bootstrap() {
      try {
        const [customerList, serviceList] = await Promise.all([getCustomers(), getActiveServices()]);
        setCustomers(customerList);
        setServices(serviceList);

        if (orderId) {
          const order = await getOrder(orderId);
          if (order.customer) {
            const found = customerList.find((c) => c.id === order.customer!.id) ?? null;
            setSelectedCustomer(found);
          }
          setDeliveryFee(String(order.items ? 0 : 0));
          setNote("");
          const lines: CartLine[] = (order.items ?? [])
            .map((item) => {
              const service = serviceList.find((s) => s.name === item.service?.name);
              if (!service) return null;
              return { service, quantity: Number(item.quantity) };
            })
            .filter((l): l is CartLine => !!l);
          setCart(lines);
        }
      } catch (e) {
        showError("Gagal memuat data", "Tidak dapat memuat data customer/layanan.");
      } finally {
        setLoadingInitial(false);
      }
    }
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.phone} ${c.customerCode}`.toLowerCase().includes(q));
  }, [customers, customerSearch]);

  const subtotal = cart.reduce((sum, line) => sum + Number(line.service.price) * line.quantity, 0);
  const fee = Number(deliveryFee) || 0;
  const estimatedTotal = subtotal + fee;

  function addService(service: ServiceItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.service.id === service.id);
      if (existing) {
        return prev.map((l) => (l.service.id === service.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { service, quantity: 1 }];
    });
    setServicePickerOpen(false);
  }

  function changeQty(serviceId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.service.id === serviceId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(serviceId: string) {
    setCart((prev) => prev.filter((l) => l.service.id !== serviceId));
  }

  async function submit() {
    if (!selectedCustomer) { showError("Customer belum dipilih", "Pilih customer terlebih dahulu."); return; }
    if (cart.length === 0) { showError("Layanan kosong", "Tambahkan minimal satu layanan."); return; }

    const payload = {
      customerId: selectedCustomer.id,
      items: cart.map((l) => ({ serviceId: l.service.id, quantity: l.quantity })),
      deliveryFee: fee,
      note: note.trim() || undefined,
    };

    try {
      setSubmitting(true);
      if (isEdit && orderId) {
        await updateOrder(orderId, payload);
        showSuccess("Order diperbarui", "Perubahan order berhasil disimpan.");
      } else {
        await createOrder(payload);
        showSuccess("Order dibuat", "Order baru berhasil ditambahkan.");
      }
      navigation.goBack();
    } catch (e) {
      showError(
        isEdit ? "Gagal memperbarui order" : "Gagal membuat order",
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Terjadi kesalahan."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.navy} />
          </Pressable>
          <Text style={styles.title}>{isEdit ? "Edit Order" : "Order Baru"}</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.label}>Customer</Text>
        <Pressable style={styles.picker} onPress={() => setCustomerPickerOpen(true)}>
          {selectedCustomer ? (
            <View>
              <Text style={styles.pickerValue}>{selectedCustomer.name}</Text>
              <Text style={styles.pickerSub}>{selectedCustomer.customerCode} • {selectedCustomer.phone}</Text>
            </View>
          ) : (
            <Text style={styles.pickerPlaceholder}>Pilih customer...</Text>
          )}
          <Ionicons name="chevron-down" size={18} color={colors.slate400} />
        </Pressable>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Layanan</Text>
          <Pressable onPress={() => setServicePickerOpen(true)} style={styles.addServiceBtn}>
            <Ionicons name="add" size={16} color={colors.brand} />
            <Text style={styles.addServiceText}>Tambah</Text>
          </Pressable>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>Belum ada layanan dipilih.</Text>
          </View>
        ) : (
          cart.map((line) => (
            <View key={line.service.id} style={styles.cartLine}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartName}>{line.service.name}</Text>
                <Text style={styles.cartPrice}>Rp {Number(line.service.price).toLocaleString("id-ID")} / {line.service.unit}</Text>
              </View>
              <View style={styles.qtyControl}>
                <Pressable onPress={() => changeQty(line.service.id, -1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={14} color={colors.navy} />
                </Pressable>
                <Text style={styles.qtyValue}>{line.quantity}</Text>
                <Pressable onPress={() => changeQty(line.service.id, 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={14} color={colors.navy} />
                </Pressable>
              </View>
              <Pressable onPress={() => removeLine(line.service.id)} hitSlop={8} style={{ marginLeft: 10 }}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}

        <Text style={styles.label}>Ongkos Kirim</Text>
        <TextInput
          value={deliveryFee}
          onChangeText={setDeliveryFee}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.slate400}
          style={styles.input}
        />

        <Text style={styles.label}>Catatan (opsional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Catatan tambahan untuk order ini"
          placeholderTextColor={colors.slate400}
          style={[styles.input, styles.textarea]}
          multiline
        />

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rp {subtotal.toLocaleString("id-ID")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
            <Text style={styles.summaryValue}>Rp {fee.toLocaleString("id-ID")}</Text>
          </View>
          <Text style={styles.summaryNote}>Diskon member (jika ada) dihitung otomatis oleh sistem.</Text>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.summaryTotalLabel}>Estimasi Total</Text>
            <Text style={styles.summaryTotalValue}>Rp {estimatedTotal.toLocaleString("id-ID")}</Text>
          </View>
        </View>

        <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
          <Text style={styles.submitText}>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Order"}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={customerPickerOpen} transparent animationType="slide" onRequestClose={() => setCustomerPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pilih Customer</Text>
            <TextInput
              value={customerSearch}
              onChangeText={setCustomerSearch}
              placeholder="Cari nama / nomor telepon..."
              placeholderTextColor={colors.slate400}
              style={styles.searchInput}
            />
            <ScrollView style={{ maxHeight: 360 }}>
              {filteredCustomers.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.customerRow}
                  onPress={() => { setSelectedCustomer(c); setCustomerPickerOpen(false); }}
                >
                  <View>
                    <Text style={styles.customerName}>{c.name}</Text>
                    <Text style={styles.customerMeta}>{c.customerCode} • {c.phone}</Text>
                  </View>
                  {c.membershipType === "MEMBER" ? (
                    <View style={styles.memberBadge}><Text style={styles.memberBadgeText}>MEMBER</Text></View>
                  ) : null}
                </Pressable>
              ))}
              {filteredCustomers.length === 0 ? <Text style={styles.emptyCartText}>Customer tidak ditemukan.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={servicePickerOpen} transparent animationType="slide" onRequestClose={() => setServicePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pilih Layanan</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {services.map((s) => (
                <Pressable key={s.id} style={styles.customerRow} onPress={() => addService(s)}>
                  <View>
                    <Text style={styles.customerName}>{s.name}</Text>
                    <Text style={styles.customerMeta}>Rp {Number(s.price).toLocaleString("id-ID")} / {s.unit}</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color={colors.brand} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  title: { color: colors.navy, fontSize: 18, fontWeight: "900" },
  label: { color: colors.slate700, fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 15, padding: 15 },
  pickerValue: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  pickerSub: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  pickerPlaceholder: { color: colors.slate400, fontSize: 13 },
  addServiceBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  addServiceText: { color: colors.brandDark, fontSize: 11, fontWeight: "800" },
  emptyCart: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderStyle: "dashed", borderRadius: 15, padding: 20, alignItems: "center", marginTop: 4 },
  emptyCartText: { color: colors.slate400, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 12 },
  cartLine: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 15, padding: 12, marginTop: 8 },
  cartName: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  cartPrice: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.slate50, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  qtyValue: { color: colors.navy, fontWeight: "800", fontSize: 12, minWidth: 16, textAlign: "center" },
  input: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 14, paddingHorizontal: 15, height: 50, color: colors.navy, backgroundColor: colors.white },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  summary: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate200, padding: 16, marginTop: 22 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: colors.slate500, fontSize: 12, fontWeight: "700" },
  summaryValue: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  summaryNote: { color: colors.slate400, fontSize: 10, marginTop: 8 },
  summaryTotalLabel: { color: colors.navy, fontSize: 14, fontWeight: "900" },
  summaryTotalValue: { color: colors.brand, fontSize: 18, fontWeight: "900" },
  submitBtn: { height: 54, borderRadius: 16, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 22 },
  submitText: { color: colors.white, fontWeight: "800", fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: "80%" },
  modalTitle: { color: colors.navy, fontSize: 20, fontWeight: "900", marginBottom: 14 },
  searchInput: { height: 46, borderWidth: 1, borderColor: colors.slate200, borderRadius: 13, paddingHorizontal: 14, color: colors.navy, marginBottom: 12, backgroundColor: colors.slate50 },
  customerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  customerName: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  customerMeta: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  memberBadge: { backgroundColor: colors.successSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  memberBadgeText: { color: colors.success, fontSize: 9, fontWeight: "800" },
});
