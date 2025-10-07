import { supabase } from "@/utils/supabase";

// ========================
// 🔹 OBTENER MENSAJES
// ========================
export async function getMessages(chatId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener mensajes:", error);
    return [];
  }

  return data || [];
}

// ========================
// 🔹 ENVIAR MENSAJE DE TEXTO
// ========================
export async function sendMessage(chatId: string, userId: string, content: string) {
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    user_id: userId,
    content,
    type: "text",
  });

  if (error) console.error("❌ Error al enviar mensaje:", error);
}

// ========================
// 🔹 SUBIR IMAGEN AL BUCKET PÚBLICO
// ========================
// ========================
// 🔹 SUBIR IMAGEN DEL CHAT (reutiliza la lógica del perfil)
// ========================
export async function uploadChatImage(chatId: string, userId: string, base64: string) {
  try {
    // 1️⃣ Crear nombre de archivo único
    const fileName = `${chatId}/${userId}-${Date.now()}.jpg`;

    // 2️⃣ Convertir base64 → bytes (igual que en perfil)
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // 3️⃣ Subir al bucket chat-media
    const { error: uploadError } = await supabase.storage
      .from("chat-media")
      .upload(fileName, bytes, {
        contentType: "image/jpeg",
        upsert: false, // 🔸 diferente al perfil (no queremos sobrescribir)
      });

    if (uploadError) throw uploadError;

    // 4️⃣ Obtener URL pública
    const { data } = supabase.storage.from("chat-media").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    return publicUrl;
  } catch (err) {
    console.error("❌ Error subiendo imagen del chat:", err);
    throw err;
  }
}

// ========================
// 🔹 ENVIAR MENSAJE DE IMAGEN
// ========================
// ========================
// 🔹 ENVIAR MENSAJE DE IMAGEN (fix completo)
// ========================
export async function sendImageMessage(chatId: string, userId: string, mediaUrl: string) {
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    user_id: userId,
    type: "image",
    media_url: mediaUrl,
    content: "", // ✅ evita fallo de constraint NOT NULL
  });

  if (error) {
    console.error("❌ Error al enviar mensaje de imagen:", error.message);
    throw error;
  }
}

// ========================
// 🔹 CREAR O OBTENER CHAT EXISTENTE
// ========================
export async function createOrGetChat(user1Id: string, user2Id: string) {
  try {
    // 1️⃣ Buscar si ya existe un chat entre ambos usuarios (sin importar orden)
    const { data: existingChat, error: searchError } = await supabase
      .from("chats")
      .select("*")
      .or(`and(user1.eq.${user1Id},user2.eq.${user2Id}),and(user1.eq.${user2Id},user2.eq.${user1Id})`)
      .maybeSingle();

    if (searchError) throw searchError;

    // 2️⃣ Si existe, devolverlo
    if (existingChat) return existingChat;

    // 3️⃣ Si no existe, crearlo
    const { data, error: insertError } = await supabase
      .from("chats")
      .insert({
        user1: user1Id,
        user2: user2Id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return data;
  } catch (err) {
    console.error("❌ Error en createOrGetChat:", err);
    throw err;
  }
}
