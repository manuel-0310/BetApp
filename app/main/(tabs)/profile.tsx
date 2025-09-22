import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [twoFA, setTwoFA] = useState(false);
  const [notif, setNotif] = useState(true);
  const [profile, setProfile] = useState<{
    name?: string;
    email?: string;
    documento?: string;
    avatar_url?: string;
  } | null>(null);

  const [editModal, setEditModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, documento, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error cargando perfil:", error.message);
      } else {
        setProfile(data);
        setNewName(data?.name ?? "");
        setNewDoc(data?.documento ?? "");
        setAvatarUrl(data?.avatar_url ?? null);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: newName, documento: newDoc })
        .eq("id", user.id);

      if (error) throw error;

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      setEditModal(false);
      setProfile({ ...profile, name: newName, documento: newDoc });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleChangeEmail = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      Alert.alert("Revisa tu correo", "Debes confirmar el nuevo email.");
      setEmailModal(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        Alert.alert("Error", "Debes llenar ambos campos");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Las contraseñas no coinciden");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert("Éxito", "Contraseña actualizada");
      setPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleChangeProfilePic = async () => {
  if (!user) return;

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permiso requerido", "Necesitas permitir acceso a la cámara");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true, // 👈 importante
  });

  if (result.canceled) return;

  const fileName = `avatars/${user.id}-${Date.now()}.jpg`;


  try {
    // tomar base64 directo desde ImagePicker
    const base64 = result.assets[0].base64;

    if (!base64) throw new Error("No se pudo obtener la imagen en base64");

    // convertir base64 a Uint8Array
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // subir a Supabase
    const { error: uploadError } = await supabase.storage
      .from("profile_pic")
      .upload(fileName, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // obtener URL pública
    const { data } = supabase.storage.from("profile_pic").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // guardar en tabla profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) throw updateError;

    setAvatarUrl(publicUrl);
    Alert.alert("Éxito", "Foto de perfil actualizada");
  } catch (err: any) {
    Alert.alert("Error", err.message);
  }
};

  return (
    <ImageBackground
      source={require("../../../assets/images/fondo_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : require("../../../assets/images/profile_icon.png")
              }
              style={styles.avatar}
            />
            <Text style={styles.name}>{profile?.name ?? "Nombre no disponible"}</Text>
            <Text style={styles.email}>{profile?.email ?? "Correo no disponible"}</Text>

            {/* Dinero */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionTitle}>Mi dinero</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Ionicons name="refresh" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.balance}>$1,250.00</Text>
              <Text style={styles.subnote}>Disponible</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="arrow-down-circle" size={22} />
                  <Text style={styles.actionTxt}>Depositar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="arrow-up-circle" size={22} />
                  <Text style={styles.actionTxt}>Retirar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="sync-circle" size={22} />
                  <Text style={styles.actionTxt}>Historial</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cuenta */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cuenta</Text>

              <TouchableOpacity style={styles.rowPress} onPress={() => setEditModal(true)}>
                <View style={styles.rowLeft}>
                  <Ionicons name="person-circle" size={20} color="#666" />
                  <Text style={styles.rowText}>Editar perfil</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.rowPress} onPress={handleChangeProfilePic}>
                <View style={styles.rowLeft}>
                  <Ionicons name="camera" size={20} color="#666" />
                  <Text style={styles.rowText}>Editar foto de perfil</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.rowPress} onPress={() => setEmailModal(true)}>
                <View style={styles.rowLeft}>
                  <Ionicons name="mail" size={20} color="#666" />
                  <Text style={styles.rowText}>Cambiar correo</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.rowPress} onPress={() => setPasswordModal(true)}>
                <View style={styles.rowLeft}>
                  <Ionicons name="lock-closed" size={20} color="#666" />
                  <Text style={styles.rowText}>Cambiar contraseña</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.rowPress}>
                <View style={styles.rowLeft}>
                  <Ionicons name="card" size={20} color="#666" />
                  <Text style={styles.rowText}>Métodos de pago</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Preferencias */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Preferencias</Text>
              <View style={styles.rowPress}>
                <View style={styles.rowLeft}>
                  <Ionicons name="notifications" size={20} color="#666" />
                  <Text style={styles.rowText}>Notificaciones</Text>
                </View>
                <Switch value={notif} onValueChange={setNotif} />
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.rowPress}>
                <View style={styles.rowLeft}>
                  <Ionicons name="language" size={20} color="#666" />
                  <Text style={styles.rowText}>Idioma</Text>
                </View>
                <View style={styles.valueRight}>
                  <Text style={styles.muted}>Español</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Soporte */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Soporte</Text>
              <TouchableOpacity style={styles.rowPress}>
                <View style={styles.rowLeft}>
                  <Ionicons name="help-circle" size={20} color="#666" />
                  <Text style={styles.rowText}>Centro de ayuda</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.rowPress}>
                <View style={styles.rowLeft}>
                  <Ionicons name="chatbubbles" size={20} color="#666" />
                  <Text style={styles.rowText}>Contactar soporte</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => router.push("/")}
            >
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.logoutBtnTxt}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Editar Perfil */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "700", marginBottom: 10 }}>Editar Perfil</Text>
            <TextInput
              placeholder="Nombre"
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
            />
            <TextInput
              placeholder="Documento"
              value={newDoc}
              onChangeText={setNewDoc}
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
              <Text style={{ color: "#fff" }}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={{ marginTop: 10, color: "red" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Cambiar Correo */}
      <Modal visible={emailModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "700", marginBottom: 10 }}>Cambiar Correo</Text>
            <TextInput
              placeholder="Nuevo correo"
              value={newEmail}
              onChangeText={setNewEmail}
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleChangeEmail}>
              <Text style={{ color: "#fff" }}>Cambiar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEmailModal(false)}>
              <Text style={{ marginTop: 10, color: "red" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal visible={passwordModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "700", marginBottom: 10 }}>Cambiar Contraseña</Text>

            {/* Nueva contraseña */}
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                placeholder="********"
                secureTextEntry={!showPassword}
                placeholderTextColor="#aaa"
                style={[styles.input, styles.flexInput]}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconContainer}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar contraseña */}
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                placeholder="********"
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#aaa"
                style={[styles.input, styles.flexInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.iconContainer}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
              <Text style={{ color: "#fff" }}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPasswordModal(false)}>
              <Text style={{ marginTop: 10, color: "red" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    alignItems: "center",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 70,
    marginBottom: 10,
    marginTop: 35,
    backgroundColor: "#FFF",
  },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  email: { fontSize: 17, color: "#f0f0f0", marginBottom: 12 },
  card: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 8 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balance: { fontSize: 26, fontWeight: "800", color: "#6A5ACD" },
  subnote: { color: "#6b7280", marginBottom: 10 },
  actionsRow: { marginTop: 6, flexDirection: "row", justifyContent: "space-between" },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: "#fafafa",
  },
  actionTxt: { marginTop: 6, fontSize: 12, color: "#333" },
  rowPress: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 15, color: "#333" },
  valueRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  muted: { color: "#6b7280", fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#e6e6e6" },
  logoutBtn: {
    width: "100%",
    backgroundColor: "#E63946",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
  },
  logoutBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { backgroundColor: "#4b0082", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  label: { fontSize: 14, color: "#444", marginBottom: 5, marginTop: 10 },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 10,
  },
  flexInput: { flex: 1, marginBottom: 0 },
  iconContainer: { paddingHorizontal: 10 },
});
 