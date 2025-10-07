import { useAuth } from "@/contexts/AuthContext";
import { createOrGetChat } from "@/utils/chatService";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, avatar_url")
        .neq("id", user.id)
        .order("email", { ascending: true });
      if (!error && data) {
        setProfiles(data);
        setFiltered(data);
      } else {
        console.error("❌ Error cargando perfiles:", error);
      }
      setLoading(false);
    };
    loadProfiles();
  }, [user]);

  // 🔍 Filtrar usuarios
  const handleSearch = (text: string) => {
    setSearch(text);
    const filteredList = profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(text.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(text.toLowerCase()))
    );
    setFiltered(filteredList);
  };

  // 💬 Crear o abrir chat
  const startChat = async (otherId: string, otherEmail: string, otherAvatar: string) => {
    if (!user) return;
    try {
      const chat = await createOrGetChat(user.id, otherId);
      
      router.push(
        `/main/chats/${chat.id}?name=${encodeURIComponent(otherEmail)}&avatar=${encodeURIComponent(otherAvatar)}`
      );
    } catch (err) {
      console.error("❌ Error creando chat:", err);
    }
  };

  // 🎨 Render de cada usuario
  const renderUser = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => startChat(item.id, item.email, item.avatar_url)}
      style={styles.userCard}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri:
            item.avatar_url ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name || "Usuario"}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🔍 Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar usuario..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>

      {/* 📋 Lista */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#128C7E" />
          <Text style={{ color: "#555", marginTop: 10 }}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderUser}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay usuarios disponibles</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 15,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
});
