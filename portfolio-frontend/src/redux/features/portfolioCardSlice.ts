// src/redux/features/portfolioCardSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";
import { RootState } from "../store"; // Importer RootState

interface PortfolioCard {
  section: string;
  position: number;
  size: string;
  shape: string;
}

interface PortfolioCardState {
  cards: PortfolioCard[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PortfolioCardState = {
  cards: [],
  status: "idle",
  error: null,
};

export const customizePortfolioCards = createAsyncThunk(
  "portfolioCard/customize",
  async (
    { userId, preferences }: { userId: string; preferences: PortfolioCard[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.post<PortfolioCard[]>(
        `${BASE_URL}/api/portfolio/cards/user/${userId}/customize`,
        preferences,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.status === 404
          ? "Portfolio non trouvé pour personnalisation."
          : error.response?.data?.error || "Échec de la personnalisation des cartes.";
      return rejectWithValue(message);
    }
  }
);

const portfolioCardSlice = createSlice({
  name: "portfolioCard",
  initialState,
  reducers: {
    setCards: (state, action: PayloadAction<PortfolioCard[]>) => {
      state.cards = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(customizePortfolioCards.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(customizePortfolioCards.fulfilled, (state, action: PayloadAction<PortfolioCard[]>) => {
        state.status = "succeeded";
        state.cards = action.payload;
      })
      .addCase(customizePortfolioCards.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { setCards } = portfolioCardSlice.actions;
export default portfolioCardSlice.reducer;