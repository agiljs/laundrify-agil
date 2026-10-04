import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../providers/FeedbackProvider";
import { clearPin, isPinEnabled, setPin } from "../services/appLock.service";

type Props = NativeStackScreenProps<RootStackParamList, "Security">;

export default function SecurityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError, confirm } = useFeedback();

  const [enabled, setEnabled] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");

  const load = useCallback(async () => {
    setEnabled(await isPinEnabled());
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function startSetup() {
    setPin1("");
    setPin2("");
    setSettingUp(true);
  }

  async function saveSetup() {
    if (pin1.length < 4) { showError("PIN terlalu pendek", "Gunakan minimal 4 digit."); return; }
    if (pin1 !== pin2) { showError("PIN tidak cocok", "Konfirmasi PIN harus sama dengan PIN baru."); return; }
    await setPin(pin1);
    setEnabled(true);
    setSettingUp(false);
    showSuccess("PIN diaktifkan", "Aplikasi akan meminta PIN setiap kali dibuka.");
  }

  async function disablePin() {
    const ok = await confirm({
      title: "Nonaktifkan kunci PIN?",
      message: "Aplikasi tidak akan meminta PIN lagi saat dibuka.",
      confirmText: "Ya, nonaktifkan",
      danger: true,
    });
    if (!ok) return;
    await clearPin();
    setEnabled(false);
    showSuccess("Kunci PIN dinonaktifkan");
  }

  function toggle(value: boolean) {
    if (value) startSetup();
    else void disablePin();
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Kunci PIN Aplikasi</Text>
            <Text style={styles.cardDesc}>Minta PIN setiap kali aplikasi dibuka.</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggle}
            trackColor={{ true: colors.brand, false: colors.slate200 }}
            thumbColor={colors.white}
          />
        </View>

        {enabled && !settingUp ? (
          <Pressable onPress={startSetup} style={styles.linkBtn}>
            <Text style={styles.linkText}>Ubah PIN</Text>
          </Pressable>
        ) : null}

        {settingUp ? (
          <View style={styles.setupBox}>
            <Text style={styles.label}>PIN Baru (4-6 digit)</Text>
            <TextInput
              value={pin1}
              onChangeText={(v) => setPin1(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              style={styles.input}
              placeholder="••••"
              placeholderTextColor={colors.slate400}
            />
            <Text style={styles.label}>Konfirmasi PIN</Text>
            <TextInput
              value={pin2}
              onChangeText={(v) => setPin2(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              style={styles.input}
              placeholder="••••"
              placeholderTextColor={colors.slate400}
            />
            <View style={styles.setupActions}>
              <Pressable onPress={() => setSettingUp(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Batal</Text>
              </Pressable>
              <Pressable onPress={() => void saveSetup()} style={styles.saveBtn}>
                <Text style={styles.saveText}>Simpan PIN</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <Text style={styles.section}>Akun</Text>
      <Pressable onPress={() => navigation.navigate("ChangePassword")} style={styles.item}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>Ganti Password</Text>
          <Text style={styles.itemDesc}>Perbarui kata sandi akun Anda.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
      </Pressable>

      <View style={styles.item}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>Status Akun</Text>
          <Text style={styles.itemDesc}>{user?.role} • {user?.status ?? "ACTIVE"}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{user?.status ?? "ACTIVE"}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  title: { color: colors.navy, fontSize: 17, fontWeight: "900" },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate200, padding: 16, marginBottom: 22 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  cardDesc: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  linkBtn: { marginTop: 12 },
  linkText: { color: colors.brand, fontSize: 12, fontWeight: "800" },
  setupBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.slate100 },
  label: { color: colors.slate700, fontSize: 11, fontWeight: "800", marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderColor: colors.slate200, borderRadius: 13, paddingHorizontal: 14, color: colors.navy, marginBottom: 12, letterSpacing: 4 },
  setupActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.slate600, fontWeight: "800", fontSize: 12 },
  saveBtn: { flex: 1, height: 46, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  saveText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  section: { color: colors.slate500, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  item: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 15, padding: 16, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  itemTitle: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  itemDesc: { color: colors.slate500, fontSize: 11, marginTop: 3 },
  statusBadge: { backgroundColor: colors.successSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeText: { color: colors.success, fontSize: 10, fontWeight: "800" },
});
