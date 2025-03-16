// portfolio-frontend/src/redux/features/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "../../axiosConfig";
import { BASE_URL } from "../../config/hostname";
import { fetchUser } from "./userSlice";
import i18n from "../../i18n";
import { RootState } from "../store"; // Importer RootState

interface AuthState {
  userId: string | null;
  token: string | null; // Alias pour accessToken, conservé pour compatibilité
  accessToken: string | null; // Token d'accès réel
  refreshToken: string | null; // Token de rafraîchissement
  loading: boolean;
  error: string | null;
  message: string | null;
  resendCooldownUntil: number | null;
  remainingMinutes: number | null;
}

const initialState: AuthState = {
  userId: localStorage.getItem("userId"),
  token: localStorage.getItem("accessToken"), // Alias initialisé avec accessToken
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  loading: false,
  error: null,
  message: null,
  resendCooldownUntil: null,
  remainingMinutes: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { accessToken, refreshToken, userId } = response.data;

      if (!accessToken || !refreshToken || !userId) {
        throw new Error("Login response is missing tokens or userId");
      }

      console.log("✅ Connexion réussie :", { accessToken, refreshToken, userId });

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", userId);

      dispatch(fetchUser());

      return { accessToken, refreshToken, userId, message: response.data.message };
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || i18n.t("login.error.generic"));
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, { email, password });
      const cooldownUntil = Date.now() + 15 * 60 * 1000;
      return { ...response.data, resendCooldownUntil: cooldownUntil };
    } catch (error: any) {
      console.error("Erreur backend :", error.response?.data?.error);
      return rejectWithValue(error.response?.data?.error || i18n.t("register.error.generic"));
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (
    { email, code }: { email: string; code: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify`, { email, code });
      console.log("✅ Vérification réussie :", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Échec de la vérification :", error.response?.data?.error || error.message);
      return rejectWithValue(
        error.response?.data?.error || i18n.t("verifyAccount.verificationFailed")
      );
    }
  }
);

export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/resend-verification`, { email });
      console.log("✅ Nouveau code envoyé :", response.data);
      const cooldownUntil = Date.now() + 15 * 60 * 1000;
      return { ...response.data, resendCooldownUntil: cooldownUntil };
    } catch (error: any) {
      console.error("❌ Échec de l'envoi du code :", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || i18n.t("verifyAccount.resendError"));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || i18n.t("forgotPassword.error.generic")
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    { token, newPassword }: { token: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, { token, newPassword });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || i18n.t("resetPassword.error.generic");
      return rejectWithValue(errorMessage);
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    if (!refreshToken) {
      console.warn("❌ Aucun refreshToken trouvé dans le state");
      return rejectWithValue(i18n.t("auth.noRefreshToken"));
    }
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      console.log("✅ Token d'accès rafraîchi avec succès");
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error: any) {
      console.error("❌ Échec du rafraîchissement du token :", error.response?.data?.error || error.message);
      return rejectWithValue(error.response?.data?.error || i18n.t("auth.refreshFailed"));
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    dispatch(clearAuthState());
    return { message: i18n.t("navbar.logout") };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.userId = null;
      state.token = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
      state.message = null;
      state.resendCooldownUntil = null;
      state.remainingMinutes = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
    },
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; userId: string }>
    ) => {
      state.token = action.payload.accessToken; // Alias pour accessToken
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.userId = action.payload.userId;
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
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
      .addCase(
        login.fulfilled,
        (
          state,
          action: PayloadAction<{ accessToken: string; refreshToken: string; userId: string; message?: string }>
        ) => {
          state.loading = false;
          state.token = action.payload.accessToken; // Alias pour compatibilité
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.userId = action.payload.userId;
          state.message = action.payload.message || i18n.t("login.success");
        }
      )
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
        state.resendCooldownUntil = action.payload.resendCooldownUntil;
        state.remainingMinutes = 15;
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
        state.resendCooldownUntil = action.payload.resendCooldownUntil;
        state.remainingMinutes = 15;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        if (
          state.error.toLowerCase().includes("too many requests") ||
          state.error.toLowerCase().includes("trop de demandes")
        ) {
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
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        refreshToken.fulfilled,
        (
          state,
          action: PayloadAction<{ accessToken: string; refreshToken: string }>
        ) => {
          state.loading = false;
          state.token = action.payload.accessToken; // Mise à jour de l'alias
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.message = i18n.t("auth.tokenRefreshed");
        }
      )
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.token = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userId = null;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userId = null;
        state.message = i18n.t("navbar.logout");
      });
  },
});

export const { clearAuthState, setCredentials } = authSlice.actions;
export default authSlice.reducer;