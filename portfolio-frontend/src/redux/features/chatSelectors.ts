// portfolio-frontend/src/redux/features/chatSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

// Sélecteur de base pour les messages
const selectChatMessages = (state: RootState) => state.chat.messages;

// Sélecteur mémoïsé pour filtrer les messages par chatId
export const selectMessagesByChatId = createSelector(
  [selectChatMessages, (state: RootState, chatId: string) => chatId],
  (messages, chatId) => messages.filter((msg) => msg.chatId === chatId)
);