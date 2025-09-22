import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const onSubmit = () => {
    if (!email.trim()) {
      Alert.alert("Ups", "Por favor ingresa tu correo electrónico.");
      return;
    }
    Alert.alert(
      "Revisa tu correo",
      "Si el correo es válido, recibirás instrucciones para restablecer tu contraseña."
    );
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
            {/* Logo */}
            <Image
              source={require("../../assets/images/black_icon.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>Lucka</Text>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.subtitle}>Recuperar contraseña</Text>

              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textinput}
                value={email}
                onChangeText={setEmail}
              />

              <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={styles.buttonText}>Enviar enlace</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.registerText}>
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" style={styles.registerLink}>
                Inicia sesión
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    tintColor: "#fff",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
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
  label: {
    fontSize: 14,
    color: "#444",
    marginBottom: 5,
    marginTop: 10,
  },
  textinput: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#7B2FF7",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  registerLink: {
    color: "#7B2FF7",
    fontWeight: "bold",
  },
});
