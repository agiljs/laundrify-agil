import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import LoginScreen from "../screens/LoginScreen";
import MainTabs from "./MainTabs";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import OrderFormScreen from "../screens/OrderFormScreen";
import ProfileInfoScreen from "../screens/ProfileInfoScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SecurityScreen from "../screens/SecurityScreen";
import LockScreen from "../screens/LockScreen";
import { me } from "../services/auth.service";
import { isPinEnabled } from "../services/appLock.service";
import * as SecureStore from "expo-secure-store";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { setUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const token = await SecureStore.getItemAsync("laundrify_token");
        if (token) {
          const user = await me();
          setUser(user);
          setAuthenticated(true);
          setLocked(await isPinEnabled());
        }
      } catch {
        await SecureStore.deleteItemAsync("laundrify_token");
      } finally {
        setReady(true);
      }
    }
    void restore();
  }, [setUser]);

  const handleForgotPin = useCallback(() => {
    setUser(null);
    setAuthenticated(false);
    setLocked(false);
  }, [setUser]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.slate50 }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (authenticated && locked) {
    return <LockScreen onUnlock={() => setLocked(false)} onForgot={handleForgotPin} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={authenticated ? "Main" : "Login"} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="OrderForm" component={OrderFormScreen} options={{ presentation: "modal" }} />
        <Stack.Screen name="ProfileInfo" component={ProfileInfoScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
