import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface Interest {
  id?: string;
  userId: string;
  name: string;
  description?: string;
}

interface InterestState {
  interests: Interest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: InterestState = {
  interests: [],
  status: "idle",
  error: null,
};

const getAuthToken = () => localStorage.getItem("token");

// ✅ **Récupérer les centres d’intérêt d'un utilisateur**
export const fetchInterestsByUser = createAsyncThunk(
  "interest/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`http://localhost:8080/api/interests/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Centres d’intérêt récupérés :", response.data);

      return response.data.map((interest: any) => ({
        id: interest._id?.$oid || interest.id,  // 🔄 Adaptation des IDs MongoDB
        userId: interest.userId,
        name: interest.name || "Inconnu",
        description: interest.description || "",
      }));
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des centres d’intérêt.");
    }
  }
);

// ✅ **Ajouter un centre d’intérêt**
export const addInterest = createAsyncThunk(
  "interest/add",
  async (interestData: Omit<Interest, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        "http://localhost:8080/api/interests",
        { ...interestData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Centre d’intérêt ajouté :", response.data);

      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        name: response.data.name,
        description: response.data.description || "",
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du centre d’intérêt.");
    }
  }
);

// ✅ **Mettre à jour un centre d’intérêt**
export const updateInterest = createAsyncThunk(
  "interest/update",
  async ({ id, interestData }: { id: string; interestData: Interest }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `http://localhost:8080/api/interests/${id}`,
        interestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Centre d’intérêt mis à jour :", response.data);

      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        name: response.data.name,
        description: response.data.description || "",
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du centre d’intérêt.");
    }
  }
);

// ✅ **Supprimer un centre d’intérêt**
export const deleteInterest = createAsyncThunk(
  "interest/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`http://localhost:8080/api/interests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Centre d’intérêt supprimé : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du centre d’intérêt.");
    }
  }
);

// ✅ **Création du slice Redux**
const interestSlice = createSlice({
  name: "interest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les centres d’intérêt**
      .addCase(fetchInterestsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des centres d’intérêt...");
      })
      .addCase(fetchInterestsByUser.fulfilled, (state, action: PayloadAction<Interest[]>) => {
        state.status = "succeeded";
        console.log("✅ Centres d’intérêt reçus :", action.payload);
        state.interests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchInterestsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des centres d’intérêt :", state.error);
      })

      // **Ajouter un centre d’intérêt**
      .addCase(addInterest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addInterest.fulfilled, (state, action: PayloadAction<Interest>) => {
        state.status = "succeeded";
        state.interests.push(action.payload);
      })
      .addCase(addInterest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // **Mettre à jour un centre d’intérêt**
      .addCase(updateInterest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateInterest.fulfilled, (state, action: PayloadAction<Interest>) => {
        state.status = "succeeded";
        state.interests = state.interests.map((interest) =>
          interest.id === action.payload.id ? action.payload : interest
        );
      })
      .addCase(updateInterest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // **Supprimer un centre d’intérêt**
      .addCase(deleteInterest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteInterest.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.interests = state.interests.filter((interest) => interest.id !== action.payload);
      })
      .addCase(deleteInterest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ **Exports**
export default interestSlice.reducer;
