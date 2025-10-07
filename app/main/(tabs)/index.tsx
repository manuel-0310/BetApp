// app/main/(tabs)/index.tsx
import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeTab() {
  const { user } = useContext(AuthContext);
  const [bets, setBets] = useState<any[]>([]);
  const [filteredBets, setFilteredBets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | null>(null);

  // 🧠 Cargar role del usuario
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) console.error("❌ Error al obtener role:", error);
      else setRole(data?.role || null);
    };
    fetchRole();
  }, [user]);

  // 🔹 Cargar apuestas existentes
  useEffect(() => {
    const fetchBets = async () => {
      const { data, error } = await supabase.from("bets").select("*").order("created_at", { ascending: false });
      if (error) console.error("❌ Error al obtener apuestas:", error);
      else {
        setBets(data || []);
        setFilteredBets(data || []);
      }
    };
    fetchBets();
  }, []);

  // 🔍 Buscar apuestas
  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredBets(
      bets.filter(
        (b) =>
          b.team1?.toLowerCase().includes(q) ||
          b.team2?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      )
    );
  }, [search, bets]);

  // ❤️ Like a una apuesta
  const handleLike = async (betId: string) => {
    if (!user) return Alert.alert("Error", "Debes iniciar sesión para dar like.");
    try {
      // Tabla intermedia "likes" con columnas: id, bet_id, user_id
      const { data: existing } = await supabase
        .from("likes")
        .select("*")
        .eq("bet_id", betId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("likes").delete().eq("bet_id", betId).eq("user_id", user.id);
      } else {
        await supabase.from("likes").insert({ bet_id: betId, user_id: user.id });
      }

      // Recontar likes
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("bet_id", betId);

      setFilteredBets((prev) =>
        prev.map((b) => (b.id === betId ? { ...b, likes_count: count || 0 } : b))
      );
    } catch (err: any) {
      console.error("❌ Error al dar like:", err.message);
    }
  };

  // 🧮 Cargar conteo de likes inicial
  useEffect(() => {
    const fetchLikesCount = async () => {
      const updated = await Promise.all(
        bets.map(async (b) => {
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("bet_id", b.id);
          return { ...b, likes_count: count || 0 };
        })
      );
      setFilteredBets(updated);
    };
    if (bets.length) fetchLikesCount();
  }, [bets]);

  return (
    <ImageBackground
      source={require("../../../assets/images/fondo_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 🔍 Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Buscar"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* 🧾 Lista de apuestas */}
        <FlatList
          data={filteredBets}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.betCard}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.betImage} />
              )}
              <Text style={styles.matchTitle}>
                {item.team1} vs {item.team2}
              </Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.odds}>
                Cuota {item.team1}: {item.odds_team1} | Cuota {item.team2}: {item.odds_team2}
              </Text>

              <View style={styles.likeRow}>
                <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.likeBtn}>
                  <Ionicons
                    name="heart"
                    size={20}
                    color={item.likes_count > 0 ? "#E63946" : "#aaa"}
                  />
                  <Text style={styles.likeTxt}>Me gusta</Text>
                </TouchableOpacity>

                {role === "ADMIN" && (
                  <View style={styles.likeCount}>
                    <Ionicons name="people" size={18} color="#444" />
                    <Text style={styles.likeNum}>{item.likes_count || 0}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1, padding: 16, paddingTop: 40 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8, color: "#333" },
  betCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  betImage: { width: "100%", height: 150, borderRadius: 12, marginBottom: 10 },
  matchTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 4 },
  description: { color: "#6b7280", fontStyle: "italic", marginBottom: 8 },
  odds: { color: "#4b0082", fontWeight: "600", marginBottom: 10 },
  likeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  likeTxt: { color: "#333", fontWeight: "600" },
  likeCount: { flexDirection: "row", alignItems: "center", gap: 6 },
  likeNum: { color: "#111", fontWeight: "700" },
});
