import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname"; // ✅ Utilisation de hostname.ts

// ✅ **Interface correspondant au backend**
interface Recommendation {
  id?: string;
  userId: string; // ✅ Identifiant de l'utilisateur recevant la recommandation
  recommenderId: string; // ✅ Identifiant de l'utilisateur qui recommande
  content: string; // ✅ Contenu de la recommandation
  createdAt: string; // ✅ Format YYYY-MM-DD
}

interface RecommendationState {
  recommendations: Recommendation[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RecommendationState = {
  recommendations: [],
  status: "idle",
  error: null,
};

// ✅ **Récupérer le token d'authentification**
const getAuthToken = () => localStorage.getItem("token");

// ✅ **Récupérer les recommandations d'un utilisateur**
export const fetchRecommendationsByUser = createAsyncThunk(
  "recommendation/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`${BASE_URL}/api/recommendations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Recommandations récupérées :", response.data);

      // ✅ Adaptation des champs du backend au Redux
      return response.data.map((rec: any) => ({
        id: rec._id?.$oid || rec.id,
        userId: rec.userId,
        recommenderId: rec.recommenderId,
        content: rec.content ?? "", // ✅ Empêche `null`
        createdAt: rec.createdAt?.$date?.split("T")[0] || new Date().toISOString().split("T")[0], // ✅ Format YYYY-MM-DD
      }));
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des recommandations.");
    }
  }
);

// ✅ **Ajouter une recommandation**
export const addRecommendation = createAsyncThunk(
  "recommendation/add",
  async (recommendationData: Omit<Recommendation, "id">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.post(
        `${BASE_URL}/api/recommendations`,
        recommendationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recommandation ajoutée :", response.data);

      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        recommenderId: response.data.recommenderId,
        content: response.data.content ?? "",
        createdAt: response.data.createdAt?.$date?.split("T")[0] || new Date().toISOString().split("T")[0],
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la recommandation.");
    }
  }
);

// ✅ **Mettre à jour une recommandation**
export const updateRecommendation = createAsyncThunk(
  "recommendation/update",
  async ({ id, recommendationData }: { id: string; recommendationData: Recommendation }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `${BASE_URL}/api/recommendations/${id}`,
        recommendationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recommandation mise à jour :", response.data);

      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        recommenderId: response.data.recommenderId,
        content: response.data.content ?? "",
        createdAt: response.data.createdAt?.$date?.split("T")[0] || new Date().toISOString().split("T")[0],
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la recommandation.");
    }
  }
);

// ✅ **Supprimer une recommandation**
export const deleteRecommendation = createAsyncThunk(
  "recommendation/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`${BASE_URL}/api/recommendations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Recommandation supprimée : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la recommandation.");
    }
  }
);

// ✅ **Création du slice Redux**
const recommendationSlice = createSlice({
  name: "recommendation",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendationsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRecommendationsByUser.fulfilled, (state, action: PayloadAction<Recommendation[]>) => {
        state.status = "succeeded";
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendationsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addRecommendation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addRecommendation.fulfilled, (state, action: PayloadAction<Recommendation>) => {
        state.status = "succeeded";
        state.recommendations.push(action.payload);
      })
      .addCase(addRecommendation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateRecommendation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateRecommendation.fulfilled, (state, action: PayloadAction<Recommendation>) => {
        state.status = "succeeded";
        state.recommendations = state.recommendations.map((rec) =>
          rec.id === action.payload.id ? action.payload : rec
        );
      })
      .addCase(updateRecommendation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteRecommendation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRecommendation.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.recommendations = state.recommendations.filter((rec) => rec.id !== action.payload);
      })
      .addCase(deleteRecommendation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ **Exports**
export default recommendationSlice.reducer;
