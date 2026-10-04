import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { logout } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../providers/FeedbackProvider";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { confirm, showSuccess } = useFeedback();

  const isAdmin = user?.role === "ADMIN";
  const displayName = user?.name ?? "Laundrify Staff";
  const welcome = isAdmin ? `${timeGreeting()}, Admin ${displayName.split(" ")[0]}!` : `${timeGreeting()}, ${displayName.split(" ")[0]}!`;

  async function signOut() {
    const ok = await confirm({ title: "Keluar dari aplikasi?", message: "Anda perlu login kembali untuk mengakses aplikasi.", confirmText: "Logout", danger: true });
    if (!ok) return;
    await logout();
    setUser(null);
    showSuccess("Berhasil logout", "Sampai jumpa lagi!");
    const rootNavigation = navigation.getParent() ?? navigation;
    rootNavigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}>
      <View style={styles.profile}>
        <View style={[styles.roleBadge, { backgroundColor: isAdmin ? "#F59E0B" : colors.brand }]}>
          <Text style={styles.roleBadgeText}>{user?.role ?? "STAFF"}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.welcome}>{welcome} 👋</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email ?? "admin / staff account"}</Text>
      </View>

      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={18} color={colors.brand} />
        <Text style={styles.noticeText}>
          {isAdmin
            ? "Anda login sebagai Admin. Menu yang tersedia mengikuti akses operasional Staff."
            : "Anda memiliki akses penuh ke menu operasional Orders dan Customers."}
        </Text>
      </View>

      <Text style={styles.section}>Account</Text>
      <Item label="Profile information" onPress={() => navigation.navigate("ProfileInfo")} />
      <Item label="Change password" onPress={() => navigation.navigate("ChangePassword")} />
      <Text style={styles.section}>Application</Text>
      <Item label="Notifications" onPress={() => navigation.navigate("Notifications")} />
      <Item label="Security" onPress={() => navigation.navigate("Security")} />

      <Pressable onPress={() => void signOut()} style={styles.logout}>
        <Ionicons name="log-out-outline" size={17} color={colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
      <Text style={styles.version}>Laundrify Mobile • Staff workspace</Text>
    </ScrollView>
  );
}

function Item({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <Text style={styles.itemText}>{label}</Text>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.slate50 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 112 },
  profile: { backgroundColor: colors.navy, borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 16 },
  roleBadge: { position: "absolute", top: 16, right: 16, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  roleBadgeText: { color: colors.white, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  avatar: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: "900" },
  welcome: { color: colors.white, fontSize: 16, fontWeight: "800", marginTop: 14 },
  name: { color: "#E2E8F0", fontSize: 13, fontWeight: "700", marginTop: 4 },
  email: { color: "#94A3B8", fontSize: 11, marginTop: 4 },
  noticeCard: { flexDirection: "row", gap: 10, backgroundColor: colors.brandSoft, borderRadius: 16, padding: 14, marginBottom: 22, alignItems: "flex-start" },
  noticeText: { flex: 1, color: colors.brandDark, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  section: { color: colors.slate500, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  item: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 15, padding: 16, flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  itemPressed: { opacity: 0.6, backgroundColor: colors.slate50 },
  itemText: { color: colors.slate700, fontSize: 13, fontWeight: "700" },
  arrow: { color: colors.slate400, fontSize: 20, lineHeight: 16 },
  logout: { height: 50, borderRadius: 15, backgroundColor: colors.dangerSoft, alignItems: "center", justifyContent: "center", marginTop: 22, flexDirection: "row", gap: 8 },
  logoutText: { color: colors.danger, fontWeight: "900" },
  version: { color: colors.slate400, textAlign: "center", fontSize: 10, marginTop: 18 },
});
