// app/main/(tabs)/chats/[chatId].tsx
import { useAuth } from "@/contexts/AuthContext";
import {
  getMessages,
  sendImageMessage,
  sendMessage,
  uploadChatImage,
} from "@/utils/chatService";
import { supabase } from "@/utils/supabase";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  const [previewImage, setPreviewImage] = useState<string | null>(null); // preview antes de enviar
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // ver imagen en modal
  const flatListRef = useRef<FlatList>(null);

  // ========================
  // 🔹 Cargar mensajes + Realtime
  // ========================
  useEffect(() => {
    if (!chatId) return;

    getMessages(chatId).then(setMessages);

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // quita cualquier mensaje temporal local
            const noTemp = prev.filter((m) => !m.__local);
            // evita duplicados si ya está
            if (noTemp.some((m) => m.id === payload.new.id)) return noTemp;
            return [...noTemp, payload.new];
          });
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            80
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // ========================
  // 🔹 Enviar texto
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
  // 🔹 Selector de imagen
  // ========================
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permiso denegado para acceder a la galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    setPreviewImage(uri); // 👈 mostramos preview antes de enviar
  };

  // ========================
  // 🔹 Confirmar envío de imagen
  // ========================
  const confirmSendImage = async () => {
    if (!previewImage || !user || !chatId) return;
    setUploading(true);

    try {
      // 1) Mensaje temporal local (optimista)
      const temp = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        user_id: user.id,
        type: "image",
        media_url: previewImage,
        created_at: new Date().toISOString(),
        __local: true,
      };
      setMessages((prev) => [...prev, temp]);

      // 2) Subir a storage y enviar mensaje real
      const base64Data = await getBase64FromUri(previewImage);
      const publicUrl = await uploadChatImage(chatId, user.id, base64Data);
      await sendImageMessage(chatId, user.id, publicUrl);

      // 👇 Ya NO borramos el temporal aquí:
      // el callback de realtime quitará los __local y añadirá el definitivo.
      setPreviewImage(null);
    } catch (err) {
      console.error("❌ Error enviando imagen:", err);
      alert("Error al enviar la imagen");
      // Si falla, limpiamos el temporal
      setMessages((prev) => prev.filter((m) => !m.__local));
    } finally {
      setUploading(false);
    }
  };

  // 🔸 Helper: convertir URI local a base64
  const getBase64FromUri = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ========================
  // 🔹 Render de mensajes
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
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
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
            <TouchableOpacity onPress={() => setSelectedImage(item.media_url)}>
              <Image source={{ uri: item.media_url }} style={styles.image} />
            </TouchableOpacity>
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
  // 🔹 Interfaz principal
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
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* 📎 Barra inferior */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.attachBtn}
          disabled={uploading}
        >
          <Text style={styles.attachText}>📎</Text>
        </TouchableOpacity>

        <TextInput
          value={newMsg}
          onChangeText={setNewMsg}
          placeholder="Escribe un mensaje..."
          style={styles.input}
        />

        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 🔍 Preview de imagen antes de enviar */}
      {previewImage && (
        <Modal visible transparent animationType="fade">
          <Pressable style={styles.modalContainer} onPress={() => setPreviewImage(null)}>
            <Image source={{ uri: previewImage }} style={styles.fullImage} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#E63946" }]}
                onPress={() => setPreviewImage(null)}
              >
                <Text style={styles.modalBtnTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#128C7E" }]}
                onPress={confirmSendImage}
              >
                <Text style={styles.modalBtnTxt}>
                  {uploading ? "Enviando..." : "Enviar"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* 🖼️ Modal imagen completa */}
      {selectedImage && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalContainer}>
            <Image source={{ uri: selectedImage }} style={styles.fullImage} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedImage(null)}
              hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }} // área extra
            >
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

// ========================
// 🔹 Estilos
// ========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5DDD5" },
  chatBody: { padding: 10, paddingBottom: 20 },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 5,
    alignItems: "flex-end",
  },
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

  // 🔸 Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 15,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // ❌ Botón X grande y táctil
  closeBtn: {
    position: "absolute",
    top: 36,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  closeTxt: { color: "#fff", fontWeight: "800", fontSize: 22 },
});
