// src/redux/features/educationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState

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
  isPublic?: boolean;
}

interface EducationState {
  educations: Education[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EducationState = {
  educations: [],
  status: "idle",
  error: null,
};

export const fetchEducationsByUser = createAsyncThunk(
  "education/fetchByUser",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Education[]>(
        `${BASE_URL}/api/educations/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data.map((edu) => ({
        ...edu,
        isPublic: edu.isPublic ?? false,
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des formations.");
    }
  }
);

export const addEducation = createAsyncThunk(
  "education/add",
  async (educationData: Omit<Education, "id" | "userId">, { getState, rejectWithValue }) => {
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

      const response = await axios.post<Education>(
        `${BASE_URL}/api/educations`,
        { ...educationData, userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        isPublic: response.data.isPublic ?? false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la formation.");
    }
  }
);

export const updateEducation = createAsyncThunk(
  "education/update",
  async ({ id, educationData }: { id: string; educationData: Partial<Education> }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put<Education>(
        `${BASE_URL}/api/educations/${id}`,
        educationData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        isPublic: response.data.isPublic ?? false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la formation.");
    }
  }
);

export const deleteEducation = createAsyncThunk(
  "education/delete",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      await axios.delete(
        `${BASE_URL}/api/educations/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la formation.");
    }
  }
);

const educationSlice = createSlice({
  name: "education",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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

export default educationSlice.reducer;