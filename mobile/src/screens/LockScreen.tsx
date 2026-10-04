import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { clearPin, verifyPin } from "../services/appLock.service";
import { clearToken } from "../services/api";
import { useFeedback } from "../providers/FeedbackProvider";

export default function LockScreen({ onUnlock, onForgot }: { onUnlock: () => void; onForgot: () => void }) {
  const { showError, confirm } = useFeedback();
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit(value: string) {
    setChecking(true);
    const ok = await verifyPin(value);
    setChecking(false);
    if (ok) {
      setPin("");
      onUnlock();
    } else {
      showError("PIN salah", "Silakan coba lagi.");
      setPin("");
    }
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    if (digits.length >= 4) void submit(digits);
  }

  async function forgot() {
    const ok = await confirm({
      title: "Lupa PIN?",
      message: "Anda akan logout dari aplikasi dan perlu login ulang untuk melanjutkan.",
      confirmText: "Ya, logout",
      danger: true,
    });
    if (!ok) return;
    await clearPin();
    await clearToken();
    onForgot();
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Ionicons name="lock-closed" size={26} color={colors.white} />
        </View>
        <Text style={styles.title}>Aplikasi Terkunci</Text>
        <Text style={styles.subtitle}>Masukkan PIN untuk melanjutkan</Text>

        <TextInput
          value={pin}
          onChangeText={onChange}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          autoFocus
          style={styles.input}
          placeholder="••••"
          placeholderTextColor={colors.slate400}
        />
        {checking ? <ActivityIndicator color={colors.brand} style={{ marginTop: 14 }} /> : null}

        <Pressable onPress={() => void forgot()} style={{ marginTop: 26 }}>
          <Text style={styles.forgot}>Lupa PIN? Logout</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  icon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { color: colors.white, fontSize: 20, fontWeight: "900" },
  subtitle: { color: "#94A3B8", fontSize: 13, marginTop: 6, marginBottom: 26 },
  input: { width: 180, height: 56, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", color: colors.white, textAlign: "center", fontSize: 22, letterSpacing: 10, fontWeight: "900" },
  forgot: { color: "#7DD3FC", fontSize: 12, fontWeight: "800" },
});
