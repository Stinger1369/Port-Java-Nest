import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname"; // Import de la configuration de l'URL

interface Image {
  id: string | null;
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean;
  uploadedAt: string | null;
}

interface ImageState {
  images: Image[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
}

const initialState: ImageState = {
  images: [],
  status: "idle",
  error: null,
  message: null,
};

// ✅ **Fonction pour récupérer le token stocké**
const getAuthToken = () => localStorage.getItem("token");

// ✅ **Uploader une image**
export const uploadImage = createAsyncThunk(
  "image/uploadImage",
  async (
    { userId, name, file }: { userId: string; name: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("name", name);
      formData.append("file", file);

      const response = await axios.post<Image>(
        `${BASE_URL}/api/images/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du téléversement de l'image.");
    }
  }
);

// ✅ **Récupérer les images d'un utilisateur**
export const getUserImages = createAsyncThunk(
  "image/getUserImages",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Image[]>(
        `${BASE_URL}/api/images/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des images utilisateur.");
    }
  }
);

// ✅ **Supprimer une image**
export const deleteImage = createAsyncThunk(
  "image/deleteImage",
  async (
    { userId, name }: { userId: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      await axios.delete(
        `${BASE_URL}/api/images/delete/${userId}/${name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return { userId, name };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de l'image.");
    }
  }
);

// ✅ **Récupérer toutes les images d'un utilisateur**
export const getAllImagesByUserId = createAsyncThunk(
  "image/getAllImagesByUserId",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Image[]>(
        `${BASE_URL}/api/images/all/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération de toutes les images.");
    }
  }
);

const imageSlice = createSlice({
  name: "image",
  initialState,
  reducers: {
    clearImageState: (state) => {
      state.images = [];
      state.status = "idle";
      state.error = null;
      state.message = null;
    },
    clearImageMessages: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadImage.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(uploadImage.fulfilled, (state, action: PayloadAction<Image>) => {
        state.status = "succeeded";
        state.images.push(action.payload);
        state.message = "Image téléversée avec succès !";
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(getUserImages.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(getUserImages.fulfilled, (state, action: PayloadAction<Image[]>) => {
        state.status = "succeeded";
        state.images = action.payload;
      })
      .addCase(getUserImages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteImage.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(deleteImage.fulfilled, (state, action: PayloadAction<{ userId: string; name: string }>) => {
        state.status = "succeeded";
        state.images = state.images.filter(
          (image) => !(image.userId === action.payload.userId && image.name === action.payload.name)
        );
        state.message = "Image supprimée avec succès !";
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(getAllImagesByUserId.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(getAllImagesByUserId.fulfilled, (state, action: PayloadAction<Image[]>) => {
        state.status = "succeeded";
        state.images = action.payload;
      })
      .addCase(getAllImagesByUserId.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearImageState, clearImageMessages } = imageSlice.actions;
export default imageSlice.reducer;