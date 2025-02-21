import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import userReducer from "./features/userSlice";
import educationReducer from "./features/educationSlice"; // ✅ Ajout

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    education: educationReducer, // ✅ Intégration de l'éducation
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
