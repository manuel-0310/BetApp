import { useAuth } from "@/contexts/AuthContext";
import { getMessages, sendImageMessage, sendMessage, uploadChatImage } from "@/utils/chatService";
import { supabase } from "@/utils/supabase";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatRoom() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // ========================
  // 🔹 CARGAR MENSAJES Y ESCUCHAR EN TIEMPO REAL
  // ========================
  useEffect(() => {
    if (!chatId) return;

    getMessages(chatId).then(setMessages);

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // ========================
  // 🔹 ENVIAR TEXTO
  // ========================
  const handleSend = async () => {
    if (!newMsg.trim() || !user) return;
    const msg = newMsg.trim();
    setNewMsg("");

    const temp = {
      id: Date.now().toString(),
      chat_id: chatId,
      user_id: user.id,
      type: "text",
      content: msg,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);
    await sendMessage(chatId, user.id, msg);
  };

  // ========================
  // 🔹 ENVIAR IMAGEN
  // ========================
  const pickImageAndSend = async () => {
  if (!user || !chatId) return;

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Permiso denegado para acceder a la galería");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    base64: true, // 👈 importante
  });

  if (result.canceled) return;
  const base64 = result.assets?.[0]?.base64;
  const uri = result.assets?.[0]?.uri;
  if (!base64 || !uri) return;

  try {
    setUploading(true);

    // Mostrar temporalmente la imagen local
    const temp = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      user_id: user.id,
      type: "image",
      media_url: uri,
      created_at: new Date().toISOString(),
      __local: true,
    };
    setMessages((prev) => [...prev, temp]);

    // Subir a bucket y obtener URL pública
    const publicUrl = await uploadChatImage(chatId, user.id, base64);

    // Guardar mensaje en la base de datos
    await sendImageMessage(chatId, user.id, publicUrl);

    // Quitar el mensaje temporal
    setMessages((prev) => prev.filter((m) => !m.__local));
  } catch (err) {
    console.error("❌ Error enviando imagen:", err);
    alert("No se pudo enviar la imagen");
  } finally {
    setUploading(false);
  }
};

  // ========================
  // 🔹 RENDER DE MENSAJES
  // ========================
  const renderItem = ({ item }: any) => {
    const isMine = item.user_id === user?.id;
    const isImage = item.type === "image";
    return (
      <View
        style={[
          styles.messageContainer,
          { justifyContent: isMine ? "flex-end" : "flex-start" },
        ]}
      >
        {!isMine && (
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? "#DCF8C6" : "#FFFFFF",
              borderBottomRightRadius: isMine ? 0 : 16,
              borderBottomLeftRadius: isMine ? 16 : 0,
            },
          ]}
        >
          {isImage ? (
            <Image source={{ uri: item.media_url }} style={styles.image} />
          ) : (
            <Text style={styles.messageText}>{item.content}</Text>
          )}
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  // ========================
  // 🔹 UI PRINCIPAL
  // ========================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.chatBody}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImageAndSend} style={styles.attachBtn} disabled={uploading}>
          <Text style={styles.attachText}>📎</Text>
        </TouchableOpacity>

        <TextInput
          value={newMsg}
          onChangeText={setNewMsg}
          placeholder="Escribe un mensaje..."
          style={styles.input}
        />

        <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ========================
// 🔹 ESTILOS
// ========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5DDD5" },
  chatBody: { padding: 10, paddingBottom: 20 },
  messageContainer: { flexDirection: "row", marginVertical: 5, alignItems: "flex-end" },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  messageText: { fontSize: 15, color: "#222" },
  image: { width: 180, height: 180, borderRadius: 10, backgroundColor: "#eee" },
  timeText: { fontSize: 11, color: "#555", textAlign: "right", marginTop: 3 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    backgroundColor: "#f2f2f2",
  },
  attachText: { fontSize: 18 },
  input: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#128C7E",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonText: { color: "#fff", fontSize: 18 },
});
