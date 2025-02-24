import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

// ✅ Interface pour les données météo avec les nouveaux éléments
interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  city: string; // Plus optionnel car maintenant fourni par le backend
  pressure: number;        // Pression atmosphérique (hPa)
  windSpeed: number;       // Vitesse du vent (km/h)
  windDirection: number;   // Direction du vent (degrés)
  feelsLike: number;       // Température ressentie (°C)
  visibility: number;      // Visibilité (mètres)
  sunrise: number;         // Lever du soleil (timestamp UNIX)
  sunset: number;          // Coucher du soleil (timestamp UNIX)
  uvIndex: number;         // Indice UV (0-11+)
}

// ✅ Interface utilisateur mise à jour
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
  latitude?: number;
  longitude?: number;
}

// ✅ État initial Redux mis à jour
interface UserState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
  weather: WeatherData | null;
}

const initialState: UserState = {
  user: null,
  status: "idle",
  error: null,
  message: null,
  weather: null,
};

// ✅ Récupérer l'utilisateur après connexion
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

// ✅ Mettre à jour le profil utilisateur
// Correction : Utiliser PUT au lieu de GET pour la mise à jour
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

// ✅ Supprimer le compte utilisateur
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

// ✅ Récupérer les données météo
export const fetchWeather = createAsyncThunk(
  "user/fetchWeather",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get(`${BASE_URL}/api/users/${userId}/weather`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Données météo brutes reçues de l'API :", response.data);
      console.log("🔹 Ville détectée :", response.data.city);
      return response.data as WeatherData;
    } catch (error: any) {
      console.error("❌ Fetch weather failed:", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch weather");
    }
  }
);

// ✅ Mettre à jour la géolocalisation
export const updateGeolocation = createAsyncThunk(
  "user/updateGeolocation",
  async (
    { userId, latitude, longitude }: { userId: string; latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const payload = { latitude, longitude };
      const response = await axios.put(
        `${BASE_URL}/api/users/${userId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Géolocalisation mise à jour :", response.data);
      return { latitude, longitude };
    } catch (error: any) {
      console.error("❌ Update geolocation failed:", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to update geolocation");
    }
  }
);

// ✅ Création du User Slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.status = "idle";
      state.error = null;
      state.message = null;
      state.weather = null;
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
        state.weather = null;
        localStorage.removeItem("token");
        state.message = "User deleted successfully!";
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchWeather.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWeather.fulfilled, (state, action: PayloadAction<WeatherData>) => {
        state.status = "succeeded";
        state.weather = action.payload;
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateGeolocation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateGeolocation.fulfilled, (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
        state.status = "succeeded";
        if (state.user) {
          state.user.latitude = action.payload.latitude;
          state.user.longitude = action.payload.longitude;
        }
      })
      .addCase(updateGeolocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ Exports
export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;