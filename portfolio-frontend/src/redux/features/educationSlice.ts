import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname"; // Import de la configuration de l'URL

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

      const response = await axios.get<Education[]>(
        `${BASE_URL}/api/educations/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      return response.data;
    } catch (error: any) {
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
      const userId = localStorage.getItem("userId");

      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }
      if (!userId) {
        return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");
      }

      const response = await axios.post<Education>(
        `${BASE_URL}/api/educations`,
        { ...educationData, userId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la formation.");
    }
  }
);

// ✅ **Mettre à jour une formation avec le token**
export const updateEducation = createAsyncThunk(
  "education/update",
  async ({ id, educationData }: { id: string; educationData: Partial<Education> }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put<Education>(
        `${BASE_URL}/api/educations/${id}`,
        educationData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      return response.data;
    } catch (error: any) {
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

      await axios.delete(
        `${BASE_URL}/api/educations/${id}`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      return id;
    } catch (error: any) {
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
      })
      .addCase(fetchEducationsByUser.fulfilled, (state, action: PayloadAction<Education[]>) => {
        state.status = "succeeded";
        state.educations = action.payload;
      })
      .addCase(fetchEducationsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
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