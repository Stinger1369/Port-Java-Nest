import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Language {
  id?: string;
  userId: string;
  name: string;
  level?: string;
  proficiencyLevel: string;
  isPublic?: boolean; // Ajouté
}

interface LanguageState {
  languages: Language[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LanguageState = {
  languages: [],
  status: "idle",
  error: null,
};

const getAuthToken = () => localStorage.getItem("token");

export const fetchLanguagesByUser = createAsyncThunk(
  "language/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<Language[]>(
        `${BASE_URL}/api/languages/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des langues.");
    }
  }
);

export const addLanguage = createAsyncThunk(
  "language/add",
  async (languageData: Omit<Language, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post<Language>(
        `${BASE_URL}/api/languages`,
        { ...languageData, userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la langue.");
    }
  }
);

export const updateLanguage = createAsyncThunk(
  "language/update",
  async ({ id, languageData }: { id: string; languageData: Partial<Language> }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put<Language>(
        `${BASE_URL}/api/languages/${id}`,
        languageData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la langue.");
    }
  }
);

export const deleteLanguage = createAsyncThunk(
  "language/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(
        `${BASE_URL}/api/languages/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la langue.");
    }
  }
);

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLanguagesByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLanguagesByUser.fulfilled, (state, action: PayloadAction<Language[]>) => {
        state.status = "succeeded";
        state.languages = action.payload;
      })
      .addCase(fetchLanguagesByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addLanguage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addLanguage.fulfilled, (state, action: PayloadAction<Language>) => {
        state.status = "succeeded";
        state.languages.push(action.payload);
      })
      .addCase(addLanguage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateLanguage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateLanguage.fulfilled, (state, action: PayloadAction<Language>) => {
        state.status = "succeeded";
        state.languages = state.languages.map((language) =>
          language.id === action.payload.id ? action.payload : language
        );
      })
      .addCase(updateLanguage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteLanguage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteLanguage.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.languages = state.languages.filter((language) => language.id !== action.payload);
      })
      .addCase(deleteLanguage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default languageSlice.reducer;