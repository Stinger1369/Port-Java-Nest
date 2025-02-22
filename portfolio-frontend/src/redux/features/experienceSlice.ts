import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ **Interface Experience**
interface Experience {
  id?: string;
  userId: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
}

// ✅ **État initial**
interface ExperienceState {
  experiences: Experience[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ExperienceState = {
  experiences: [],
  status: "idle",
  error: null,
};

// ✅ **Fonction pour récupérer le token stocké**
const getAuthToken = () => localStorage.getItem("token");

// ✅ **Récupérer toutes les expériences d'un utilisateur avec le token**
export const fetchExperiencesByUser = createAsyncThunk(
  "experience/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get(`http://localhost:8080/api/experiences/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Réponse du backend :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des expériences.");
    }
  }
);

// ✅ **Ajouter une expérience avec le token**
export const addExperience = createAsyncThunk(
  "experience/add",
  async (experienceData: Omit<Experience, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }
      if (!userId) {
        return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");
      }

      const response = await axios.post(
        "http://localhost:8080/api/experiences",
        { ...experienceData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Expérience ajoutée :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de l'expérience.");
    }
  }
);

// ✅ **Mettre à jour une expérience avec le token**
export const updateExperience = createAsyncThunk(
  "experience/update",
  async ({ id, experienceData }: { id: string; experienceData: Experience }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put(`http://localhost:8080/api/experiences/${id}`, experienceData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Expérience mise à jour :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de l'expérience.");
    }
  }
);

// ✅ **Supprimer une expérience avec le token**
export const deleteExperience = createAsyncThunk(
  "experience/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      await axios.delete(`http://localhost:8080/api/experiences/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Expérience supprimée : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de l'expérience.");
    }
  }
);

// ✅ **Création du slice Redux**
const experienceSlice = createSlice({
  name: "experience",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les expériences**
      .addCase(fetchExperiencesByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des expériences...");
      })
      .addCase(fetchExperiencesByUser.fulfilled, (state, action: PayloadAction<Experience[]>) => {
        state.status = "succeeded";
        console.log("✅ Expériences reçues :", action.payload);
        state.experiences = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchExperiencesByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des expériences :", state.error);
      })

      // **Ajouter une expérience**
      .addCase(addExperience.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addExperience.fulfilled, (state, action: PayloadAction<Experience>) => {
        state.status = "succeeded";
        state.experiences.push(action.payload);
      })
      .addCase(addExperience.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // **Mettre à jour une expérience**
      .addCase(updateExperience.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateExperience.fulfilled, (state, action: PayloadAction<Experience>) => {
        state.status = "succeeded";
        state.experiences = state.experiences.map((exp) =>
          exp.id === action.payload.id ? action.payload : exp
        );
      })
      .addCase(updateExperience.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // **Supprimer une expérience**
      .addCase(deleteExperience.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteExperience.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.experiences = state.experiences.filter((exp) => exp.id !== action.payload);
      })
      .addCase(deleteExperience.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ **Exports**
export default experienceSlice.reducer;
