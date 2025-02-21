import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../../redux/store"; // Assure-toi que le chemin est correct

// Interface utilisateur
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  gender?: string;
  bio?: string;
}

// État initial de Redux
interface UserState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
}

// État initial
const initialState: UserState = {
  user: null,
  status: "idle",
  error: null,
  message: null,
};
// ✅ **Récupérer l'utilisateur après connexion**
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

      const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Vérifier si l'utilisateur a des données
      if (!response.data) {
        console.warn("⚠️ L'utilisateur n'a pas encore complété son profil.");
        return rejectWithValue("User profile is incomplete");
      }

      console.log("✅ Utilisateur récupéré :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Fetch user failed:", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user");
    }
  }
);



// ✅ **Mettre à jour le profil utilisateur**
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      console.log("🔹 Sending update request for user:", userData);

      const response = await axios.put(`http://localhost:8080/api/users/${userData.id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Update successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Update failed:", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to update user");
    }
  }
);

// ✅ **Supprimer le compte utilisateur**
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      await axios.delete(`http://localhost:8080/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete user");
    }
  }
);

// ✅ **Création du User Slice**
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.status = "idle";
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 **Récupérer l'utilisateur**
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

      // 🔹 **Mettre à jour l'utilisateur**
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

      // 🔹 **Supprimer l'utilisateur**
      .addCase(deleteUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
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

// ✅ **Exports**
export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
