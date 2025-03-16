// portfolio-frontend/src/redux/features/user/UserTypes.ts
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  sex?: "Man" | "Woman" | "Other" | "";
  bio?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  birthdate?: string;
  age?: number;
  showBirthdate?: boolean;
  likedUserIds?: string[];
  likerUserIds?: string[];
  imageIds?: string[];
  isVerified?: boolean;
  blockedUserIds?: string[];
  chatTheme?: string;
  friendIds?: string[];
  friendRequestSentIds?: string[];
  friendRequestReceivedIds?: string[];
}

export interface UserState {
  user: User | null;
  members: User[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
}

export const normalizeBirthdate = (birthdate: any): string | undefined => {
  if (!birthdate) return undefined;
  if (typeof birthdate === "string") {
    return birthdate.split("T")[0];
  }
  console.warn("⚠️ Format de birthdate inattendu:", birthdate);
  return undefined;
};