import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface GoogleMapsState {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null; // Ajouté pour gérer la ville
  country: string | null; // Ajouté pour gérer le pays
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: GoogleMapsState = {
  address: null,
  latitude: null,
  longitude: null,
  city: null, // Initialisé à null
  country: null, // Initialisé à null
  status: "idle",
  error: null,
};

// Mettre à jour l'adresse via Google Maps
export const updateUserAddress = createAsyncThunk(
  "googleMaps/updateUserAddress",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      console.log("🔹 Updating address for user ID:", userId);
      const response = await axios.put(
        `${BASE_URL}/api/google-maps/address/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Address updated successfully:", response.data);
      return {
        address: response.data.address,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        city: response.data.city, // Ajouté pour inclure la ville
        country: response.data.country, // Ajouté pour inclure le pays
      };
    } catch (error: any) {
      console.error("❌ Address update failed:", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to update address");
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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const payload = { latitude, longitude };
      console.log("🔹 Payload envoyé à /api/users/", JSON.stringify(payload, null, 2)); // Loguer le JSON formaté
      const response = await axios.put(
        `${BASE_URL}/api/users/${userId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Géolocalisation mise à jour :", response.data);
      return {
        latitude,
        longitude,
        city: response.data.city, // Ajouté pour inclure la ville
        country: response.data.country, // Ajouté pour inclure le pays
      };
    } catch (error: any) {
      console.error("❌ Update geolocation failed:", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to update geolocation");
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
      state.city = null; // Réinitialisé
      state.country = null; // Réinitialisé
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserAddress.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUserAddress.fulfilled, (state, action: PayloadAction<{ address: string; latitude: number; longitude: number; city: string; country: string }>) => {
        state.status = "succeeded";
        state.address = action.payload.address;
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.city = action.payload.city; // Mettre à jour la ville
        state.country = action.payload.country; // Mettre à jour le pays
      })
      .addCase(updateUserAddress.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateGeolocation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateGeolocation.fulfilled, (state, action: PayloadAction<{ latitude: number; longitude: number; city: string; country: string }>) => {
        state.status = "succeeded";
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.city = action.payload.city; // Mettre à jour la ville
        state.country = action.payload.country; // Mettre à jour le pays
      })
      .addCase(updateGeolocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearGoogleMapsState } = googleMapsSlice.actions;
export default googleMapsSlice.reducer;