import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface Project {
  id?: string;
  userId: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;         // ✅ Correspond à `liveDemoUrl` du backend
  repository?: string;   // ✅ Correspond à `repositoryUrl` du backend
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;  // ✅ Correspond à `currentlyWorkingOn` du backend
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

// ✅ **Récupérer les projets d'un utilisateur**
export const fetchProjectsByUser = createAsyncThunk(
  "project/fetchByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.get(`http://localhost:8080/api/projects/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Projets récupérés :", response.data);

      // 🔄 Mapping des champs pour correspondre au frontend
      return response.data.map((proj: any) => ({
        id: proj.id,
        userId: proj.userId,
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies || [],
        link: proj.liveDemoUrl || "",  // 🔄 Correction de liveDemoUrl -> link
        repository: proj.repositoryUrl || "",  // 🔄 Correction de repositoryUrl -> repository
        startDate: proj.startDate,
        endDate: proj.endDate,
        currentlyWorking: proj.currentlyWorkingOn || false, // 🔄 Correction currentlyWorkingOn -> currentlyWorking
      }));
    } catch (error: any) {
      console.error("❌ Erreur API :", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Échec du chargement des projets.");
    }
  }
);

// ✅ **Ajouter un projet**
export const addProject = createAsyncThunk(
  "project/add",
  async (projectData: Omit<Project, "id" | "userId">, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const userId = localStorage.getItem("userId");

      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");
      if (!userId) return rejectWithValue("ID utilisateur manquant, veuillez vous reconnecter.");

      const response = await axios.post(
        "http://localhost:8080/api/projects",
        { ...projectData, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Projet ajouté :", response.data);

      return {
        ...response.data,
        link: response.data.liveDemoUrl || "",
        repository: response.data.repositoryUrl || "",
        currentlyWorking: response.data.currentlyWorkingOn || false,
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de l'ajout du projet.");
    }
  }
);

// ✅ **Mettre à jour un projet**
export const updateProject = createAsyncThunk(
  "project/update",
  async ({ id, projectData }: { id: string; projectData: Project }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      const response = await axios.put(
        `http://localhost:8080/api/projects/${id}`,
        projectData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Projet mis à jour :", response.data);

      return {
        ...response.data,
        link: response.data.liveDemoUrl || "",
        repository: response.data.repositoryUrl || "",
        currentlyWorking: response.data.currentlyWorkingOn || false,
      };
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la mise à jour du projet.");
    }
  }
);

// ✅ **Supprimer un projet**
export const deleteProject = createAsyncThunk(
  "project/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Token non trouvé, veuillez vous reconnecter.");

      await axios.delete(`http://localhost:8080/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`✅ Projet supprimé : ID ${id}`);
      return id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression :", error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Échec de la suppression du projet.");
    }
  }
);

// ✅ **Création du slice Redux**
const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // **Récupérer les projets**
      .addCase(fetchProjectsByUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("⏳ Chargement des projets...");
      })
      .addCase(fetchProjectsByUser.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.status = "succeeded";
        console.log("✅ Projets reçus :", action.payload);
        state.projects = action.payload;
      })
      .addCase(fetchProjectsByUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        console.error("❌ Erreur lors de la récupération des projets :", state.error);
      })

      // **Ajouter un projet**
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

      // **Mettre à jour un projet**
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

      // **Supprimer un projet**
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

// ✅ **Exports**
export default projectSlice.reducer;
