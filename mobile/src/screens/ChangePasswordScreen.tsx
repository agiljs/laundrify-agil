import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../providers/FeedbackProvider";
import { changeUserPassword } from "../services/user.service";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const isAdmin = user?.role === "ADMIN";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) return;
    if (password.length < 8) { showError("Password terlalu pendek", "Minimal 8 karakter."); return; }
    if (password !== confirmPassword) { showError("Konfirmasi tidak cocok", "Password baru dan konfirmasi harus sama."); return; }
    try {
      setSubmitting(true);
      await changeUserPassword(user.id, password);
      showSuccess("Password diperbarui", "Gunakan password baru Anda saat login berikutnya.");
      setPassword("");
      setConfirmPassword("");
      navigation.goBack();
    } catch (e) {
      showError("Gagal mengganti password", (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 36 }} />
      </View>

      {!isAdmin ? (
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.brand} />
          <Text style={styles.noticeText}>
            Penggantian password saat ini hanya dapat dilakukan oleh akun Admin. Hubungi Admin Anda untuk mereset password.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Password Baru</Text>
          <View style={styles.passwordBox}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Minimal 8 karakter"
              placeholderTextColor={colors.slate400}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.slate500} />
            </Pressable>
          </View>

          <Text style={styles.label}>Konfirmasi Password Baru</Text>
          <View style={styles.passwordBox}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              placeholder="Ulangi password baru"
              placeholderTextColor={colors.slate400}
              style={styles.passwordInput}
            />
          </View>

          <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.saveBtn, submitting && { opacity: 0.6 }]}>
            <Text style={styles.saveText}>{submitting ? "Menyimpan..." : "Simpan Password Baru"}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  title: { color: colors.navy, fontSize: 17, fontWeight: "900" },
  notice: { flexDirection: "row", gap: 10, backgroundColor: colors.brandSoft, borderRadius: 15, padding: 14, alignItems: "flex-start" },
  noticeText: { flex: 1, color: colors.brandDark, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  label: { color: colors.slate700, fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 14 },
  passwordBox: { height: 50, borderWidth: 1, borderColor: colors.slate200, borderRadius: 14, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", backgroundColor: colors.white },
  passwordInput: { flex: 1, color: colors.navy },
  saveBtn: { height: 52, borderRadius: 15, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 26 },
  saveText: { color: colors.white, fontWeight: "800" },
});
