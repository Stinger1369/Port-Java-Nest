// // ✅ Configuration de l'URL du serveur backend
// const BASE_URL = "http://localhost:8080";
// const FRONTEND_URL = "http://localhost:5173";

// export { BASE_URL, FRONTEND_URL };


// ✅ Configuration de l'URL du serveur backend

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "https://localhost:5173";

export { BASE_URL, FRONTEND_URL };
console.log("🔹 BASE_URL:", BASE_URL);
console.log("🔹 FRONTEND_URL:", FRONTEND_URL);