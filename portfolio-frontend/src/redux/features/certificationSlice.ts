import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Certification {
  id?: string;
  userId: string;
  name: string;
  organization: string;
  dateObtained: string;
  expirationDate?: string | null;
  doesNotExpire: boolean;
  credentialId?: string;
  credentialUrl?: string;
  isPublic?: boolean; // Ajouté
}

interface CertificationState {
  certifications: Certification[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CertificationState = {
  certifications: [],
  status: "idle",
  error: null,
};

const getAuthToken = () => localStorage.getItem("token");

export const fetchCertificationsByUser = createAsyncThunk(
  "certification/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`${BASE_URL}/api/certifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.map((cert: any) => ({
        id: cert._id?.$oid || cert.id || "",
        userId: cert.userId || "",
        name: cert.name || "Sans nom",
        organization: cert.organization || "Inconnu",
        dateObtained: cert.dateObtained?.$date || cert.dateObtained || "",
        expirationDate: cert.expirationDate?.$date || cert.expirationDate || null,
        doesNotExpire: cert.doesNotExpire ?? false,
        credentialId: cert.credentialId || "",
        credentialUrl: cert.credentialUrl || "",
        isPublic: cert.isPublic ?? false, // Ajouté
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des certifications.");
    }
  }
);

export const addCertification = createAsyncThunk(
  "certification/add",
  async (certificationData: Omit<Certification, "id" | "userId">, { rejectWithValue, getState }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        `${BASE_URL}/api/certifications`,
        { ...certificationData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        id: response.data._id?.$oid || response.data.id || "",
        userId: response.data.userId || "",
        name: response.data.name || "Sans nom",
        organization: response.data.organization || "Inconnu",
        dateObtained: response.data.dateObtained?.$date || response.data.dateObtained || "",
        expirationDate: response.data.expirationDate?.$date || response.data.expirationDate || null,
        doesNotExpire: response.data.doesNotExpire ?? false,
        credentialId: response.data.credentialId || "",
        credentialUrl: response.data.credentialUrl || "",
        isPublic: response.data.isPublic ?? false, // Ajouté
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la certification.");
    }
  }
);

export const updateCertification = createAsyncThunk(
  "certification/update",
  async ({ id, certificationData }: { id: string; certificationData: Partial<Certification> }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `${BASE_URL}/api/certifications/${id}`,
        certificationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        id: response.data._id?.$oid || response.data.id || "",
        userId: response.data.userId || "",
        name: response.data.name || "Sans nom",
        organization: response.data.organization || "Inconnu",
        dateObtained: response.data.dateObtained?.$date || response.data.dateObtained || "",
        expirationDate: response.data.expirationDate?.$date || response.data.expirationDate || null,
        doesNotExpire: response.data.doesNotExpire ?? false,
        credentialId: response.data.credentialId || "",
        credentialUrl: response.data.credentialUrl || "",
        isPublic: response.data.isPublic ?? false, // Ajouté
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la certification.");
    }
  }
);

export const deleteCertification = createAsyncThunk(
  "certification/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`${BASE_URL}/api/certifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la certification.");
    }
  }
);

const certificationSlice = createSlice({
  name: "certification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCertificationsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCertificationsByUser.fulfilled, (state, action: PayloadAction<Certification[]>) => {
        state.status = "succeeded";
        state.certifications = action.payload;
      })
      .addCase(fetchCertificationsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addCertification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addCertification.fulfilled, (state, action: PayloadAction<Certification>) => {
        state.status = "succeeded";
        state.certifications.push(action.payload);
      })
      .addCase(addCertification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateCertification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCertification.fulfilled, (state, action: PayloadAction<Certification>) => {
        state.status = "succeeded";
        state.certifications = state.certifications.map((cert) =>
          cert.id === action.payload.id ? action.payload : cert
        );
      })
      .addCase(updateCertification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteCertification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCertification.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.certifications = state.certifications.filter((cert) => cert.id !== action.payload);
      })
      .addCase(deleteCertification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default certificationSlice.reducer;