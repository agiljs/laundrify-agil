import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { FeedbackProvider } from "./src/providers/FeedbackProvider";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <FeedbackProvider>
          <RootNavigator />
        </FeedbackProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
