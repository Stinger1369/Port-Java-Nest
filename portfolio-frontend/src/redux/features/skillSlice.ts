// src/redux/features/skillSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState

interface Skill {
  id?: string;
  userId: string;
  name: string;
  level: number;
  description?: string;
  isPublic?: boolean;
}

interface SkillState {
  skills: Skill[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SkillState = {
  skills: [],
  status: "idle",
  error: null,
};

export const fetchSkillsByUser = createAsyncThunk(
  "skill/fetchByUser",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<Skill[]>(
        `${BASE_URL}/api/skills/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data.map((skill) => ({
        ...skill,
        isPublic: skill.isPublic ?? false,
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des skills.");
    }
  }
);

export const addSkill = createAsyncThunk(
  "skill/add",
  async (skillData: Omit<Skill, "id" | "userId">, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      const userId = state.auth.userId;

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post<Skill>(
        `${BASE_URL}/api/skills`,
        { ...skillData, userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        isPublic: response.data.isPublic ?? false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du skill.");
    }
  }
);

export const updateSkill = createAsyncThunk(
  "skill/update",
  async ({ id, skillData }: { id: string; skillData: Partial<Skill> }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put<Skill>(
        `${BASE_URL}/api/skills/${id}`,
        skillData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        isPublic: response.data.isPublic ?? false,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du skill.");
    }
  }
);

export const deleteSkill = createAsyncThunk(
  "skill/delete",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(
        `${BASE_URL}/api/skills/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du skill.");
    }
  }
);

const skillSlice = createSlice({
  name: "skill",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkillsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSkillsByUser.fulfilled, (state, action: PayloadAction<Skill[]>) => {
        state.status = "succeeded";
        state.skills = action.payload;
      })
      .addCase(fetchSkillsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addSkill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addSkill.fulfilled, (state, action: PayloadAction<Skill>) => {
        state.status = "succeeded";
        state.skills.push(action.payload);
      })
      .addCase(addSkill.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateSkill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateSkill.fulfilled, (state, action: PayloadAction<Skill>) => {
        state.status = "succeeded";
        state.skills = state.skills.map((skill) =>
          skill.id === action.payload.id ? action.payload : skill
        );
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteSkill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteSkill.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.skills = state.skills.filter((skill) => skill.id !== action.payload);
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default skillSlice.reducer;