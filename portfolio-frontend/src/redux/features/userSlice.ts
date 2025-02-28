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

// Fonction utilitaire pour normaliser birthdate
const normalizeBirthdate = (birthdate: any): string => {
  if (!birthdate) return "";
  if (typeof birthdate === "string") {
    // Gérer les formats inattendus comme "1981,3,27"
    if (birthdate.includes(",")) {
      const [year, month, day] = birthdate.split(",");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Gérer le format ISO avec timestamp
    if (birthdate.includes("T")) {
      return birthdate.split("T")[0];
    }
    return birthdate; // Retourner tel quel si déjà au format "yyyy-MM-dd"
  }
  return ""; // Retourner vide si le format est invalide
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

      const normalizedData = {
        ...response.data,
        birthdate: normalizeBirthdate(response.data.birthdate),
      };

      console.log("✅ Utilisateur récupéré :", normalizedData);
      console.log("Sex, Bio, Birthdate, Age et ShowBirthdate reçus du backend:", {
        sex: normalizedData.sex,
        bio: normalizedData.bio,
        birthdate: normalizedData.birthdate,
        age: normalizedData.age,
        showBirthdate: normalizedData.showBirthdate,
      });
      return normalizedData;
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
      return response.data.map((user: any) => ({
        ...user,
        id: user.id || user._id?.$oid,
        birthdate: normalizeBirthdate(user.birthdate),
      }));
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

      const normalizedData = {
        ...response.data,
        id: response.data.id || response.data._id?.$oid,
        birthdate: normalizeBirthdate(response.data.birthdate),
      };

      console.log("✅ Utilisateur récupéré :", normalizedData);
      return normalizedData;
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
        birthdate: normalizeBirthdate(userData.birthdate), // Normaliser avant envoi
        showBirthdate: userData.showBirthdate,
      };

      console.log("🔹 Sending update request for user:", payload);
      console.log("Données envoyées au backend:", JSON.stringify(payload, null, 2));

      const response = await axios.put(`${BASE_URL}/api/users/${userData.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalizedData = {
        ...response.data,
        birthdate: normalizeBirthdate(response.data.birthdate),
      };

      console.log("✅ Update successful:", normalizedData);
      console.log("Phone, City, Country, Birthdate, Age et ShowBirthdate reçus du backend après update:", {
        phone: normalizedData.phone,
        city: normalizedData.city,
        country: normalizedData.country,
        birthdate: normalizedData.birthdate,
        age: normalizedData.age,
        showBirthdate: normalizedData.showBirthdate,
      });
      return normalizedData;
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
      console.error("❌ Delete user failed:", error.response?.data);
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
        state.members = action.payload;
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
        if (index !== -1) {
          state.members[index] = action.payload;
        } else {
          state.members.push(action.payload);
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