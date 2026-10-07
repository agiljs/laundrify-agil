import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../providers/FeedbackProvider";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from "../services/notification.service";
import { useRealtime } from "../hooks/useRealtime";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  SUCCESS: "checkmark-circle",
  WARNING: "alert-circle",
  ERROR: "close-circle",
  INFO: "information-circle",
};

const NOTIFICATION_EVENTS = ["notification:new"] as const;

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError } = useFeedback();
  const isAdmin = user?.role === "ADMIN";

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    try {
      setItems(await getMyNotifications());
    } catch {
      showError("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showError]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useRealtime(NOTIFICATION_EVENTS, () => void load());

  async function readOne(item: NotificationItem) {
    if (item.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(item.id);
    } catch {
      await load();
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      showError("Gagal menandai semua sebagai dibaca");
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        {isAdmin && unreadCount > 0 ? (
          <Pressable onPress={() => void readAll()}><Text style={styles.markAll}>Tandai semua</Text></Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {!isAdmin ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={30} color={colors.slate400} />
          <Text style={styles.emptyText}>Notifikasi saat ini hanya tersedia untuk akun Admin.</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={30} color={colors.slate400} />
          <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
        </View>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => void readOne(item)} style={[styles.card, !item.isRead && styles.cardUnread]}>
            <Ionicons name={typeIcon[item.type] ?? "notifications-outline"} size={20} color={item.isRead ? colors.slate400 : colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString("id-ID")}</Text>
            </View>
            {!item.isRead ? <View style={styles.dot} /> : null}
          </Pressable>
        ))
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
  markAll: { color: colors.brand, fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyText: { color: colors.slate400, fontSize: 12, fontWeight: "600", textAlign: "center", paddingHorizontal: 30 },
  card: { flexDirection: "row", gap: 12, backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.slate200, padding: 14, marginBottom: 8, alignItems: "flex-start" },
  cardUnread: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  cardTitle: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  cardMessage: { color: colors.slate600, fontSize: 12, marginTop: 3, lineHeight: 17 },
  cardDate: { color: colors.slate400, fontSize: 10, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 4 },
});
