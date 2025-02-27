import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname"; // Import de la configuration de l'URL

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

// ✅ **Fonction pour récupérer le token stocké**
const getAuthToken = () => localStorage.getItem("token");

// ✅ **Mettre à jour l'adresse via Google Maps**
export const updateUserAddress = createAsyncThunk(
  "googleMaps/updateUserAddress",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put(
        `${BASE_URL}/api/google-maps/address/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      return {
        address: response.data.address,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        city: response.data.city, // Inclure la ville
        country: response.data.country, // Inclure le pays
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de l'adresse.");
    }
  }
);

// ✅ **Mettre à jour la géolocalisation**
export const updateGeolocation = createAsyncThunk(
  "googleMaps/updateGeolocation",
  async (
    { userId, latitude, longitude }: { userId: string; latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      }

      const response = await axios.put(
        `${BASE_URL}/api/users/${userId}`,
        { latitude, longitude },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      return {
        latitude,
        longitude,
        city: response.data.city, // Inclure la ville
        country: response.data.country, // Inclure le pays
      };
    } catch (error: any) {
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserAddress.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateUserAddress.fulfilled, (state, action: PayloadAction<{
        address: string;
        latitude: number;
        longitude: number;
        city: string;
        country: string;
      }>) => {
        state.status = "succeeded";
        state.address = action.payload.address;
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.city = action.payload.city;
        state.country = action.payload.country;
      })
      .addCase(updateUserAddress.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateGeolocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateGeolocation.fulfilled, (state, action: PayloadAction<{
        latitude: number;
        longitude: number;
        city: string;
        country: string;
      }>) => {
        state.status = "succeeded";
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.city = action.payload.city;
        state.country = action.payload.country;
      })
      .addCase(updateGeolocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearGoogleMapsState } = googleMapsSlice.actions;
export default googleMapsSlice.reducer;