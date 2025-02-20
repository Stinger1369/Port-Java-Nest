import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

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

// ✅ **Récupérer les informations de l'utilisateur connecté**
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get("http://localhost:8080/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error: any) {
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

      const response = await axios.put(`http://localhost:8080/api/users/${userData.id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error: any) {
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
