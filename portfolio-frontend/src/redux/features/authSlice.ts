import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Définition du type pour l'état de l'authentification
interface AuthState {
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// État initial
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  message: null,
};

// ✅ **Connexion utilisateur**
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Login failed");
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

// ✅ **Vérification de l'email**
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, code }: { email: string; code: string }, thunkAPI) => {
    try {
      const response = await axios.post("http://localhost:8080/api/auth/verify", {
        email,
        code,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Verification failed");
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

// ✅ **Création du slice Redux**
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.message = null;
      localStorage.removeItem("token");
    },
    loginSuccess: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token);
    },
  },
  extraReducers: (builder) => {
    builder
      // 📌 **Gestion de l'état de connexion**
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.message = "Login successful!";
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // 📌 **Gestion de l'état d'inscription**
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Registration successful! Please verify your email.";
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // 📌 **Vérification de l'email**
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

      // 📌 **Demande de réinitialisation du mot de passe**
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Password reset link sent!";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // 📌 **Réinitialisation du mot de passe avec vérification**
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
      });
  },
});

// ✅ **Exports**
export const { logout, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
