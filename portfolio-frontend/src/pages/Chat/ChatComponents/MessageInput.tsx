// portfolio-frontend/src/pages/Chat/ChatComponents/MessageInput.tsx
import React, { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import { fetchPrivateMessages, fetchGroupMessages, addMessage } from "../../../redux/features/chatSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSmile, faGift, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import "./MessageInput.css";

interface MessageInputProps {
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void; // Nouvelle prop pour mettre à jour selectedChatId
  wsInstance: WebSocket | null;
  userId: string | null;
  type?: string;
  id?: string;
  groups: string[];
}

const MessageInput: React.FC<MessageInputProps> = ({ selectedChatId, setSelectedChatId, wsInstance, userId, type, id, groups }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [messageInput, setMessageInput] = useState("");
  const [showGifs, setShowGifs] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [gifs, setGifs] = useState<any[]>([]);

  const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

  const getExistingChatId = (toUserId: string) => {
    return `temp-${toUserId}`;
  };

  const sendMessage = () => {
    if (!selectedChatId || !wsInstance || wsInstance.readyState !== WebSocket.OPEN || !messageInput || !userId) {
      console.error("❌ Impossible d’envoyer le message: WebSocket non connecté ou paramètres manquants");
      return;
    }

    let toUserId = id || "";
    const isGroup = groups.includes(selectedChatId);
    const tempChatId = isGroup ? selectedChatId : getExistingChatId(toUserId);
    // Mettre à jour selectedChatId avec le chatId temporaire
    setSelectedChatId(tempChatId);

    const message = {
      type: isGroup ? "group_message" : "private",
      [isGroup ? "groupId" : "toUserId"]: toUserId,
      content: messageInput,
      chatId: tempChatId,
      fromUserId: userId,
      toUserId: isGroup ? undefined : toUserId,
      timestamp: new Date().toISOString(),
      id: `temp-${Date.now()}-${Math.random()}`,
    };

    console.log("📤 Envoi du message au WebSocket:", message);

    // Ajouter le message localement immédiatement
    dispatch(addMessage(message));

    // Envoyer le message via WebSocket
    wsInstance.send(JSON.stringify(message));
    setMessageInput("");
    setShowEmojis(false);
    setShowGifs(false);

    console.log("✅ Message envoyé via WebSocket, en attente de réponse du serveur...");
  };

  const searchGifs = async (query: string = "funny") => {
    try {
      const response = await axios.get(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=10`
      );
      setGifs(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la recherche de GIFs:", error);
    }
  };

  const handleGifClick = (gifUrl: string) => {
    setMessageInput(gifUrl);
    setShowGifs(false);
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojis(false);
  };

  return (
    <div className="message-input-container">
      <FontAwesomeIcon
        icon={faSmile}
        className="message-input-icon"
        onClick={() => {
          setShowEmojis(!showEmojis);
          setShowGifs(false);
        }}
      />
      <FontAwesomeIcon
        icon={faGift}
        className="message-input-icon"
        onClick={() => {
          setShowGifs(!showGifs);
          setShowEmojis(false);
          if (!showGifs) searchGifs();
        }}
      />
      <div className="message-input-field-wrapper">
        <input
          className="message-input-field"
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={selectedChatId ? "Tapez votre message ici..." : "Sélectionnez une conversation pour écrire"}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          disabled={!selectedChatId}
        />
        <FontAwesomeIcon
          icon={faPaperPlane}
          className="message-input-send-icon"
          onClick={sendMessage}
        />
      </div>
      {showEmojis && (
        <div className="message-input-emoji-selector">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
      {showGifs && (
        <div className="message-input-gif-selector">
          <div className="message-input-gif-grid">
            {gifs.map((gif) => (
              <img
                key={gif.id}
                src={gif.images.fixed_height_small.url}
                alt={gif.title}
                className="message-input-gif-item"
                onClick={() => handleGifClick(gif.images.original.url)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;