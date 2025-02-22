import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

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

      const response = await axios.get(`http://localhost:8080/api/recommendations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Recommandations récupérées :", response.data);

      return response.data.map((rec: any) => ({
        id: rec._id?.$oid || rec.id, // 🔄 Adaptation MongoDB
        userId: rec.userId,
        recommenderName: rec.recommenderName || "Anonyme",
        recommenderPosition: rec.recommenderPosition || "Non spécifié",
        recommendationText: rec.content || "Aucun texte fourni.", // ⚠️ Correction ici
        dateReceived: rec.createdAt?.$date || new Date().toISOString(), // ⚠️ Correction ici
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
        "http://localhost:8080/api/recommendations",
        { ...recommendationData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recommandation ajoutée :", response.data);
      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        recommenderName: response.data.recommenderName,
        recommenderPosition: response.data.recommenderPosition || "Non spécifié",
        recommendationText: response.data.content || "Aucun texte fourni.", // ⚠️ Correction ici
        dateReceived: response.data.createdAt?.$date || new Date().toISOString(), // ⚠️ Correction ici
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
        `http://localhost:8080/api/recommendations/${id}`,
        recommendationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Recommandation mise à jour :", response.data);
      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        recommenderName: response.data.recommenderName,
        recommenderPosition: response.data.recommenderPosition || "Non spécifié",
        recommendationText: response.data.content || "Aucun texte fourni.", // ⚠️ Correction ici
        dateReceived: response.data.createdAt?.$date || new Date().toISOString(), // ⚠️ Correction ici
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

      await axios.delete(`http://localhost:8080/api/recommendations/${id}`, {
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
      // **Récupérer les recommandations**
      .addCase(fetchRecommendationsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des recommandations...");
      })
      .addCase(fetchRecommendationsByUser.fulfilled, (state, action: PayloadAction<Recommendation[]>) => {
        state.status = "succeeded";
        console.log("✅ Recommandations reçues :", action.payload);
        state.recommendations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecommendationsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des recommandations :", state.error);
      })

      // **Ajouter une recommandation**
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

      // **Mettre à jour une recommandation**
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

      // **Supprimer une recommandation**
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
