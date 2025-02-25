import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Définir les types pour ContactDTO basé sur ton backend
interface Contact {
  id: string;
  senderId: string | null;
  receiverId: string;
  isAccepted: boolean;
  senderEmail: string | null;
  senderPhone: string | null;
  message: string | null;
  senderName: string;
  receiverName: string;
  isDeveloperContact: boolean;
  createdAt?: string;
  acceptedAt?: string;
}

// État initial du slice
interface ContactState {
  pendingContacts: Contact[];
  acceptedContacts: Contact[];
  developerContacts: Contact[];
  loading: boolean;
  error: string | null;
}

const initialState: ContactState = {
  pendingContacts: [],
  acceptedContacts: [],
  developerContacts: [],
  loading: false,
  error: null,
};

// Base URL de ton API
const API_URL = "http://localhost:8080/api/contacts";

// Thunks pour les appels API
export const sendContactRequest = createAsyncThunk(
  "contact/sendContactRequest",
  async (
    request: {
      senderId: string | null;
      receiverId: string;
      senderEmail: string | null;
      senderPhone: string | null;
      message: string | null;
      isDeveloperContact: boolean;
      firstName: string;
      lastName: string;
      company?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post<Contact>(`${API_URL}/request`, request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Erreur lors de l'envoi de la demande");
    }
  }
);

export const acceptContactRequest = createAsyncThunk(
  "contact/acceptContactRequest",
  async (contactId: string, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.post<Contact>(
        `${API_URL}/accept/${contactId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Erreur lors de l'acceptation");
    }
  }
);

export const fetchPendingContacts = createAsyncThunk(
  "contact/fetchPendingContacts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.get<Contact[]>(`${API_URL}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Erreur lors de la récupération des demandes en attente");
    }
  }
);

export const fetchAcceptedContacts = createAsyncThunk(
  "contact/fetchAcceptedContacts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.get<Contact[]>(`${API_URL}/accepted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Erreur lors de la récupération des contacts acceptés");
    }
  }
);

export const fetchDeveloperContacts = createAsyncThunk(
  "contact/fetchDeveloperContacts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.get<Contact[]>(`${API_URL}/developer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Erreur lors de la récupération des contacts développeur");
    }
  }
);

// Slice Redux
const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendContactRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendContactRequest.fulfilled, (state, action: PayloadAction<Contact>) => {
        state.loading = false;
        if (!action.payload.isAccepted) {
          state.pendingContacts.push(action.payload);
        }
      })
      .addCase(sendContactRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptContactRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptContactRequest.fulfilled, (state, action: PayloadAction<Contact>) => {
        state.loading = false;
        // Supprimer le contact de pendingContacts
        state.pendingContacts = state.pendingContacts.filter(
          (contact) => contact.id !== action.payload.id
        );
        // Ajouter à acceptedContacts uniquement s'il n'y est pas déjà
        if (!state.acceptedContacts.some(contact => contact.id === action.payload.id)) {
          state.acceptedContacts.push(action.payload);
        }
      })
      .addCase(acceptContactRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPendingContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.loading = false;
        state.pendingContacts = action.payload;
      })
      .addCase(fetchPendingContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAcceptedContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcceptedContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.loading = false;
        state.acceptedContacts = action.payload;
      })
      .addCase(fetchAcceptedContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDeveloperContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeveloperContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.loading = false;
        state.developerContacts = action.payload;
      })
      .addCase(fetchDeveloperContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = contactSlice.actions;
export default contactSlice.reducer;