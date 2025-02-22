import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ Définition du type Portfolio
interface Portfolio {
  id?: string;
  userId: string;
  isPublic: boolean;
  educations: any[];
  experiences: any[];
  skills: any[];
  projects: any[];
  certifications: any[];
  socialLinks: any[];
  languages: any[];
  recommendations: any[];
  interests: any[];
}

// ✅ État initial Redux
interface PortfolioState {
  portfolio: Portfolio | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  status: "idle",
  error: null,
};

// ✅ Récupérer le token d'authentification
const getAuthToken = () => localStorage.getItem("token");

// ✅ **Récupérer le portfolio par `userId` (Authentifié)**
export const fetchPortfolioByUser = createAsyncThunk(
  "portfolio/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(
        `http://localhost:8080/api/portfolio/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement du portfolio.");
    }
  }
);

// ✅ **Récupérer le portfolio public par `firstName` et `lastName`**
export const fetchPortfolioByUsername = createAsyncThunk(
  "portfolio/fetchByUsername",
  async ({ firstName, lastName }: { firstName: string; lastName: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/portfolio/public/${firstName}/${lastName}`
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Aucun portfolio trouvé.");
    }
  }
);

// ✅ **Mettre à jour le portfolio**
export const updatePortfolio = createAsyncThunk(
  "portfolio/update",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.post(
        `http://localhost:8080/api/portfolio/user/${userId}/update`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du portfolio.");
    }
  }
);

// ✅ **Création du slice Redux**
const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔹 **Récupérer le portfolio par `userId`**
      .addCase(fetchPortfolioByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPortfolioByUser.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolioByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // 🔹 **Récupérer le portfolio par `firstName` et `lastName`**
      .addCase(fetchPortfolioByUsername.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPortfolioByUsername.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolioByUsername.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // 🔹 **Mettre à jour le portfolio**
      .addCase(updatePortfolio.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updatePortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
      })
      .addCase(updatePortfolio.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ **Exports**
export default portfolioSlice.reducer;
