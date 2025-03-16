// src/redux/features/socialLinkSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState

interface SocialLink {
  id?: string;
  userId: string;
  platform: string;
  url: string;
  isPublic?: boolean;
}

interface SocialLinkState {
  socialLinks: SocialLink[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SocialLinkState = {
  socialLinks: [],
  status: "idle",
  error: null,
};

export const fetchSocialLinksByUser = createAsyncThunk(
  "socialLink/fetchByUser",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<SocialLink[]>(
        `${BASE_URL}/api/social-links/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des liens sociaux.");
    }
  }
);

export const addSocialLink = createAsyncThunk(
  "socialLink/add",
  async (socialLinkData: Omit<SocialLink, "id" | "userId">, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      const userId = state.auth.userId;

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post<SocialLink>(
        `${BASE_URL}/api/social-links`,
        { ...socialLinkData, userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du lien social.");
    }
  }
);

export const updateSocialLink = createAsyncThunk(
  "socialLink/update",
  async (
    { id, socialLinkData }: { id: string; socialLinkData: Partial<SocialLink> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put<SocialLink>(
        `${BASE_URL}/api/social-links/${id}`,
        socialLinkData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du lien social.");
    }
  }
);

export const deleteSocialLink = createAsyncThunk(
  "socialLink/delete",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(
        `${BASE_URL}/api/social-links/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du lien social.");
    }
  }
);

const socialLinkSlice = createSlice({
  name: "socialLink",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialLinksByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSocialLinksByUser.fulfilled, (state, action: PayloadAction<SocialLink[]>) => {
        state.status = "succeeded";
        state.socialLinks = action.payload;
      })
      .addCase(fetchSocialLinksByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addSocialLink.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addSocialLink.fulfilled, (state, action: PayloadAction<SocialLink>) => {
        state.status = "succeeded";
        state.socialLinks.push(action.payload);
      })
      .addCase(addSocialLink.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateSocialLink.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateSocialLink.fulfilled, (state, action: PayloadAction<SocialLink>) => {
        state.status = "succeeded";
        state.socialLinks = state.socialLinks.map((link) =>
          link.id === action.payload.id ? action.payload : link
        );
      })
      .addCase(updateSocialLink.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteSocialLink.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteSocialLink.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.socialLinks = state.socialLinks.filter((link) => link.id !== action.payload);
      })
      .addCase(deleteSocialLink.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default socialLinkSlice.reducer;