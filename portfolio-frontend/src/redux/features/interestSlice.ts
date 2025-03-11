import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Interest {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean; // Aligné avec le backend
}

interface InterestState {
  interests: Interest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: InterestState = {
  interests: [],
  status: "idle",
  error: null,
};

const getAuthToken = () => localStorage.getItem("token");

export const fetchInterestsByUser = createAsyncThunk(
  "interest/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<Interest[]>(
        `${BASE_URL}/api/interests/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des centres d’intérêt.");
    }
  }
);

export const addInterest = createAsyncThunk(
  "interest/add",
  async (interestData: Omit<Interest, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post<Interest>(
        `${BASE_URL}/api/interests`,
        { ...interestData, userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du centre d’intérêt.");
    }
  }
);

export const updateInterest = createAsyncThunk(
  "interest/update",
  async ({ id, interestData }: { id: string; interestData: Partial<Interest> }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put<Interest>(
        `${BASE_URL}/api/interests/${id}`,
        interestData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du centre d’intérêt.");
    }
  }
);

export const deleteInterest = createAsyncThunk(
  "interest/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(
        `${BASE_URL}/api/interests/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du centre d’intérêt.");
    }
  }
);

const interestSlice = createSlice({
  name: "interest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterestsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInterestsByUser.fulfilled, (state, action: PayloadAction<Interest[]>) => {
        state.status = "succeeded";
        state.interests = action.payload;
      })
      .addCase(fetchInterestsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addInterest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addInterest.fulfilled, (state, action: PayloadAction<Interest>) => {
        state.status = "succeeded";
        state.interests.push(action.payload);
      })
      .addCase(addInterest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateInterest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateInterest.fulfilled, (state, action: PayloadAction<Interest>) => {
        state.status = "succeeded";
        state.interests = state.interests.map((interest) =>
          interest.id === action.payload.id ? action.payload : interest
        );
      })
      .addCase(updateInterest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteInterest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteInterest.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.interests = state.interests.filter((interest) => interest.id !== action.payload);
      })
      .addCase(deleteInterest.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default interestSlice.reducer;