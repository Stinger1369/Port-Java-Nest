import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Education {
  id: string;
  degree: string;
  schoolName: string;
  startDate: string;
  endDate?: string;
  currentlyStudying: boolean;
  description?: string;
  isPublic?: boolean; // Ajouté
}

interface Experience {
  id: string;
  jobTitle: string; // Changé de "position" à "jobTitle"
  companyName: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
  isPublic?: boolean; // Ajouté
}

interface Skill {
  id: string;
  name: string;
  isPublic?: boolean; // Ajouté
}

interface Project {
  id: string;
  title: string;
  isPublic?: boolean;
}

interface Certification {
  id: string;
  name: string;
  isPublic?: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isPublic?: boolean; // Ajouté
}

interface Language {
  id: string;
  name: string;
  isPublic?: boolean; // Ajouté
}

interface Recommendation {
  id: string;
  content: string;
  isPublic?: boolean; // Ajouté
}

interface Interest {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface PortfolioCard {
  section: string;
  position: number;
  size: string;
  shape: string;
}

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
  cards: PortfolioCard[];
  imageIds?: string[];
}

interface PortfolioState {
  portfolio: Portfolio | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetchedUserId: string | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  status: "idle",
  error: null,
  lastFetchedUserId: null,
};

const getAuthToken = () => localStorage.getItem("token");

export const fetchPortfolioByUser = createAsyncThunk(
  "portfolio/fetchByUser",
  async (userId: string, { rejectWithValue, getState }) => {
    const state = getState() as { portfolio: PortfolioState };
    if (state.portfolio.lastFetchedUserId === userId && state.portfolio.portfolio) {
      return state.portfolio.portfolio;
    }

    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<Portfolio>(
        `${BASE_URL}/api/portfolio/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
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

export const fetchPortfolioByUsername = createAsyncThunk(
  "portfolio/fetchByUsername",
  async (
    { firstName, lastName, slug }: { firstName: string; lastName: string; slug: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get<Portfolio>(
        `${BASE_URL}/api/portfolio/public/${firstName}/${lastName}/${slug}`,
        { headers: { "Content-Type": "application/json" } }
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

export const updatePortfolio = createAsyncThunk(
  "portfolio/update",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.post<Portfolio>(
        `${BASE_URL}/api/portfolio/user/${userId}/update`,
        {},
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
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

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    setSectionPublicity: (state, action: PayloadAction<{ section: string; isPublic: boolean }>) => {
      if (state.portfolio) {
        switch (action.payload.section) {
          case "educations":
            state.portfolio.educations.forEach((e) => (e.isPublic = action.payload.isPublic));
            break;
          case "experiences":
            state.portfolio.experiences.forEach((e) => (e.isPublic = action.payload.isPublic));
            break;
          case "skills":
            state.portfolio.skills.forEach((s) => (s.isPublic = action.payload.isPublic));
            break;
          case "projects":
            state.portfolio.projects.forEach((p) => (p.isPublic = action.payload.isPublic));
            break;
          case "certifications":
            state.portfolio.certifications.forEach((c) => (c.isPublic = action.payload.isPublic));
            break;
          case "socialLinks":
            state.portfolio.socialLinks.forEach((s) => (s.isPublic = action.payload.isPublic));
            break;
          case "languages":
            state.portfolio.languages.forEach((l) => (l.isPublic = action.payload.isPublic));
            break;
          case "recommendations":
            state.portfolio.recommendations.forEach((r) => (r.isPublic = action.payload.isPublic));
            break;
          case "interests":
            state.portfolio.interests.forEach((i) => (i.isPublic = action.payload.isPublic));
            break;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolioByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPortfolioByUser.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.status = "succeeded";
        state.portfolio = action.payload;
        state.lastFetchedUserId = action.payload.userId;
      })
      .addCase(fetchPortfolioByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
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

export const { setSectionPublicity } = portfolioSlice.actions;
export default portfolioSlice.reducer;