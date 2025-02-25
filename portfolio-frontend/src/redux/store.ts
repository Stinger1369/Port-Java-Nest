import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import userReducer from "./features/userSlice";
import educationReducer from "./features/educationSlice";
import skillReducer from "./features/skillSlice";
import experienceReducer from "./features/experienceSlice";
import projectReducer from "./features/projectSlice";
import certificationReducer from "./features/certificationSlice";
import socialLinkReducer from "./features/socialLinkSlice";
import portfolioReducer from "./features/portfolioSlice";
import languageReducer from "./features/languageSlice";
import recommendationReducer from "./features/recommendationSlice";
import interestReducer from "./features/interestSlice";
import contactReducer from "./features/contactSlice"; // Ajout du nouveau slice

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    education: educationReducer,
    skill: skillReducer,
    experience: experienceReducer,
    project: projectReducer,
    certification: certificationReducer,
    socialLink: socialLinkReducer,
    portfolio: portfolioReducer,
    language: languageReducer,
    recommendation: recommendationReducer,
    interest: interestReducer,
    contact: contactReducer, // Ajout au store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;