import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../providers/FeedbackProvider";
import { updateUser } from "../services/user.service";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileInfo">;

export default function ProfileInfoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const isAdmin = user?.role === "ADMIN";

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!user) return;
    if (!name.trim()) { showError("Nama tidak boleh kosong"); return; }
    try {
      setSubmitting(true);
      const updated = await updateUser(user.id, { name: name.trim(), phone: phone.trim() || undefined });
      setUser({ ...user, name: updated.name, phone: updated.phone });
      showSuccess("Profil diperbarui", "Perubahan berhasil disimpan.");
    } catch (e) {
      showError("Gagal menyimpan profil", (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Profile Information</Text>
        <View style={{ width: 36 }} />
      </View>

      {!isAdmin ? (
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.brand} />
          <Text style={styles.noticeText}>
            Hanya akun Admin yang dapat mengubah data profil dari aplikasi ini. Hubungi Admin untuk memperbarui data Anda.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Nama Lengkap</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        editable={isAdmin}
        style={[styles.input, !isAdmin && styles.inputDisabled]}
        placeholder="Nama lengkap"
        placeholderTextColor={colors.slate400}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput value={user?.email ?? ""} editable={false} style={[styles.input, styles.inputDisabled]} />

      <Text style={styles.label}>Nomor Telepon</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        editable={isAdmin}
        keyboardType="phone-pad"
        style={[styles.input, !isAdmin && styles.inputDisabled]}
        placeholder="08xxxxxxxxxx"
        placeholderTextColor={colors.slate400}
      />

      <Text style={styles.label}>Role</Text>
      <View style={[styles.input, styles.inputDisabled, { justifyContent: "center" }]}>
        <Text style={{ color: colors.navy, fontWeight: "700" }}>{user?.role}</Text>
      </View>

      {isAdmin ? (
        <Pressable disabled={submitting} onPress={() => void save()} style={[styles.saveBtn, submitting && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{submitting ? "Menyimpan..." : "Simpan Perubahan"}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  title: { color: colors.navy, fontSize: 17, fontWeight: "900" },
  notice: { flexDirection: "row", gap: 10, backgroundColor: colors.brandSoft, borderRadius: 15, padding: 14, marginBottom: 18, alignItems: "flex-start" },
  noticeText: { flex: 1, color: colors.brandDark, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  label: { color: colors.slate700, fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 14 },
  input: { height: 50, borderWidth: 1, borderColor: colors.slate200, borderRadius: 14, paddingHorizontal: 15, color: colors.navy, backgroundColor: colors.white },
  inputDisabled: { backgroundColor: colors.slate100, color: colors.slate500 },
  saveBtn: { height: 52, borderRadius: 15, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 26 },
  saveText: { color: colors.white, fontWeight: "800" },
});
