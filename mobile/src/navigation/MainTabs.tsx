import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TabParamList } from "./types";
import OrdersScreen from "../screens/OrdersScreen";
import CustomersScreen from "../screens/CustomersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator<TabParamList>();
const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Orders: "receipt-outline",
  Customers: "people-outline",
  Profile: "person-outline",
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomSpace = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      initialRouteName="Orders"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.slate400,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", marginBottom: 2 },
        tabBarItemStyle: { paddingTop: 4 },
        tabBarStyle: {
          height: 66 + bottomSpace,
          paddingTop: 5,
          paddingBottom: bottomSpace,
          borderTopWidth: 1,
          borderTopColor: colors.slate200,
          backgroundColor: colors.white,
          elevation: 10,
          shadowColor: colors.navy,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? (icons[route.name].replace("-outline", "") as keyof typeof Ionicons.glyphMap) : icons[route.name]}
            color={color}
            size={21}
          />
        ),
      })}
    >
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
