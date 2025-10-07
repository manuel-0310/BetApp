import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function WalletScreen() {
  const { user } = useContext(AuthContext);
  const [points, setPoints] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    fetchPoints();
  }, []);

  // 🔹 Obtener saldo actual
  async function fetchPoints() {
    const { data, error } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("❌ Error al obtener saldo:", error);
      return;
    }

    setPoints(data?.points ?? 0);
  }

  // 🔹 Depositar
  async function handleDeposit() {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0)
      return Alert.alert("Error", "Ingresa un monto válido.");

    const newPoints = points + value;

    const { error } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", user.id);

    if (error) return Alert.alert("Error", error.message);

    setPoints(newPoints);
    setAmount("");

    // 💸 Mostrar animación 3 segundos sobre la pantalla
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);
  }

  // 🔹 Retirar
  async function handleWithdraw() {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0)
      return Alert.alert("Error", "Ingresa un monto válido.");
    if (value > points)
      return Alert.alert("Error", "Saldo insuficiente para retirar.");

    const newPoints = points - value;

    const { error } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", user.id);

    if (error) return Alert.alert("Error", error.message);

    setPoints(newPoints);
    setAmount("");
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 💸 Overlay de animación */}
      {showAnimation && (
        <View style={styles.overlay}>
          <LottieView
            source={require("../../../assets/animation/money.json")}
            autoPlay
            loop={false}
            style={styles.overlayAnimation}
          />
        </View>
      )}

      <ScrollView
        style={styles.background}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* CARD PRINCIPAL */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Billetera</Text>
              <Ionicons name="wallet-outline" size={22} color="#6A5ACD" />
            </View>

            <Text style={styles.subnote}>Saldo disponible</Text>
            <Text style={styles.balance}>${points.toFixed(2)}</Text>
          </View>

          {/* CARD PARA OPERACIONES */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Operaciones</Text>
            <Text style={styles.subnote}>Ingresa el monto que deseas mover</Text>

            <View style={styles.inputWithIcon}>
              <View style={styles.iconContainer}>
                <Ionicons name="cash-outline" size={20} color="#6b7280" />
              </View>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Monto (COP)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
                onPress={handleDeposit}
              >
                <Ionicons name="add-circle-outline" size={22} color="#fff" />
                <Text style={[styles.actionTxt, { color: "#fff" }]}>
                  Depositar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#E63946" }]}
                onPress={handleWithdraw}
              >
                <Ionicons name="remove-circle-outline" size={22} color="#fff" />
                <Text style={[styles.actionTxt, { color: "#fff" }]}>
                  Retirar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  overlayAnimation: {
    width: 200,
    height: 200,
  },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  subnote: { color: "#6b7280", marginBottom: 6 },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balance: {
    fontSize: 26,
    fontWeight: "800",
    color: "#6A5ACD",
    marginBottom: 4,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 10,
  },
  input: {
    borderWidth: 0,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  flexInput: { flex: 1, marginBottom: 0 },
  iconContainer: { paddingHorizontal: 10 },
  actionsRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  actionTxt: { marginTop: 0, fontSize: 14, fontWeight: "700" },
});
