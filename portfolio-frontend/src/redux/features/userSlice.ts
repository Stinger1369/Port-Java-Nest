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
  sex?: "Man" | "Woman" | "Other" | "";
  bio?: string;
  slug?: string;
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

      console.log("🔹 Fetching user with ID:", userId);

      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data) {
        console.warn("⚠️ L'utilisateur n'a pas encore complété son profil.");
        return rejectWithValue("User profile is incomplete");
      }

      console.log("✅ Utilisateur récupéré :", response.data);
      console.log("Phone reçu du backend:", response.data.phone);
      return response.data;
    } catch (error: any) {
      console.error("❌ Fetch user failed:", error.response?.data);
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

      console.log("🔹 Fetching all users...");
      const response = await axios.get(`${BASE_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Liste des utilisateurs récupérée :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Fetch all users failed:", error.response?.data);
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

      console.log("🔹 Fetching user with ID:", userId);
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Utilisateur récupéré :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Fetch user by ID failed:", error.response?.data);
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
      if (!token) throw new Error("No token found");

      const payload = {
        ...userData,
        phone: userData.phone ? String(userData.phone) : undefined,
      };

      console.log("🔹 Sending update request for user:", payload);
      console.log("Données envoyées au backend:", JSON.stringify(payload));

      const response = await axios.put(
        `${BASE_URL}/api/users/${userData.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Update successful:", response.data);
      console.log("Phone reçu du backend après update:", response.data.phone);
      return response.data;
    } catch (error: any) {
      console.error("❌ Update failed:", error.response?.data);
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
      if (!token) throw new Error("No token found");

      await axios.delete(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete user");
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.members = action.payload.map((user) => ({
          ...user,
          id: user.id || user._id.$oid, // Normalisation de l'ID MongoDB
        }));
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        const normalizedUser = {
          ...action.payload,
          id: action.payload.id || action.payload._id.$oid, // Normalisation de l'ID MongoDB
        };
        if (index !== -1) {
          state.members[index] = normalizedUser;
        } else {
          state.members.push(normalizedUser);
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.message = "User updated successfully!";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.status = "succeeded";
        state.user = null;
        localStorage.removeItem("token");
        state.message = "User deleted successfully!";
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;