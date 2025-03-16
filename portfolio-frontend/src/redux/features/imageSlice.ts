// src/redux/features/imageSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState

interface Image {
  id: string | null;
  userId: string;
  name: string;
  path: string;
  isNSFW: boolean;
  isProfilePicture: boolean;
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

export const uploadImage = createAsyncThunk(
  "image/uploadImage",
  async (
    { userId, name, file, isProfilePicture }: { userId: string; name: string; file: File; isProfilePicture?: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("name", name);
      formData.append("file", file);
      if (isProfilePicture !== undefined) {
        formData.append("isProfilePicture", String(isProfilePicture));
      }

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

      console.log("✅ Image uploadée:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de uploadImage:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du téléversement de l'image.");
    }
  }
);

export const getUserImages = createAsyncThunk(
  "image/getUserImages",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Image[]>(
        `${BASE_URL}/api/images/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Images utilisateur récupérées:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de getUserImages:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des images utilisateur.");
    }
  }
);

export const deleteImage = createAsyncThunk(
  "image/deleteImage",
  async (
    { userId, name }: { userId: string; name: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      await axios.delete(
        `${BASE_URL}/api/images/delete/${userId}/${name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Image supprimée:", { userId, name });
      return { userId, name };
    } catch (error: any) {
      console.error("❌ Échec de deleteImage:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de l'image.");
    }
  }
);

export const getAllImagesByUserId = createAsyncThunk(
  "image/getAllImagesByUserId",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<any[]>(
        `${BASE_URL}/api/images/all/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Toutes les images récupérées pour userId:", userId, response.data);
      const normalizedImages = response.data.map((img) => ({
        id: img._id ? String(img._id) : img.id || null,
        userId: img.userId,
        name: img.name,
        path: img.path,
        isNSFW: img.isNSFW || false,
        isProfilePicture: img.isProfilePicture || false,
        uploadedAt: img.uploadedAt || null,
      }));
      console.log("🔍 Images normalisées:", normalizedImages);
      return { userId, images: normalizedImages };
    } catch (error: any) {
      console.error("❌ Échec de getAllImagesByUserId:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération de toutes les images.");
    }
  }
);

export const getImagesByIds = createAsyncThunk(
  "image/getImagesByIds",
  async (imageIds: string[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Image[]>(
        `${BASE_URL}/api/images/by-ids`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { imageIds: imageIds.join(","), filterProfile: true },
        }
      );

      console.log("✅ Images récupérées par IDs:", response.data);
      const normalizedImages = response.data.map((img) => ({
        ...img,
        id: img._id ? String(img._id) : img.id || null,
      }));
      return normalizedImages;
    } catch (error: any) {
      console.error("❌ Échec de getImagesByIds:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des images par IDs.");
    }
  }
);

export const getProfileImagesByUserId = createAsyncThunk(
  "image/getProfileImagesByUserId",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.get<Image[]>(
        `${BASE_URL}/api/images/profile/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Images de profil récupérées pour userId:", userId, response.data);
      const normalizedImages = response.data.map((img) => ({
        id: img._id ? String(img._id) : img.id || null,
        userId: img.userId,
        name: img.name,
        path: img.path,
        isNSFW: img.isNSFW || false,
        isProfilePicture: img.isProfilePicture || true,
        uploadedAt: img.uploadedAt || null,
      }));
      return normalizedImages;
    } catch (error: any) {
      console.error("❌ Échec de getProfileImagesByUserId:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la récupération des images de profil.");
    }
  }
);

export const setProfilePicture = createAsyncThunk(
  "image/setProfilePicture",
  async (imageId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      console.log("🔹 Définition de l'image comme photo de profil, imageId:", imageId);
      const response = await axios.put<Image>(
        `${BASE_URL}/api/images/set-profile-picture/${imageId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Photo de profil définie:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de setProfilePicture:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la définition de la photo de profil.");
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
        const index = state.images.findIndex((img) => img.id === action.payload.id);
        if (index !== -1) {
          state.images[index] = action.payload;
        } else {
          state.images.push(action.payload);
        }
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
        action.payload.forEach((newImage) => {
          const index = state.images.findIndex((img) => img.id === newImage.id);
          if (index !== -1) {
            state.images[index] = newImage;
          } else {
            state.images.push(newImage);
          }
        });
        console.log("🔍 Nouvel état des images après getUserImages:", state.images);
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
      .addCase(getAllImagesByUserId.fulfilled, (state, action: PayloadAction<{ userId: string; images: Image[] }>) => {
        state.status = "succeeded";
        action.payload.images.forEach((newImage) => {
          const index = state.images.findIndex((img) => img.id === newImage.id);
          if (index !== -1) {
            state.images[index] = newImage;
          } else {
            state.images.push(newImage);
          }
        });
        console.log("🔍 Nouvel état des images après getAllImagesByUserId:", state.images);
      })
      .addCase(getAllImagesByUserId.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(getImagesByIds.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(getImagesByIds.fulfilled, (state, action: PayloadAction<Image[]>) => {
        state.status = "succeeded";
        console.log("🔍 Images reçues dans le reducer:", action.payload);
        action.payload.forEach((newImage) => {
          const index = state.images.findIndex((img) => img.id === newImage.id);
          if (index !== -1) {
            state.images[index] = newImage;
          } else {
            state.images.push(newImage);
          }
        });
        console.log("🔍 Nouvel état des images:", state.images);
      })
      .addCase(getImagesByIds.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.log("❌ Erreur dans getImagesByIds:", state.error);
      })
      .addCase(getProfileImagesByUserId.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(getProfileImagesByUserId.fulfilled, (state, action: PayloadAction<Image[]>) => {
        state.status = "succeeded";
        action.payload.forEach((newImage) => {
          const index = state.images.findIndex((img) => img.id === newImage.id);
          if (index !== -1) {
            state.images[index] = newImage;
          } else {
            state.images.push(newImage);
          }
        });
        console.log("🔍 Images de profil mises à jour dans le state:", state.images);
      })
      .addCase(getProfileImagesByUserId.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.log("❌ Erreur dans getProfileImagesByUserId:", state.error);
      })
      .addCase(setProfilePicture.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = null;
      })
      .addCase(setProfilePicture.fulfilled, (state, action: PayloadAction<Image>) => {
        state.status = "succeeded";
        state.images = state.images.map((img) =>
          img.userId === action.payload.userId
            ? { ...img, isProfilePicture: img.id === action.payload.id }
            : img
        );
        state.message = "Photo de profil mise à jour avec succès !";
      })
      .addCase(setProfilePicture.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearImageState, clearImageMessages } = imageSlice.actions;
export default imageSlice.reducer;