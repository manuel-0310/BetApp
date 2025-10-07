import React, { createContext, useContext, useState } from "react";

interface ChatInfo {
  id: string;
  name: string;
  avatar: string;
}

interface ChatContextType {
  currentChat: ChatInfo | null;
  setCurrentChat: (chat: ChatInfo | null) => void;
}

const ChatContext = createContext<ChatContextType>({
  currentChat: null,
  setCurrentChat: () => {},
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentChat, setCurrentChat] = useState<ChatInfo | null>(null);
  return (
    <ChatContext.Provider value={{ currentChat, setCurrentChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
