import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Image {
  id: string | null; // Peut être null si non fourni par Go
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean; // Correspond à `isNSFW` dans ImageDTO et Go
  uploadedAt: string | null; // Peut être null si non fourni
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

// Uploader une image
export const uploadImage = createAsyncThunk(
  "image/uploadImage",
  async (
    { userId, name, file }: { userId: string; name: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      console.log("🔹 Uploading image for user ID:", userId, "with name:", name);
      console.log("Payload envoyé:", { userId, name, file });

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("name", name);
      formData.append("file", file);

      const response = await axios.post(
        `${BASE_URL}/api/images/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Image uploaded successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Image upload failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to upload image");
    }
  }
);

// Récupérer les images d'un utilisateur (endpoint existant)
export const getUserImages = createAsyncThunk(
  "image/getUserImages",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      console.log("🔹 Fetching images for user ID:", userId);

      const response = await axios.get(`${BASE_URL}/api/images/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ User images retrieved:", response.data);
      return response.data as Image[];
    } catch (error: any) {
      console.error("❌ Fetch user images failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user images");
    }
  }
);

// Supprimer une image
export const deleteImage = createAsyncThunk(
  "image/deleteImage",
  async (
    { userId, name }: { userId: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      console.log("🔹 Deleting image for user ID:", userId, "with name:", name);

      await axios.delete(`${BASE_URL}/api/images/delete/${userId}/${name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Image deleted successfully");
      return { userId, name };
    } catch (error: any) {
      console.error("❌ Image deletion failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to delete image");
    }
  }
);

// Nouvelle action pour récupérer toutes les images d'un utilisateur via GET /api/images/all/{userId}
export const getAllImagesByUserId = createAsyncThunk(
  "image/getAllImagesByUserId",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      console.log("🔹 Fetching all images for user ID:", userId);
      const response = await axios.get(`${BASE_URL}/api/images/all/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Vérifie que la réponse est un tableau, sinon retourne un tableau vide
      const data = Array.isArray(response.data) ? response.data : [];
      console.log("✅ All images retrieved for user:", data);
      return data as Image[];
    } catch (error: any) {
      console.error("❌ Fetch all images failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message || "Failed to fetch all images");
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadImage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadImage.fulfilled, (state, action: PayloadAction<Image>) => {
        state.status = "succeeded";
        state.images.push(action.payload);
        state.message = "Image uploaded successfully!";
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(getUserImages.pending, (state) => {
        state.status = "loading";
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
      })
      .addCase(deleteImage.fulfilled, (state, action: PayloadAction<{ userId: string; name: string }>) => {
        state.status = "succeeded";
        state.images = state.images.filter(
          (image) => !(image.userId === action.payload.userId && image.name === action.payload.name)
        );
        state.message = "Image deleted successfully!";
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Ajout des reducers pour getAllImagesByUserId
      .addCase(getAllImagesByUserId.pending, (state) => {
        state.status = "loading";
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

export const { clearImageState } = imageSlice.actions;
export default imageSlice.reducer;