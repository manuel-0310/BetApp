import { AuthContext } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons"; // 👈 íconos
import { Link, useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Login() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    alert("Por favor ingresa tu correo y contraseña.");
    return;
  }

  try {
    const data = await login(email, password);

    if (data?.user) {
      alert("✅ Sesión iniciada con éxito.");
      router.replace("/main");
    }
  } catch (error) {
    alert("❌ Correo o contraseña incorrectos.");
  }
};



  return (
    <ImageBackground
      source={require("../../assets/images/fondo_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Image
              source={require("../../assets/images/black_icon.png")}
              style={{ width: 150, height: 150, tintColor: "#fff" }}
            />
            <Text style={styles.title}>Lucka</Text>

            <View style={styles.card}>
              <Text style={styles.subtitle}>Iniciar Sesión</Text>

              {/* Email */}
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor="#aaa"
                style={styles.textinput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              {/* Password con icono 👁️ */}
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="********"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#aaa"
                  style={[styles.textinput, styles.flexInput]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.iconContainer}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#aaaaaaff"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>

              <Link href="/reset" style={styles.link}>
                ¿Olvidaste tu contraseña?
              </Link>
            </View>

            <Text style={styles.registerText}>
              ¿No tienes una cuenta?{" "}
              <Link href="/register" style={styles.registerLink}>
                Regístrate
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  scrollContent: { flexGrow: 1, padding: 20 },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontSize: 14, color: "#444", marginBottom: 5, marginTop: 10 },
  textinput: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 10,
  },
  flexInput: { flex: 1, marginBottom: 0 },
  iconContainer: { paddingHorizontal: 10 },
  button: {
    backgroundColor: "#7B2FF7",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  link: {
    color: "#6A5ACD",
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
  },
  registerText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  registerLink: { color: "#7B2FF7", fontWeight: "bold" },
});
