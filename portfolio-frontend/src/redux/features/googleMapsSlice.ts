import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface GoogleMapsState {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: GoogleMapsState = {
  address: null,
  latitude: null,
  longitude: null,
  city: null,
  country: null,
  status: "idle",
  error: null,
};

// Fonction pour récupérer le token stocké
const getAuthToken = () => localStorage.getItem("token");

// Mettre à jour l'adresse via Google Maps
export const updateUserAddress = createAsyncThunk(
  "googleMaps/updateUserAddress",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      console.log(`🔹 Mise à jour de l'adresse pour l'utilisateur ${userId}`);
      const response = await axios.put(
        `${BASE_URL}/api/google-maps/address/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      const data = response.data;
      console.log("✅ Réponse de updateUserAddress:", data);

      // S'assurer que tous les champs attendus sont présents
      if (!data.address || data.latitude == null || data.longitude == null || !data.city || !data.country) {
        console.error("⚠️ Réponse incomplète de updateUserAddress:", data);
        return rejectWithValue("Réponse incomplète du serveur pour la mise à jour de l'adresse.");
      }

      return {
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country,
      };
    } catch (error: any) {
      console.error("❌ Échec de updateUserAddress:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de l'adresse.");
    }
  }
);

// Mettre à jour la géolocalisation
export const updateGeolocation = createAsyncThunk(
  "googleMaps/updateGeolocation",
  async (
    { userId, latitude, longitude }: { userId: string; latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("❌ Aucun token trouvé dans localStorage");
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      console.log(`🔹 Mise à jour de la géolocalisation pour l'utilisateur ${userId}:`, { latitude, longitude });
      const response = await axios.put(
        `${BASE_URL}/api/users/${userId}`,
        { latitude, longitude },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      const data = response.data;
      console.log("✅ Réponse de updateGeolocation:", data);

      // S'assurer que les champs city et country sont présents
      return {
        address: data.address || null, // L'adresse peut être absente si elle n'est pas mise à jour ici
        latitude,
        longitude,
        city: data.city || null,
        country: data.country || null,
      };
    } catch (error: any) {
      console.error("❌ Échec de updateGeolocation:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la géolocalisation.");
    }
  }
);

const googleMapsSlice = createSlice({
  name: "googleMaps",
  initialState,
  reducers: {
    clearGoogleMapsState: (state) => {
      state.address = null;
      state.latitude = null;
      state.longitude = null;
      state.city = null;
      state.country = null;
      state.status = "idle";
      state.error = null;
      console.log("🔍 État GoogleMaps réinitialisé");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserAddress.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateUserAddress.fulfilled,
        (state, action: PayloadAction<{ address: string; latitude: number; longitude: number; city: string; country: string }>) => {
          state.status = "succeeded";
          state.address = action.payload.address;
          state.latitude = action.payload.latitude;
          state.longitude = action.payload.longitude;
          state.city = action.payload.city;
          state.country = action.payload.country;
          state.error = null;
        }
      )
      .addCase(updateUserAddress.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateGeolocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateGeolocation.fulfilled,
        (state, action: PayloadAction<{ address: string | null; latitude: number; longitude: number; city: string | null; country: string | null }>) => {
          state.status = "succeeded";
          state.address = action.payload.address ?? state.address; // Conserver l'adresse actuelle si non fournie
          state.latitude = action.payload.latitude;
          state.longitude = action.payload.longitude;
          state.city = action.payload.city ?? state.city; // Conserver la ville actuelle si non fournie
          state.country = action.payload.country ?? state.country; // Conserver le pays actuel si non fourni
          state.error = null;
        }
      )
      .addCase(updateGeolocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearGoogleMapsState } = googleMapsSlice.actions;
export default googleMapsSlice.reducer;