import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

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

// ✅ **Récupérer les certifications d'un utilisateur**
export const fetchCertificationsByUser = createAsyncThunk(
  "certification/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`http://localhost:8080/api/certifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Certifications récupérées :", response.data);

      // 🔄 Adapter la structure pour correspondre au frontend
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
      }));
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des certifications.");
    }
  }
);

// ✅ **Ajouter une certification**
export const addCertification = createAsyncThunk(
  "certification/add",
  async (certificationData: Omit<Certification, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        "http://localhost:8080/api/certifications",
        { ...certificationData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Certification ajoutée :", response.data);

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
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout de la certification.");
    }
  }
);

// ✅ **Mettre à jour une certification**
export const updateCertification = createAsyncThunk(
  "certification/update",
  async ({ id, certificationData }: { id: string; certificationData: Certification }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `http://localhost:8080/api/certifications/${id}`,
        certificationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Certification mise à jour :", response.data);

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
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour de la certification.");
    }
  }
);

// ✅ **Supprimer une certification**
export const deleteCertification = createAsyncThunk(
  "certification/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`http://localhost:8080/api/certifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Certification supprimée : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression de la certification.");
    }
  }
);

// ✅ **Création du slice Redux**
const certificationSlice = createSlice({
  name: "certification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les certifications**
      .addCase(fetchCertificationsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des certifications...");
      })
      .addCase(fetchCertificationsByUser.fulfilled, (state, action: PayloadAction<Certification[]>) => {
        state.status = "succeeded";
        console.log("✅ Certifications reçues :", action.payload);
        state.certifications = action.payload;
      })
      .addCase(fetchCertificationsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des certifications :", state.error);
      })

      // **Ajouter une certification**
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

      // **Mettre à jour une certification**
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
      });
  },
});

// ✅ **Exports**
export default certificationSlice.reducer;
