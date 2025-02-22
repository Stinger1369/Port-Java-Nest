import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname"; // ✅ Utilisation de hostname.ts

interface Recommendation {
  id?: string;
  userId: string;
  recommenderName: string;
  recommenderPosition?: string;
  recommendationText: string;
  dateReceived: string;
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

      // ✅ Correction : Adapter les champs de l'API au format attendu
      return response.data.map((rec: any) => ({
        id: rec._id?.$oid || rec.id,
        userId: rec.userId,
        recommenderName: rec.recommenderName || "Anonyme",
        recommenderPosition: rec.recommenderPosition || "Non spécifié",
        recommendationText: rec.content ?? "", // ✅ Évite le `null`
        dateReceived: rec.createdAt || new Date().toISOString(), // ✅ Corrige le champ
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
  async (recommendationData: Omit<Recommendation, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("⚠️ ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        `${BASE_URL}/api/recommendations`,
        { ...recommendationData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recommandation ajoutée :", response.data);

      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        recommenderName: response.data.recommenderName,
        recommenderPosition: response.data.recommenderPosition || "Non spécifié",
        recommendationText: response.data.content ?? "", // ✅ Corrige `null`
        dateReceived: response.data.createdAt || new Date().toISOString(),
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
        {
          ...recommendationData,
          content: recommendationData.recommendationText, // ✅ Assure l'envoi correct des données
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recommandation mise à jour :", response.data);

      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        recommenderName: response.data.recommenderName,
        recommenderPosition: response.data.recommenderPosition || "Non spécifié",
        recommendationText: response.data.content ?? "", // ✅ Correction ici
        dateReceived: response.data.createdAt || new Date().toISOString(),
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
      // 🔹 **Récupérer les recommandations**
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

      // 🔹 **Ajouter une recommandation**
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

      // 🔹 **Mettre à jour une recommandation**
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

      // 🔹 **Supprimer une recommandation**
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
