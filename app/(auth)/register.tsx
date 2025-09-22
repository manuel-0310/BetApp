import { AuthContext } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { useContext, useMemo, useState } from "react";
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

export default function Register() {
  const router = useRouter();
  const { register } = useContext(AuthContext);

  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Género
  const [gender, setGender] = useState("");
  const genderOptions = [
    { label: "Masculino", value: "Masculino" },
    { label: "Femenino", value: "Femenino" },
    { label: "Otro", value: "Otro" },
    { label: "Prefiero no decirlo", value: "No decir" },
  ];

  // Fecha de nacimiento
  const [birthDateISO, setBirthDateISO] = useState("");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const birthDateLabel = useMemo(() => {
    if (!birthDateISO) return "";
    const [yyyy, mm, dd] = birthDateISO.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }, [birthDateISO]);

  // Passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onConfirmDate = (date: Date) => {
    const iso = date.toISOString().split("T")[0];
    setBirthDateISO(iso);
    setDatePickerVisible(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !nombre || !documento || !phone || !gender || !birthDateISO) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      await register(email, password, nombre, documento, phone, gender, birthDateISO);
      Alert.alert("✅ Cuenta creada", "Revisa tu correo para confirmar");
      router.push("/login");
    } catch (error: any) {
      Alert.alert("❌ Error", error?.message || "No se pudo crear la cuenta");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/fondo_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Image source={require("../../assets/images/black_icon.png")} style={styles.logo} />
            <Text style={styles.title}>Lucka</Text>

            <View style={styles.card}>
              <Text style={styles.subtitle}>Crear Cuenta</Text>

              {/* Nombre */}
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor="#aaa"
                style={styles.textinput}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
              />

              {/* Documento */}
              <Text style={styles.label}>Documento</Text>
              <TextInput
                placeholder="Número de documento"
                placeholderTextColor="#aaa"
                style={styles.textinput}
                keyboardType="number-pad"
                value={documento}
                onChangeText={setDocumento}
              />

              {/* Teléfono */}
              <Text style={styles.label}>Número de teléfono</Text>
              <TextInput
                placeholder="+57 300 000 0000"
                placeholderTextColor="#aaa"
                style={styles.textinput}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {/* Género */}
              <Text style={styles.label}>Género</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={genderOptions}
                labelField="label"
                valueField="value"
                placeholder="Selecciona tu género"
                value={gender}
                onChange={(item) => setGender(item.value)}
              />

              {/* Fecha nacimiento */}
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setDatePickerVisible(true)}>
                <Text style={[styles.selectText, !birthDateISO && styles.placeholderText]}>
                  {birthDateLabel || "Selecciona tu fecha"}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#666" />
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onConfirm={onConfirmDate}
                onCancel={() => setDatePickerVisible(false)}
              />

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

              {/* Password */}
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="********"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#aaa"
                  style={[styles.textinput, styles.flexInput]}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconContainer}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#aaaaaaff" />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="********"
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#aaa"
                  style={[styles.textinput, styles.flexInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.iconContainer}
                >
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#aaaaaaff" />
                </TouchableOpacity>
              </View>

              {/* Botón */}
              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.registerText}>
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" style={styles.registerLink}>
                Inicia Sesión
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
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { marginTop: 120, width: 150, height: 150, tintColor: "#fff" },
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
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
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
  label: { fontSize: 14, color: "#444", marginBottom: 6, marginTop: 10 },
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

  // Dropdown Género
  dropdown: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#aaa",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#111",
  },

  // Fecha
  selectInput: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 16, color: "#111" },
  placeholderText: { color: "#aaa" },

  button: {
    backgroundColor: "#7B2FF7",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  registerText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 80,
  },
  registerLink: { color: "#7B2FF7", fontWeight: "bold" },
});
