import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type ToastType = "success" | "error" | "info";
type ToastPayload = { type: ToastType; title: string; message?: string };

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type FeedbackContextValue = {
  showToast: (payload: ToastPayload) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const TOAST_META: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  success: { icon: "checkmark-circle", bg: colors.success, fg: colors.white },
  error: { icon: "close-circle", bg: colors.danger, fg: colors.white },
  info: { icon: "information-circle", bg: colors.navy, fg: colors.white },
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const dismissToast = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const showToast = useCallback((payload: ToastPayload) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast(payload);
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }).start();
    hideTimer.current = setTimeout(dismissToast, 3200);
  }, [anim, dismissToast]);

  const showSuccess = useCallback((title: string, message?: string) => showToast({ type: "success", title, message }), [showToast]);
  const showError = useCallback((title: string, message?: string) => showToast({ type: "error", title, message }), [showToast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve }));
  }, []);

  const value = useMemo(() => ({ showToast, showSuccess, showError, confirm }), [showToast, showSuccess, showError, confirm]);
  const meta = toast ? TOAST_META[toast.type] : null;

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {toast && meta ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.toastWrap,
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
            },
          ]}
        >
          <Pressable onPress={dismissToast} style={[styles.toast, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={22} color={meta.fg} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.toastTitle, { color: meta.fg }]} numberOfLines={1}>{toast.title}</Text>
              {toast.message ? <Text style={[styles.toastMessage, { color: meta.fg }]} numberOfLines={2}>{toast.message}</Text> : null}
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      <Modal visible={!!confirmState} transparent animationType="fade" onRequestClose={() => { confirmState?.resolve(false); setConfirmState(null); }}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={[styles.confirmIcon, { backgroundColor: confirmState?.danger ? colors.dangerSoft : colors.brandSoft }]}>
              <Ionicons name={confirmState?.danger ? "alert-circle" : "help-circle"} size={26} color={confirmState?.danger ? colors.danger : colors.brand} />
            </View>
            <Text style={styles.confirmTitle}>{confirmState?.title}</Text>
            {confirmState?.message ? <Text style={styles.confirmMessage}>{confirmState.message}</Text> : null}
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmCancel}
                onPress={() => { confirmState?.resolve(false); setConfirmState(null); }}
              >
                <Text style={styles.confirmCancelText}>{confirmState?.cancelText ?? "Batal"}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmOk, { backgroundColor: confirmState?.danger ? colors.danger : colors.brand }]}
                onPress={() => { confirmState?.resolve(true); setConfirmState(null); }}
              >
                <Text style={styles.confirmOkText}>{confirmState?.confirmText ?? "Ya, lanjutkan"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback harus dipakai di dalam <FeedbackProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  toastWrap: { position: "absolute", top: 54, left: 16, right: 16, zIndex: 999 },
  toast: { borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  toastTitle: { fontSize: 13, fontWeight: "800" },
  toastMessage: { fontSize: 11, marginTop: 2, opacity: 0.9 },
  confirmBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", alignItems: "center", justifyContent: "center", padding: 28 },
  confirmCard: { backgroundColor: colors.white, borderRadius: 24, padding: 24, width: "100%", alignItems: "center" },
  confirmIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  confirmTitle: { color: colors.navy, fontSize: 17, fontWeight: "900", textAlign: "center" },
  confirmMessage: { color: colors.slate500, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 19 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 22, width: "100%" },
  confirmCancel: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  confirmCancelText: { color: colors.slate600, fontWeight: "800", fontSize: 13 },
  confirmOk: { flex: 1, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  confirmOkText: { color: colors.white, fontWeight: "800", fontSize: 13 },
});
