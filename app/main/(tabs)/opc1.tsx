import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useContext, useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function BetsScreen() {
  const { user } = useContext(AuthContext);
  const [role, setRole] = useState("");
  const [points, setPoints] = useState(0);
  const [bets, setBets] = useState<any[]>([]);
  const [userBets, setUserBets] = useState<any[]>([]);

  // Campos para crear apuestas
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [odds1, setOdds1] = useState("");
  const [odds2, setOdds2] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchUser();
    fetchBets();
    fetchUserBets();
  }, []);

  async function fetchUser() {
    const { data } = await supabase
      .from("profiles")
      .select("points, role")
      .eq("id", user.id)
      .single();
    setPoints(data?.points ?? 0);
    setRole(data?.role ?? "");
  }

  async function fetchBets() {
    const { data } = await supabase
      .from("bets")
      .select("*")
      .order("created_at", { ascending: false });
    setBets(data || []);
  }

  async function fetchUserBets() {
    const { data } = await supabase
      .from("user_bets")
      .select("*, bets(team1, team2)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setUserBets(data || []);
  }

  // 🖼️ Imagen (misma lógica que en perfil)
  const handlePickImage = async () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "Tomar foto", "Elegir de galería"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await pickFromCamera();
          else if (buttonIndex === 2) await pickFromGallery();
        }
      );
    } else {
      Alert.alert("Seleccionar imagen", "¿De dónde deseas obtener la imagen?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cámara", onPress: pickFromCamera },
        { text: "Galería", onPress: pickFromGallery },
      ]);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Permite acceso a la cámara");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) await uploadImage(result.assets[0].base64!);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Permite acceso a la galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) await uploadImage(result.assets[0].base64!);
  };

  const uploadImage = async (base64: string) => {
    try {
      const fileName = `bets/${user.id}-${Date.now()}.jpg`;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const { error: uploadError } = await supabase.storage
        .from("bets_img")
        .upload(fileName, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("bets_img").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      setImageUrl(publicUrl);
      Alert.alert("✅ Imagen subida correctamente");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Crear apuesta (ADMIN)
  async function createBet() {
    if (!team1 || !team2 || !odds1 || !odds2 || !description || !imageUrl)
      return Alert.alert("Error", "Completa todos los campos e imagen.");

    const { error } = await supabase.from("bets").insert({
      team1,
      team2,
      odds_team1: parseFloat(odds1),
      odds_team2: parseFloat(odds2),
      description,
      image_url: imageUrl,
    });

    if (error) return Alert.alert("Error", error.message);

    setTeam1("");
    setTeam2("");
    setOdds1("");
    setOdds2("");
    setDescription("");
    setImageUrl(null);
    fetchBets();
    Alert.alert("✅ Apuesta creada con éxito");
  }

  async function placeBet(bet: any, team: string) {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0)
      return Alert.alert("Error", "Ingresa un monto válido.");
    if (value > points)
      return Alert.alert("Fondos insuficientes", "No tienes saldo suficiente.");

    const odds = team === "team1" ? bet.odds_team1 : bet.odds_team2;
    const possibleWin = value * odds;

    const { error } = await supabase.from("user_bets").insert({
      user_id: user.id,
      bet_id: bet.id,
      team: team === "team1" ? bet.team1 : bet.team2,
      amount: value,
      possible_win: possibleWin,
    });
    if (error) return Alert.alert("Error", error.message);

    const newPoints = points - value;
    await supabase.from("profiles").update({ points: newPoints }).eq("id", user.id);
    setPoints(newPoints);
    setAmount("");
    fetchUserBets();

    Alert.alert(
      "Apuesta realizada",
      `Has apostado $${value.toFixed(2)} por ${team === "team1" ? bet.team1 : bet.team2}.`
    );
  }

  async function deleteBet(id: string) {
    const { error } = await supabase.from("bets").delete().eq("id", id);
    if (error) Alert.alert("Error", error.message);
    else fetchBets();
  }

  return (
    <ScrollView
      style={styles.background}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        {/* Saldo */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Saldo disponible</Text>
            <Ionicons name="wallet-outline" size={22} color="#6A5ACD" />
          </View>
          <Text style={styles.balance}>${points.toFixed(2)}</Text>
        </View>

        {/* Crear apuesta */}
        {role === "ADMIN" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Crear nueva apuesta</Text>

            <Text style={styles.label}>Equipo 1</Text>
            <TextInput style={styles.input} value={team1} onChangeText={setTeam1} placeholder="Ejemplo: Colombia" />
            <Text style={styles.label}>Equipo 2</Text>
            <TextInput style={styles.input} value={team2} onChangeText={setTeam2} placeholder="Ejemplo: Venezuela" />

            <Text style={styles.label}>Cuota equipo 1</Text>
            <TextInput style={styles.input} value={odds1} onChangeText={setOdds1} keyboardType="numeric" />
            <Text style={styles.label}>Cuota equipo 2</Text>
            <TextInput style={styles.input} value={odds2} onChangeText={setOdds2} keyboardType="numeric" />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Ejemplo: Partido amistoso de preparación..."
            />

            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={20} color="#fff" />
              <Text style={styles.actionTxt}>Subir imagen</Text>
            </TouchableOpacity>

            {imageUrl && (
              <Image source={{ uri: imageUrl }} style={styles.preview} />
            )}

            <TouchableOpacity style={styles.createBtn} onPress={createBet}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionTxt}>Crear apuesta</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Apuestas disponibles */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          Apuestas disponibles
        </Text>
        {bets.map((bet) => (
          <View key={bet.id} style={styles.card}>
            {bet.image_url && (
              <Image source={{ uri: bet.image_url }} style={styles.betImage} />
            )}
            <Text style={styles.match}>{bet.team1} vs {bet.team2}</Text>
            <Text style={styles.subnote}>{bet.description}</Text>
            <Text>Cuota {bet.team1}: {bet.odds_team1} | Cuota {bet.team2}: {bet.odds_team2}</Text>

            <TextInput
              style={styles.input}
              placeholder="Monto a apostar"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#6A5ACD" }]}
                onPress={() => placeBet(bet, "team1")}
              >
                <Text style={styles.actionTxt}>Apostar {bet.team1}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#9370DB" }]}
                onPress={() => placeBet(bet, "team2")}
              >
                <Text style={styles.actionTxt}>Apostar {bet.team2}</Text>
              </TouchableOpacity>
            </View>

            {role === "ADMIN" && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteBet(bet.id)}>
                <Text style={{ color: "white", fontWeight: "700" }}>Eliminar apuesta</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  container: { flex: 1, width: "100%", alignItems: "center" },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 10 },
  balance: { fontSize: 26, fontWeight: "800", color: "#6A5ACD" },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
  },
  uploadBtn: {
    marginTop: 10,
    backgroundColor: "#6A5ACD",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  createBtn: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  cardHeaderRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

  actionTxt: { color: "#fff", fontWeight: "700" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  preview: { width: "100%", height: 140, borderRadius: 10, marginTop: 8, resizeMode: "cover" },
  betImage: { width: "100%", height: 150, borderRadius: 10, marginBottom: 10 },
  match: { fontSize: 16, fontWeight: "700", color: "#222", marginBottom: 4 },
  subnote: { color: "#6b7280", marginBottom: 8 },
  deleteBtn: {
    backgroundColor: "#E63946",
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
});
