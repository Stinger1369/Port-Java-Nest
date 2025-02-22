import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface SocialLink {
  id?: string;
  userId: string;
  platform: string;
  url: string;
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

const getAuthToken = () => localStorage.getItem("token");

// ✅ **Récupérer les liens sociaux d'un utilisateur**
export const fetchSocialLinksByUser = createAsyncThunk(
  "socialLink/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`http://localhost:8080/api/social-links/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Liens sociaux récupérés :", response.data);
      return response.data.map((link: any) => ({
        id: link._id?.$oid || link.id, // 🔄 Adaptation MongoDB
        userId: link.userId,
        platform: link.platform,
        url: link.url,
      }));
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des liens sociaux.");
    }
  }
);

// ✅ **Ajouter un lien social**
export const addSocialLink = createAsyncThunk(
  "socialLink/add",
  async (socialLinkData: Omit<SocialLink, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("⚠️ ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        "http://localhost:8080/api/social-links",
        { ...socialLinkData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Lien social ajouté :", response.data);
      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        platform: response.data.platform,
        url: response.data.url,
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du lien social.");
    }
  }
);

// ✅ **Mettre à jour un lien social**
export const updateSocialLink = createAsyncThunk(
  "socialLink/update",
  async ({ id, socialLinkData }: { id: string; socialLinkData: SocialLink }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `http://localhost:8080/api/social-links/${id}`,
        socialLinkData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Lien social mis à jour :", response.data);
      return {
        id: response.data._id?.$oid || response.data.id,
        userId: response.data.userId,
        platform: response.data.platform,
        url: response.data.url,
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du lien social.");
    }
  }
);

// ✅ **Supprimer un lien social**
export const deleteSocialLink = createAsyncThunk(
  "socialLink/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("⚠️ Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`http://localhost:8080/api/social-links/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Lien social supprimé : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du lien social.");
    }
  }
);

// ✅ **Création du slice Redux**
const socialLinkSlice = createSlice({
  name: "socialLink",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les liens sociaux**
      .addCase(fetchSocialLinksByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des liens sociaux...");
      })
      .addCase(fetchSocialLinksByUser.fulfilled, (state, action: PayloadAction<SocialLink[]>) => {
        state.status = "succeeded";
        console.log("✅ Liens sociaux reçus :", action.payload);
        state.socialLinks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSocialLinksByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des liens sociaux :", state.error);
      })

      // **Ajouter un lien social**
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

      // **Mettre à jour un lien social**
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

      // **Supprimer un lien social**
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

// ✅ **Exports**
export default socialLinkSlice.reducer;
