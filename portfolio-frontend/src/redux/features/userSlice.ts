// portfolio-frontend/src/redux/features/userSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { userCrudReducer } from "./user/userCrud";
import { userSocialReducer } from "./user/userSocial";
import { userThemeReducer } from "./user/userTheme";
import { fetchUser, fetchAllUsers, fetchVerifiedUsers, fetchUserById, updateUser, deleteUser } from "./user/userCrud";
import { likeUser, unlikeUser, blockUser, unblockUser } from "./user/userSocial";
import { saveChatTheme } from "./user/userTheme";
import { User, UserState, normalizeBirthdate } from "./user/UserTypes";


const initialState: UserState = {
  user: null,
  members: [],
  status: "idle",
  error: null,
  message: null,
};

// Création du slice principal avec un seul état
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.members = [];
      state.status = "idle";
      state.error = null;
      state.message = null;
      console.log("🔍 État utilisateur réinitialisé");
    },
  },
  extraReducers: (builder) => {
    builder.addDefaultCase((state, action) => {
      // Applique chaque reducer au même état partagé
      state = userCrudReducer(state, action);
      state = userSocialReducer(state, action);
      state = userThemeReducer(state, action);
      return state;
    });
  },
});

// Exportation des actions
export const { clearUserState } = userSlice.actions;
export {
  fetchUser,
  fetchAllUsers,
  fetchVerifiedUsers,
  fetchUserById,
  updateUser,
  deleteUser,
  likeUser,
  unlikeUser,
  blockUser,
  unblockUser,
  saveChatTheme,
};

// Exportation du reducer combiné
export default userSlice.reducer;