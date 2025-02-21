import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface Education {
  id?: string;
  userId: string;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  currentlyStudying: boolean;
  description?: string;
}

interface EducationState {
  educations: Education[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ✅ **État initial**
const initialState: EducationState = {
  educations: [],
  status: "idle",
  error: null,
};

// ✅ **Fonction pour récupérer le token stocké**
const getAuthToken = () => localStorage.getItem("token");

// ✅ **Récupérer toutes les formations d'un utilisateur avec le token**
export const fetchEducationsByUser = createAsyncThunk(
  "education/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get(`http://localhost:8080/api/educations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Ajout du token
      });

      console.log("✅ Réponse du backend :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des formations.");
    }
  }
);

// ✅ **Ajouter une formation avec le token**
export const addEducation = createAsyncThunk(
  "education/add",
  async (educationData: Omit<Education, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId"); // ✅ Récupération du userId

      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }
      if (!userId) {
        return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");
      }

      // ✅ Ajouter le userId à l'objet envoyé
      const response = await axios.post(
        "http://localhost:8080/api/educations",
        { ...educationData, userId }, // Ajout du userId
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Formation ajoutée :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la formation.");
    }
  }
);


// ✅ **Mettre à jour une formation avec le token**
export const updateEducation = createAsyncThunk(
  "education/update",
  async ({ id, educationData }: { id: string; educationData: Education }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put(`http://localhost:8080/api/educations/${id}`, educationData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Formation mise à jour :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la formation.");
    }
  }
);

// ✅ **Supprimer une formation avec le token**
export const deleteEducation = createAsyncThunk(
  "education/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      await axios.delete(`http://localhost:8080/api/educations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Formation supprimée : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la formation.");
    }
  }
);

// ✅ **Création du slice Redux**
const educationSlice = createSlice({
  name: "education",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les formations**
      .addCase(fetchEducationsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des formations...");
      })
      .addCase(fetchEducationsByUser.fulfilled, (state, action: PayloadAction<Education[]>) => {
        state.status = "succeeded";
        console.log("✅ Formations reçues :", action.payload);
        state.educations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEducationsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des formations :", state.error);
      })

      // **Ajouter une formation**
      .addCase(addEducation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addEducation.fulfilled, (state, action: PayloadAction<Education>) => {
        state.status = "succeeded";
        state.educations.push(action.payload);
      })
      .addCase(addEducation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // **Mettre à jour une formation**
      .addCase(updateEducation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateEducation.fulfilled, (state, action: PayloadAction<Education>) => {
        state.status = "succeeded";
        state.educations = state.educations.map((edu) =>
          edu.id === action.payload.id ? action.payload : edu
        );
      })
      .addCase(updateEducation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // **Supprimer une formation**
      .addCase(deleteEducation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteEducation.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.educations = state.educations.filter((edu) => edu.id !== action.payload);
      })
      .addCase(deleteEducation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ **Exports**
export default educationSlice.reducer;
