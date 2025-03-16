// portfolio-frontend/src/redux/features/user/userCrud.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../../config/hostname";
import { RootState } from "../../store";
import { User, UserState, normalizeBirthdate } from "./UserTypes";


const initialState: UserCrudState = {
  user: null,
  members: [],
  status: "idle",
  error: null,
  message: null,
};
export const fetchUser = createAsyncThunk(
  "userCrud/fetchUser",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    const userId = state.auth.userId;

    if (!token || !userId) {
      console.warn("❌ Aucun token ou userId trouvé dans le state");
      return rejectWithValue("No token or userId found");
    }

    try {
      console.log("🔹 Récupération de l'utilisateur avec ID:", userId);
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      console.log("🔍 Réponse brute du backend pour fetchUser:", JSON.stringify(data, null, 2));

      const normalizedData: User = {
        id: data.id || (data._id?.$oid ?? data._id),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        sex: data.sex,
        bio: data.bio,
        slug: data.slug,
        latitude: data.latitude,
        longitude: data.longitude,
        birthdate: normalizeBirthdate(data.birthdate),
        age: data.age,
        showBirthdate: data.showBirthdate,
        likedUserIds: data.likedUserIds || [],
        likerUserIds: data.likerUserIds || [],
        imageIds: data.imageIds || [],
        isVerified: data.isVerified || false,
        blockedUserIds: data.blockedUserIds || [],
        chatTheme: ["light", "dark"].includes(data.chatTheme) ? data.chatTheme : "light",
        friendIds: data.friendIds || [],
        friendRequestSentIds: data.friendRequestSentIds || [],
        friendRequestReceivedIds: data.friendRequestReceivedIds || [],
      };

      console.log("🔍 Thème brut reçu du backend:", data.chatTheme);
      console.log("🔍 Thème normalisé envoyé à Redux:", normalizedData.chatTheme);
      console.log("✅ Utilisateur normalisé:", JSON.stringify(normalizedData, null, 2));
      return normalizedData;
    } catch (error: any) {
      console.error("❌ Échec de fetchUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user");
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  "userCrud/fetchAllUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log("🔹 Récupération de tous les utilisateurs...");
      const response = await axios.get(`${BASE_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = response.data.map((user: any) => ({
        ...user,
        id: user.id || (user._id?.$oid ?? user._id),
        birthdate: normalizeBirthdate(user.birthdate),
        likedUserIds: user.likedUserIds || [],
        likerUserIds: user.likerUserIds || [],
        imageIds: user.imageIds || [],
        blockedUserIds: user.blockedUserIds || [],
        friendIds: user.friendIds || [],
        friendRequestSentIds: user.friendRequestSentIds || [],
        friendRequestReceivedIds: user.friendRequestReceivedIds || [],
        isVerified: user.isVerified || false,
        chatTheme: ["light", "dark"].includes(user.chatTheme) ? user.chatTheme : "light",
      }));

      console.log("✅ Liste des utilisateurs récupérée:", users);
      return users;
    } catch (error: any) {
      console.error("❌ Échec de fetchAllUsers:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch all users");
    }
  }
);

export const fetchVerifiedUsers = createAsyncThunk(
  "userCrud/fetchVerifiedUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log("🔹 Récupération des utilisateurs vérifiés...");
      const response = await axios.get(`${BASE_URL}/api/users/verified`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = response.data.map((user: any) => ({
        ...user,
        id: user.id || (user._id?.$oid ?? user._id),
        birthdate: normalizeBirthdate(user.birthdate),
        likedUserIds: user.likedUserIds || [],
        likerUserIds: user.likerUserIds || [],
        imageIds: user.imageIds || [],
        blockedUserIds: user.blockedUserIds || [],
        friendIds: user.friendIds || [],
        friendRequestSentIds: user.friendRequestSentIds || [],
        friendRequestReceivedIds: user.friendRequestReceivedIds || [],
        isVerified: user.isVerified || false,
        chatTheme: ["light", "dark"].includes(user.chatTheme) ? user.chatTheme : "light",
      }));

      console.log("✅ Liste des utilisateurs vérifiés récupérée:", users);
      return users;
    } catch (error: any) {
      console.error("❌ Échec de fetchVerifiedUsers:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch verified users");
    }
  }
);

export const fetchUserById = createAsyncThunk(
  "userCrud/fetchUserById",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      console.log("🔹 Récupération de l'utilisateur avec ID:", userId);
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const normalizedData: User = {
        ...data,
        id: data.id || (data._id?.$oid ?? data._id),
        birthdate: normalizeBirthdate(data.birthdate),
        likedUserIds: data.likedUserIds || [],
        likerUserIds: data.likerUserIds || [],
        imageIds: data.imageIds || [],
        blockedUserIds: data.blockedUserIds || [],
        friendIds: data.friendIds || [],
        friendRequestSentIds: data.friendRequestSentIds || [],
        friendRequestReceivedIds: data.friendRequestReceivedIds || [],
        isVerified: data.isVerified || false,
        chatTheme: ["light", "dark"].includes(data.chatTheme) ? data.chatTheme : "light",
      };

      console.log("✅ Utilisateur récupéré:", normalizedData);
      return normalizedData;
    } catch (error: any) {
      console.error("❌ Échec de fetchUserById:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user");
    }
  }
);

export const updateUser = createAsyncThunk(
  "userCrud/updateUser",
  async (userData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
        return rejectWithValue("No token found");
      }

      const payload: Partial<User> = {
        ...userData,
        phone: userData.phone ? String(userData.phone) : undefined,
        birthdate: userData.birthdate ? normalizeBirthdate(userData.birthdate) : undefined,
        showBirthdate: userData.showBirthdate,
        likedUserIds: userData.likedUserIds,
        likerUserIds: userData.likerUserIds,
        imageIds: userData.imageIds,
        blockedUserIds: userData.blockedUserIds,
        friendIds: userData.friendIds,
        friendRequestSentIds: userData.friendRequestSentIds,
        friendRequestReceivedIds: userData.friendRequestReceivedIds,
        isVerified: userData.isVerified,
        chatTheme: ["light", "dark"].includes(userData.chatTheme || "") ? userData.chatTheme : "light",
      };

      Object.keys(payload).forEach((key) => {
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
        imageIds: data.imageIds || [],
        blockedUserIds: data.blockedUserIds || [],
        friendIds: data.friendIds || [],
        friendRequestSentIds: data.friendRequestSentIds || [],
        friendRequestReceivedIds: data.friendRequestReceivedIds || [],
        isVerified: data.isVerified || false,
        chatTheme: ["light", "dark"].includes(data.chatTheme) ? data.chatTheme : "light",
      };

      console.log("✅ Mise à jour réussie:", normalizedData);
      return normalizedData;
    } catch (error: any) {
      console.error("❌ Échec de updateUser:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to update user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "userCrud/deleteUser",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state");
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

// Reducer
const userCrudSlice = createSlice({
  name: "userCrud",
  initialState,
  reducers: {},
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
      .addCase(fetchVerifiedUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchVerifiedUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.members = action.payload;
        state.error = null;
      })
      .addCase(fetchVerifiedUsers.rejected, (state, action) => {
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
        state.message = "Utilisateur supprimé avec succès !";
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const userCrudReducer = userCrudSlice.reducer;