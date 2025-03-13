import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "../../axiosConfig";
import { BASE_URL } from "../../config/hostname";
import { fetchUser } from "./userSlice";
import i18n from "../../i18n";

// Définition du type pour l'état de l'authentification
interface AuthState {
  userId: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  resendCooldownUntil: number | null; // Timestamp (ms) jusqu'à quand le renvoi est bloqué
  remainingMinutes: number | null; // Minutes restantes avant de pouvoir renvoyer
}

// État initial
const initialState: AuthState = {
  userId: localStorage.getItem("userId"),
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  message: null,
  resendCooldownUntil: null,
  remainingMinutes: null,
};

// Connexion utilisateur
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { token, userId } = response.data;

      if (!token || !userId) {
        throw new Error("Login response is missing token or userId");
      }

      console.log("✅ Connexion réussie :", { token, userId });

      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      dispatch(fetchUser());

      return { token, userId, message: response.data.message };
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || i18n.t("login.error.generic"));
    }
  }
);

// Inscription utilisateur
export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, { email, password });
      // Après une inscription réussie, désactiver le renvoi pendant 15 minutes
      const cooldownUntil = Date.now() + 15 * 60 * 1000; // 15 minutes en millisecondes
      return { ...response.data, resendCooldownUntil: cooldownUntil };
    } catch (error: any) {
      console.error("Erreur backend :", error.response?.data?.error);
      return rejectWithValue(error.response?.data?.error || i18n.t("register.error.generic"));
    }
  }
);

// Vérification du code reçu par email
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify`, { email, code });
      console.log("✅ Vérification réussie :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de la vérification :", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || i18n.t("verifyAccount.verificationFailed"));
    }
  }
);

// Renvoyer un nouveau code de vérification
export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/resend-verification`, { email });
      console.log("✅ Nouveau code envoyé :", response.data);
      // Désactiver le renvoi pendant 15 minutes après un succès
      const cooldownUntil = Date.now() + 15 * 60 * 1000; // 15 minutes en millisecondes
      return { ...response.data, resendCooldownUntil: cooldownUntil };
    } catch (error: any) {
      console.error("❌ Échec de l'envoi du code :", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || i18n.t("verifyAccount.resendError"));
    }
  }
);

// Demande de réinitialisation du mot de passe
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || i18n.t("forgotPassword.error.generic"));
    }
  }
);

// Réinitialisation du mot de passe
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, { token, newPassword });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || i18n.t("resetPassword.error.generic");
      return rejectWithValue(errorMessage);
    }
  }
);

// Déconnexion utilisateur
export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  dispatch(clearAuthState());
  return { message: i18n.t("navbar.logout") };
});

// Création du slice Redux
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
      state.resendCooldownUntil = null; // Réinitialiser le cooldown lors de la déconnexion
      state.remainingMinutes = null;
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
      .addCase(login.fulfilled, (state, action: PayloadAction<{ token: string; userId: string; message?: string }>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.message = action.payload.message || i18n.t("login.success", "Connexion réussie !");
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
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || i18n.t("register.success");
        state.resendCooldownUntil = action.payload.resendCooldownUntil; // Synchroniser le cooldown
        state.remainingMinutes = 15; // Initialisé à 15 minutes après inscription
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
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || i18n.t("verifyAccount.success");
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resendVerificationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resendVerificationCode.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || i18n.t("verifyAccount.resendSuccess");
        state.resendCooldownUntil = action.payload.resendCooldownUntil; // Mettre à jour le cooldown
        state.remainingMinutes = 15; // Initialisé à 15 minutes après renvoi
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        if (state.error.toLowerCase().includes("too many requests") || state.error.toLowerCase().includes("trop de demandes")) {
          const match = state.error.match(/(\d+)/);
          const minutes = match ? parseInt(match[0], 10) : 15;
          state.resendCooldownUntil = Date.now() + minutes * 60 * 1000;
          state.remainingMinutes = minutes;
        }
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || i18n.t("forgotPassword.success");
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
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || i18n.t("resetPassword.success");
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
        state.userId = null;
        state.message = i18n.t("navbar.logout");
      });
  },
});

// Exports
export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;