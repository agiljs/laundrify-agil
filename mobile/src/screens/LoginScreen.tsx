import { useRef, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../navigation/types";
import { login } from "../services/auth.service";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import logoIcon from "../assets/images/logo.jpg";

const HERO =
  "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=1600&auto=format&fit=crop";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("admin@laundrify.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef<TextInput>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const user = await login(email.trim(), password);
      setUser(user);
      navigation.replace("Main");
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } }; message?: string })
          .response?.data?.message ??
          (e as Error).message ??
          "Login gagal.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <ImageBackground
            source={{ uri: HERO }}
            style={StyleSheet.absoluteFillObject}
            imageStyle={styles.heroImage}
          >
            <View style={styles.overlay} />
            <View style={styles.heroContent}>
              <View style={styles.logo}>
                {/* <Text style={styles.logoText}>L</Text> */}
                <Image source={logoIcon} style={styles.imageStyle} />
              </View>
              <Text style={styles.brand}>LAUNDRIFY</Text>
              <Text style={styles.heroTitle}>
                Laundry operations,{"\n"}
                <Text style={styles.accent}>simplified.</Text>
              </Text>
              <Text style={styles.heroText}>
                Kelola order, customer, membership, dan pembayaran dari satu
                aplikasi operasional.
              </Text>
              <View style={styles.pills}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>ADMIN</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>STAFF</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.formArea}>
          <View style={styles.form}>
            <Text style={styles.eyebrow}>LAUNDRIFY STAFF</Text>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>
              Masuk untuk melanjutkan operasional laundry.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="admin@laundrify.com"
              placeholderTextColor={colors.slate400}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
            </View>
            <View style={styles.passwordBox}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.slate400}
                style={styles.passwordInput}
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.slate500}
                />
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={loading}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing in..." : "Login"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>

            <Text style={styles.note}>
              Akun Customer digunakan melalui aplikasi mobile Customer terpisah.
              Mobile ini khusus operasional Admin & Staff.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { flexGrow: 1 },
  hero: { flex: 0.78, minHeight: 330 },
  heroImage: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.68)",
  },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 28 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  imageStyle: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  logoText: { color: colors.white, fontWeight: "900", fontSize: 24 },
  brand: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    marginTop: 12,
  },
  accent: { color: "#38BDF8" },
  heroText: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 360,
  },
  pills: { flexDirection: "row", gap: 8, marginTop: 18 },
  pill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  formArea: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    padding: 24,
  },
  form: { flex: 1, justifyContent: "center" },
  eyebrow: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: colors.navy, fontSize: 30, fontWeight: "800", marginTop: 6 },
  subtitle: {
    color: colors.slate500,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 22,
  },
  label: {
    color: colors.slate700,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  labelRow: { marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 50,
    color: colors.navy,
    backgroundColor: colors.slate50,
  },
  passwordBox: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
  },
  passwordInput: { flex: 1, color: colors.navy },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  button: {
    height: 52,
    marginTop: 18,
    borderRadius: 15,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonPressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: "800", fontSize: 14 },
  note: {
    color: colors.slate400,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 16,
  },
});
