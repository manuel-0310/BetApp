import { useChat } from "@/contexts/ChatContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function ChatHeader() {
  const router = useRouter();
  const { currentChat } = useChat();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={26} color="#000" />
      </TouchableOpacity>

      <Image
        source={{
          uri:
            currentChat?.avatar ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />

      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.nameText}>
          {currentChat?.name || "Contacto"}
        </Text>
        <Text style={styles.statusText}>en línea</Text>
      </View>
    </View>
  );
}


export default function ChatsLayout() {
  return (
    <Stack>
      {/* Lista de chats */}
      <Stack.Screen
        name="index"
        options={{
          title: "Chats",
          headerStyle: { backgroundColor: "#fff" },
          headerTitleStyle: { fontSize: 20, fontWeight: "600" },
          headerShadowVisible: false,
        }}
      />

      {/* Chat individual */}
      <Stack.Screen
        name="[chatId]"
        options={{
          header: () => <ChatHeader />,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
  },
  backButton: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  textContainer: {
    flexDirection: "column",
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  statusText: {
    fontSize: 13,
    color: "#4CAF50",
  },
});
