// portfolio-frontend/src/pages/Chat/ChatComponents/ChatTheme.tsx
import React, { useState } from "react";

interface ChatThemeProps {
  chatId: string;
  onClose: () => void;
}

const ChatTheme: React.FC<ChatThemeProps> = ({ chatId, onClose }) => {
  const [theme, setTheme] = useState("default");

  const handleThemeChange = () => {
    console.log(`🔹 Changement du thème pour ${chatId} à ${theme} (fonctionnalité à implémenter)`);
    onClose();
  };

  return (
    <div className="chat-theme">
      <p>Choisir un thème pour {chatId}</p>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="default">Défaut</option>
        <option value="dark">Sombre</option>
        <option value="light">Clair</option>
      </select>
      <button onClick={handleThemeChange}>Appliquer</button>
      <button onClick={onClose}>Annuler</button>
    </div>
  );
};

export default ChatTheme;