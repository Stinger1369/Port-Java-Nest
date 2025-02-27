import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname"; // Import de la configuration de l'URL
import { fetchUser } from "./userSlice"; // Import pour récupérer l'utilisateur après connexion

// Définition du type pour l'état de l'authentification
interface AuthState {
  userId: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// ✅ **État initial**
const initialState: AuthState = {
  userId: localStorage.getItem("userId"), // Stocker l'ID de l'utilisateur
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  message: null,
};

// ✅ **Connexion utilisateur**
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { token, userId } = response.data;

      if (!token || !userId) {
        throw new Error("Login response is missing token or userId");
      }

      console.log("✅ Connexion réussie :", { token, userId });

      // Stockage dans le localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      // Récupérer les données de l'utilisateur après connexion
      dispatch(fetchUser());

      return { token, userId };
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la connexion");
    }
  }
);

// ✅ **Inscription utilisateur**
export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        email,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'inscription");
    }
  }
);

// ✅ **Vérification du code reçu par email**
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify`, { email, code }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("✅ Vérification réussie :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de la vérification :", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la vérification");
    }
  }
);

// ✅ **Demande de réinitialisation du mot de passe**
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email }, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la demande de réinitialisation");
    }
  }
);

// ✅ **Réinitialisation du mot de passe**
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Échec de la réinitialisation du mot de passe";
      if (errorMessage.includes("Ce mot de passe a déjà été utilisé")) {
        return rejectWithValue("⚠️ Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.");
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ **Déconnexion utilisateur**
export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  dispatch(clearAuthState());
  return { message: "Déconnexion réussie" };
});

// ✅ **Création du slice Redux**
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.userId = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.message = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ token: string; userId: string }>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.message = "Connexion réussie !";
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.message = "Inscription réussie ! Vérifiez votre email pour activer votre compte.";
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.message = "Email vérifié avec succès !";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.message = "Un email de réinitialisation a été envoyé.";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.message = "Mot de passe réinitialisé avec succès !";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
        state.userId = null;
        state.message = "Déconnexion réussie !";
      });
  },
});

// ✅ **Exports**
export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;