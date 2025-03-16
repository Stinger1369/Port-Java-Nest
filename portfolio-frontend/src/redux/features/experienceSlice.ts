// src/redux/features/experienceSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState

interface Experience {
  id?: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
  isPublic?: boolean;
}

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

export const fetchExperiencesByUser = createAsyncThunk(
  "experience/fetchByUser",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Experience[]>(
        `${BASE_URL}/api/experiences/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data.map((exp) => ({
        ...exp,
        isPublic: exp.isPublic ?? false,
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des expériences.");
    }
  }
);

export const addExperience = createAsyncThunk(
  "experience/add",
  async (experienceData: Omit<Experience, "id" | "userId">, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      const userId = state.auth.userId;

      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }
      if (!userId) {
        return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");
      }

      const response = await axios.post<Experience>(
        `${BASE_URL}/api/experiences`,
        { ...experienceData, userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        isPublic: response.data.isPublic ?? false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de l'expérience.");
    }
  }
);

export const updateExperience = createAsyncThunk(
  "experience/update",
  async ({ id, experienceData }: { id: string; experienceData: Partial<Experience> }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put<Experience>(
        `${BASE_URL}/api/experiences/${id}`,
        experienceData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        isPublic: response.data.isPublic ?? false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de l'expérience.");
    }
  }
);

export const deleteExperience = createAsyncThunk(
  "experience/delete",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      await axios.delete(
        `${BASE_URL}/api/experiences/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de l'expérience.");
    }
  }
);

const experienceSlice = createSlice({
  name: "experience",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExperiencesByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchExperiencesByUser.fulfilled, (state, action: PayloadAction<Experience[]>) => {
        state.status = "succeeded";
        state.experiences = action.payload;
      })
      .addCase(fetchExperiencesByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
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

export default experienceSlice.reducer;