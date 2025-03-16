// portfolio-frontend/src/redux/features/user/userTheme.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../../config/hostname";
import { RootState } from "../../store";
import { fetchUser } from "./userCrud"; // Import depuis userCrud.ts
import { User, UserState, normalizeBirthdate } from "./UserTypes";


const initialState: UserThemeState = {
  user: null,
  members: [],
  status: "idle",
  error: null,
  message: null,
};

// Action
export const saveChatTheme = createAsyncThunk(
  "userTheme/saveChatTheme",
  async (theme: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      const userId = state.auth.userId;

      if (!token || !userId) {
        console.warn("❌ Aucun token ou userId trouvé dans le state");
        return rejectWithValue("No token or userId found");
      }

      const validTheme = ["light", "dark"].includes(theme) ? theme : "light";
      console.log(`🔹 Sauvegarde du thème ${validTheme} pour l'utilisateur ${userId}`);
      await axios.post(
        `${BASE_URL}/api/chat/theme`,
        { theme: validTheme },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = await dispatch(fetchUser()).unwrap();
      return updatedUser.chatTheme;
    } catch (error: any) {
      console.error("❌ Échec de saveChatTheme:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to save chat theme");
    }
  }
);

// Reducer
const userThemeSlice = createSlice({
  name: "userTheme",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveChatTheme.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(saveChatTheme.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        if (state.user) {
          state.user.chatTheme = action.payload;
        }
        state.message = "Thème sauvegardé avec succès !";
        state.error = null;
      })
      .addCase(saveChatTheme.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const userThemeReducer = userThemeSlice.reducer;