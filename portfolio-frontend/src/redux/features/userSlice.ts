import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  sex?: "Man" | "Woman" | "Other" | "";
  bio?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  birthdate?: string;
  age?: number;
  showBirthdate?: boolean;
  likedUserIds?: string[];
  likerUserIds?: string[];
}

interface UserState {
  user: User | null;
  members: User[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
}

const initialState: UserState = {
  user: null,
  members: [],
  status: "idle",
  error: null,
  message: null,
};

// Fonction utilitaire pour normaliser birthdate (simplifiée)
const normalizeBirthdate = (birthdate: any): string | undefined => {
  if (!birthdate) return undefined;
  if (typeof birthdate === "string") {
    // Le backend renvoie une chaîne ISO (ex: "2025-03-03")
    return birthdate.split("T")[0]; // Supprime l'heure si présente
  }
  console.warn("⚠️ Format de birthdate inattendu:", birthdate);
  return undefined;
};

// Récupérer l'utilisateur après connexion
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        console.warn("❌ Aucun token ou userId trouvé dans localStorage");
        return rejectWithValue("No token or userId found");
      }

      console.log("🔹 Récupération de l'utilisateur avec ID:", userId);
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      if (!data) {
        console.warn("⚠️ L'utilisateur n'a pas encore complété son profil.");
        return rejectWithValue("User profile is incomplete");
      }

      const normalizedData: User = {
        ...data,
        birthdate: normalizeBirthdate(data.birthdate),
        id: data.id || data._id?.$oid,
        likedUserIds: data.likedUserIds || [],
        likerUserIds: data.likerUserIds || [],
      };

      console.log("✅ Utilisateur récupéré:", normalizedData);
      console.log("Sex, Bio, Birthdate, Age, ShowBirthdate, Likes reçus du backend:", {
        sex: normalizedData.sex,
        bio: normalizedData.bio,
        birthdate: normalizedData.birthdate,
        age: normalizedData.age,
        showBirthdate: normalizedData.showBirthdate,
        likedUserIds: normalizedData.likedUserIds,
        likerUserIds: normalizedData.likerUserIds,
      });
      return normalizedData;
    } catch (error: any) {
      console.error("❌ Échec de fetchUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user");
    }
  }
);

// Récupérer tous les utilisateurs
export const fetchAllUsers = createAsyncThunk(
  "user/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("No token found");
      }

      console.log("🔹 Récupération de tous les utilisateurs...");
      const response = await axios.get(`${BASE_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = response.data.map((user: any) => ({
        ...user,
        id: user.id || user._id?.$oid,
        birthdate: normalizeBirthdate(user.birthdate),
        likedUserIds: user.likedUserIds || [],
        likerUserIds: user.likerUserIds || [],
      }));

      console.log("✅ Liste des utilisateurs récupérée:", users);
      return users;
    } catch (error: any) {
      console.error("❌ Échec de fetchAllUsers:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch all users");
    }
  }
);

// Récupérer un utilisateur spécifique par ID
export const fetchUserById = createAsyncThunk(
  "user/fetchUserById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("No token found");
      }

      console.log("🔹 Récupération de l'utilisateur avec ID:", userId);
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const normalizedData: User = {
        ...data,
        id: data.id || data._id?.$oid,
        birthdate: normalizeBirthdate(data.birthdate),
        likedUserIds: data.likedUserIds || [],
        likerUserIds: data.likerUserIds || [],
      };

      console.log("✅ Utilisateur récupéré:", normalizedData);
      return normalizedData;
    } catch (error: any) {
      console.error("❌ Échec de fetchUserById:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user");
    }
  }
);

// Mettre à jour le profil utilisateur
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("No token found");
      }

      // Nettoyer les données avant de les envoyer
      const payload: Partial<User> = {
        ...userData,
        phone: userData.phone ? String(userData.phone) : undefined,
        birthdate: userData.birthdate ? normalizeBirthdate(userData.birthdate) : undefined,
        showBirthdate: userData.showBirthdate,
        likedUserIds: userData.likedUserIds,
        likerUserIds: userData.likerUserIds,
      };

      // Supprimer les champs indéfinis ou null pour éviter d'envoyer des données inutiles
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof Partial<User>] === undefined || payload[key as keyof Partial<User>] === null) {
          delete payload[key as keyof Partial<User>];
        }
      });

      console.log("🔹 Envoi de la requête de mise à jour pour l'utilisateur:", payload);
      const response = await axios.put(`${BASE_URL}/api/users/${userData.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const normalizedData: User = {
        ...data,
        birthdate: normalizeBirthdate(data.birthdate),
        likedUserIds: data.likedUserIds || [],
        likerUserIds: data.likerUserIds || [],
      };

      console.log("✅ Mise à jour réussie:", normalizedData);
      console.log("Phone, City, Country, Birthdate, Age, ShowBirthdate, Likes reçus du backend après update:", {
        phone: normalizedData.phone,
        city: normalizedData.city,
        country: normalizedData.country,
        birthdate: normalizedData.birthdate,
        age: normalizedData.age,
        showBirthdate: normalizedData.showBirthdate,
        likedUserIds: normalizedData.likedUserIds,
        likerUserIds: normalizedData.likerUserIds,
      });
      return normalizedData;
    } catch (error: any) {
      console.error("❌ Échec de updateUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to update user");
    }
  }
);

// Supprimer le compte utilisateur
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Suppression de l'utilisateur avec ID: ${userId}`);
      await axios.delete(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Utilisateur supprimé avec succès");
      return userId;
    } catch (error: any) {
      console.error("❌ Échec de deleteUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to delete user");
    }
  }
);

// Liker un utilisateur
export const likeUser = createAsyncThunk(
  "user/likeUser",
  async ({ likerId, likedId }: { likerId: string; likedId: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Liking user ${likedId} by ${likerId}`);
      await axios.post(`${BASE_URL}/api/users/${likerId}/like/${likedId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ User ${likedId} liked by ${likerId}`);
      return { likerId, likedId };
    } catch (error: any) {
      console.error("❌ Échec de likeUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to like user");
    }
  }
);

// Retirer un "like" d'un utilisateur
export const unlikeUser = createAsyncThunk(
  "user/unlikeUser",
  async ({ likerId, likedId }: { likerId: string; likedId: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("No token found");
      }

      console.log(`🔹 Unliking user ${likedId} by ${likerId}`);
      await axios.delete(`${BASE_URL}/api/users/${likerId}/unlike/${likedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ User ${likedId} unliked by ${likerId}`);
      return { likerId, likedId };
    } catch (error: any) {
      console.error("❌ Échec de unlikeUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to unlike user");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.members = [];
      state.status = "idle";
      state.error = null;
      state.message = null;
      console.log("🔍 État utilisateur réinitialisé");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.members = action.payload;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        } else {
          state.members.push(action.payload);
        }
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.message = "Utilisateur mis à jour avec succès !";
        // Mettre à jour dans members si l'utilisateur est présent
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.status = "succeeded";
        state.user = null;
        state.members = [];
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        state.message = "Utilisateur supprimé avec succès !";
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(likeUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(likeUser.fulfilled, (state, action: PayloadAction<{ likerId: string; likedId: string }>) => {
        state.status = "succeeded";
        const { likerId, likedId } = action.payload;

        // Mise à jour de l'utilisateur connecté (liker)
        if (state.user && state.user.id === likerId) {
          state.user.likedUserIds = state.user.likedUserIds || [];
          if (!state.user.likedUserIds.includes(likedId)) {
            state.user.likedUserIds.push(likedId);
          }
        }

        // Mise à jour dans la liste des membres
        const likerIndex = state.members.findIndex((m) => m.id === likerId);
        if (likerIndex !== -1) {
          state.members[likerIndex].likedUserIds = state.members[likerIndex].likedUserIds || [];
          if (!state.members[likerIndex].likedUserIds!.includes(likedId)) {
            state.members[likerIndex].likedUserIds!.push(likedId);
          }
        }

        const likedIndex = state.members.findIndex((m) => m.id === likedId);
        if (likedIndex !== -1) {
          state.members[likedIndex].likerUserIds = state.members[likedIndex].likerUserIds || [];
          if (!state.members[likedIndex].likerUserIds!.includes(likerId)) {
            state.members[likedIndex].likerUserIds!.push(likerId);
          }
        }

        state.message = "Utilisateur liké avec succès !";
        state.error = null;
      })
      .addCase(likeUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(unlikeUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(unlikeUser.fulfilled, (state, action: PayloadAction<{ likerId: string; likedId: string }>) => {
        state.status = "succeeded";
        const { likerId, likedId } = action.payload;

        // Mise à jour de l'utilisateur connecté (liker)
        if (state.user && state.user.id === likerId) {
          state.user.likedUserIds = state.user.likedUserIds?.filter((id) => id !== likedId) || [];
        }

        // Mise à jour dans la liste des membres
        const likerIndex = state.members.findIndex((m) => m.id === likerId);
        if (likerIndex !== -1) {
          state.members[likerIndex].likedUserIds = state.members[likerIndex].likedUserIds?.filter((id) => id !== likedId) || [];
        }

        const likedIndex = state.members.findIndex((m) => m.id === likedId);
        if (likedIndex !== -1) {
          state.members[likedIndex].likerUserIds = state.members[likedIndex].likerUserIds?.filter((id) => id !== likerId) || [];
        }

        state.message = "Like retiré avec succès !";
        state.error = null;
      })
      .addCase(unlikeUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;