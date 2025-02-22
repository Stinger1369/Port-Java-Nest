import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface Language {
  id?: string;
  userId: string;
  name: string;
  proficiencyLevel: string; // Ex: Débutant, Intermédiaire, Avancé, Courant
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

// ✅ **Récupérer les langues**
export const fetchLanguagesByUser = createAsyncThunk(
  "language/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`http://localhost:8080/api/languages/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Langues récupérées :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des langues.");
    }
  }
);

// ✅ **Ajouter une langue**
export const addLanguage = createAsyncThunk(
  "language/add",
  async (languageData: Omit<Language, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        "http://localhost:8080/api/languages",
        { ...languageData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Langue ajoutée :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la langue.");
    }
  }
);

// ✅ **Mettre à jour une langue**
export const updateLanguage = createAsyncThunk(
  "language/update",
  async ({ id, languageData }: { id: string; languageData: Language }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `http://localhost:8080/api/languages/${id}`,
        languageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Langue mise à jour :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la langue.");
    }
  }
);

// ✅ **Supprimer une langue**
export const deleteLanguage = createAsyncThunk(
  "language/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`http://localhost:8080/api/languages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Langue supprimée : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la langue.");
    }
  }
);

// ✅ **Création du slice Redux**
const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les langues**
      .addCase(fetchLanguagesByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des langues...");
      })
      .addCase(fetchLanguagesByUser.fulfilled, (state, action: PayloadAction<Language[]>) => {
        state.status = "succeeded";
        console.log("✅ Langues reçues :", action.payload);
        state.languages = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLanguagesByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des langues :", state.error);
      })

      // **Ajouter une langue**
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

      // **Mettre à jour une langue**
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

      // **Supprimer une langue**
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

// ✅ **Exports**
export default languageSlice.reducer;
