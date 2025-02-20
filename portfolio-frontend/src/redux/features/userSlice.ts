import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
}

interface UserState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: UserState = {
  user: null,
  status: "idle",
};

// 🔹 Action pour récupérer l'utilisateur connecté
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return rejectWithValue("No token found");
    }

    try {
      const response = await fetch("http://localhost:8080/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return rejectWithValue("Failed to fetch user");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default userSlice.reducer;
