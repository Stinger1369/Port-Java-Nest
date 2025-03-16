// portfolio-frontend/src/redux/features/weatherSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  city: string;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  feelsLike: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  uvIndex: number;
}

interface WeatherState {
  weather: WeatherData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: WeatherState = {
  weather: null,
  status: "idle",
  error: null,
};

// Récupérer les données météo
export const fetchWeather = createAsyncThunk(
  "weather/fetchWeather",
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any; // Récupère l'état Redux
      const token = state.auth.token; // Accès correct au token via getState()
      if (!token) {
        console.warn("❌ Aucun token trouvé dans le state Redux");
        return rejectWithValue("No token found");
      }

      // Vérifier les coordonnées dans le state Redux
      const user = state.user.user;
      if (!user?.latitude || !user?.longitude) {
        console.warn("⚠️ Coordonnées de géolocalisation manquantes pour l'utilisateur:", userId);
        return rejectWithValue("Missing geolocation coordinates");
      }

      console.log("🔹 Récupération des données météo pour :", userId);
      const response = await axios.get(`${BASE_URL}/api/weather/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Données météo récupérées pour la ville :", response.data.city);
      return response.data as WeatherData;
    } catch (error: any) {
      console.error("❌ Fetch weather failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch weather");
    }
  }
);

const weatherSlice = createSlice({
  name: "weather",
  initialState,
  reducers: {
    clearWeatherState: (state) => {
      state.weather = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { clearWeatherState } = weatherSlice.actions;
export default weatherSlice.reducer;