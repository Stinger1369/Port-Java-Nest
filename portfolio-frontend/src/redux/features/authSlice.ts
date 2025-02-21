import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
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
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });

      console.log("📥 Réponse brute du serveur :", response.data);

      const { token, userId } = response.data;

      if (!token || !userId) {
        throw new Error("Login response is missing token or userId");
      }

      // Plus besoin de vérifier `verified` ici, le backend s'en charge
      console.log("✅ Connexion réussie :", { token, userId });

      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      dispatch(fetchUser());

      return { token, userId };
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);


// ✅ **Inscription utilisateur**
export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password }: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/register", {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Registration failed");
    }
  }
);

// ✅ **Vérification du code reçu par email**
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/verify", { email, code });

      console.log("✅ Vérification réussie :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de la vérification :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec de la vérification.");
    }
  }
);

// ✅ **Demande de réinitialisation du mot de passe**
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }: { email: string }, thunkAPI) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/forgot-password", {
        email,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Password reset request failed");
    }
  }
);

// ✅ **Réinitialisation du mot de passe avec vérification des anciens mots de passe**
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }: { token: string; newPassword: string }, thunkAPI) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/reset-password", {
        token,
        newPassword,
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Password reset failed";

      // Vérification si le message d'erreur concerne un ancien mot de passe déjà utilisé
      if (errorMessage.includes("Ce mot de passe a déjà été utilisé")) {
        return thunkAPI.rejectWithValue("⚠️ Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.");
      }

      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ **Déconnexion utilisateur**
export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  console.log("🚪 Déconnexion...");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  dispatch(clearAuthState());
});

// ✅ **Déconnexion automatique après une période d'inactivité**
const setAutoLogout = (dispatch: any, delay: number) => {
  setTimeout(() => {
    dispatch(logout());
  }, delay);
};

// ✅ **Création du slice Redux**
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      console.log("🧹 Nettoyage de l'état utilisateur");
      state.userId = null;
      state.token = null;
      state.message = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    },
    loginSuccess: (state, action: PayloadAction<{ token: string; userId: string }>) => {
      console.log("🔄 Stockage réussi :", action.payload);
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("userId", action.payload.userId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("✅ Connexion Redux réussie :", action.payload);
        state.loading = false;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.message = "Login successful!";
      })
      .addCase(login.rejected, (state, action) => {
        console.error("❌ Connexion échouée :", action.payload);
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
        state.message = "Registration successful! Please verify your email.";
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
        state.message = "Account verified successfully!";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
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
        state.message = "Password reset successful! Please log in again.";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(logout.fulfilled, (state) => {
        console.log("✅ Déconnexion réussie");
        state.token = null;
        state.userId = null;
        state.message = "Logged out successfully!";
      });
  },
});

// ✅ **Exports**
export const { clearAuthState, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
