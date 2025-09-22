import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";

export default function LayoutAuth() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="reset" />
        <Stack.Screen name="app\main\(tabs)\index.tsx" /> {/* asegúrate de tener esta */}
      </Stack>
    </AuthProvider>
  );
}
