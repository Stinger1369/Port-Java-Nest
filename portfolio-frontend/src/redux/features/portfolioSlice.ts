import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ Définir des interfaces spécifiques pour chaque section du portfolio
interface Education {
  id: string;
  degree: string;
  schoolName: string;
  startDate: string;
}

interface Experience {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
}

interface Skill {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
}

interface Certification {
  id: string;
  name: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface Language {
  id: string;
  name: string;
}

interface Recommendation {
  id: string;
  content: string;
}

interface Interest {
  id: string;
  name: string;
}

// ✅ Type Portfolio raffiné
interface Portfolio {
  id?: string;
  userId: string;
  isPublic: boolean;
  educations: Education[];
  experiences: Experience[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  socialLinks: SocialLink[];
  languages: Language[];
  recommendations: Recommendation[];
  interests: Interest[];
}

// ✅ État initial Redux
interface PortfolioState {
  portfolio: Portfolio | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  status: "idle",
  error: null,
};

// ✅ Récupérer le token d'authentification
const getAuthToken = () => localStorage.getItem("token");

// ✅ Récupérer le portfolio par `userId` (Authentifié)
export const fetchPortfolioByUser = createAsyncThunk(
  "portfolio/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<Portfolio>(
        `http://localhost:8080/api/portfolio/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      const message =
        error.response?.status === 404
          ? "Portfolio non trouvé pour cet utilisateur."
          : error.response?.data?.error || "Échec du chargement du portfolio.";
      return rejectWithValue(message);
    }
  }
);

// ✅ Récupérer le portfolio public par `firstName`, `lastName` et `slug`
export const fetchPortfolioByUsername = createAsyncThunk(
  "portfolio/fetchByUsername",
  async (
    { firstName, lastName, slug }: { firstName: string; lastName: string; slug: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get<Portfolio>(
        `http://localhost:8080/api/portfolio/public/${firstName}/${lastName}/${slug}`
      );

      return response.data;
    } catch (error: any) {
      const message =
        error.response?.status === 404
          ? `Aucun portfolio trouvé pour ${firstName} ${lastName} avec le slug ${slug}.`
          : error.response?.data?.error || "Échec du chargement du portfolio public.";
      return rejectWithValue(message);
    }
  }
);

// ✅ Mettre à jour le portfolio
export const updatePortfolio = createAsyncThunk(
  "portfolio/update",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.post<Portfolio>(
        `http://localhost:8080/api/portfolio/user/${userId}/update`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.status === 404
          ? "Portfolio non trouvé pour mise à jour."
          : error.response?.data?.error || "Échec de la mise à jour du portfolio.";
      return rejectWithValue(message);
    }
  }
);

// ✅ Création du slice Redux
const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔹 Récupérer le portfolio par `userId`
      .addCase(fetchPortfolioByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPortfolioByUser.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolioByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // 🔹 Récupérer le portfolio par `firstName`, `lastName` et `slug`
      .addCase(fetchPortfolioByUsername.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPortfolioByUsername.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolioByUsername.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // 🔹 Mettre à jour le portfolio
      .addCase(updatePortfolio.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updatePortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
      })
      .addCase(updatePortfolio.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

// ✅ Exports
export default portfolioSlice.reducer;