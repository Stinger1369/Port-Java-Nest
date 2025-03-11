import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../config/hostname";

interface Project {
  id?: string;
  userId: string;
  title: string;
  description: string;
  technologies: string[];
  liveDemoUrl?: string;
  repositoryUrl?: string;
  startDate: string;
  endDate?: string;
  currentlyWorkingOn: boolean;
  isPublic?: boolean; // Ajouté
}

interface ProjectState {
  projects: Project[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  status: "idle",
  error: null,
};

const getAuthToken = () => localStorage.getItem("token");

export const fetchProjectsByUser = createAsyncThunk(
  "project/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get<Project[]>(
        `${BASE_URL}/api/projects/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return response.data.map((proj) => ({
        id: proj.id,
        userId: proj.userId,
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies || [],
        liveDemoUrl: proj.liveDemoUrl || "",
        repositoryUrl: proj.repositoryUrl || "",
        startDate: proj.startDate.toString(),
        endDate: proj.endDate?.toString() || "",
        currentlyWorkingOn: proj.currentlyWorkingOn || false,
        isPublic: proj.isPublic ?? false, // Ajouté
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des projets.");
    }
  }
);

export const addProject = createAsyncThunk(
  "project/add",
  async (projectData: Omit<Project, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post<Project>(
        `${BASE_URL}/api/projects`,
        {
          ...projectData,
          userId,
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        liveDemoUrl: response.data.liveDemoUrl || "",
        repositoryUrl: response.data.repositoryUrl || "",
        currentlyWorkingOn: response.data.currentlyWorkingOn || false,
        isPublic: response.data.isPublic ?? false, // Ajouté
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du projet.");
    }
  }
);

export const updateProject = createAsyncThunk(
  "project/update",
  async ({ id, projectData }: { id: string; projectData: Partial<Project> }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put<Project>(
        `${BASE_URL}/api/projects/${id}`,
        {
          ...projectData,
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return {
        ...response.data,
        liveDemoUrl: response.data.liveDemoUrl || "",
        repositoryUrl: response.data.repositoryUrl || "",
        currentlyWorkingOn: response.data.currentlyWorkingOn || false,
        isPublic: response.data.isPublic ?? false, // Ajouté
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du projet.");
    }
  }
);

export const deleteProject = createAsyncThunk(
  "project/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(
        `${BASE_URL}/api/projects/${id}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du projet.");
    }
  }
);

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjectsByUser.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.status = "succeeded";
        state.projects = action.payload;
      })
      .addCase(fetchProjectsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.status = "succeeded";
        state.projects.push(action.payload);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(updateProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.status = "succeeded";
        state.projects = state.projects.map((proj) =>
          proj.id === action.payload.id ? action.payload : proj
        );
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(deleteProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.projects = state.projects.filter((proj) => proj.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default projectSlice.reducer;