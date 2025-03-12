import { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "./redux/store";
import { fetchVerifiedUsers } from "./redux/features/userSlice"; // Remplacé fetchAllUsers
import { useWebSocket } from "./hooks/useWebSocket";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import Login from "./pages/Profile/Login/Login";
import Register from "./pages/Profile/Register/Register";
import VerifyAccount from "./pages/Profile/VerifyAccount/VerifyAccount";
import Profile from "./pages/Profile/Profile";
import ForgotPassword from "./pages/Profile/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/Profile/ResetPassword/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import EditProfileContainer from "./pages/Profile/EditProfile/EditProfileContainer";
import Portfolio from "./pages/Portfolio/Portfolio";
import PortfolioGlobal from "./pages/Portfolio/PortfolioGlobal/PortfolioGlobal";
import Education from "./pages/Portfolio/Education/Education";
import Experience from "./pages/Portfolio/Experience/Experience";
import Skills from "./pages/Portfolio/Skills/Skills";
import Projects from "./pages/Portfolio/Projects/Projects";
import Certifications from "./pages/Portfolio/Certifications/Certifications";
import Social from "./pages/Portfolio/Social/Social";
import Languages from "./pages/Portfolio/Languages/Languages";
import Recommendations from "./pages/Portfolio/Recommendations/Recommendations";
import Interests from "./pages/Portfolio/Interests/Interests";
import ContactScreen from "./pages/Portfolio/ContactPortfolio/ContactPortfolio";
import Notifications from "./pages/UserMenuDropdown/Notification/Notifications";
import OffersReceived from "./pages/UserMenuDropdown/OffersReceived/OffersReceived";
import ContactHistory from "./pages/UserMenuDropdown/ContactHistory/ContactHistory";
import MembersList from "./pages/UserMenuDropdown/MembersList/MembersList";
import ChatPage from "./pages/Chat/ChatPage";
import Settings from "./pages/Settings/Settings";
import ErrorBoundary from "./components/ErrorBoundary";
import { isMobileDevice } from "./utils/detectMobile";
import MobileRedirect from "./components/Mobile/MobileRedirect";
import "./App.css";

const App = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const { userId } = useSelector((state: RootState) => state.chat);

  const { wsInstance } = useWebSocket(token);

  useEffect(() => {
    if (token) {
      console.log("🔍 Utilisateur authentifié, récupération des utilisateurs vérifiés...");
      dispatch(fetchVerifiedUsers())
        .unwrap()
        .then((result) => console.log("✅ Utilisateurs vérifiés chargés:", result.length))
        .catch((err) => console.error("❌ Erreur chargement utilisateurs vérifiés:", err));
    } else {
      console.log("🔍 Aucun token trouvé, l'utilisateur n'est pas authentifié.");
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (wsInstance) {
      console.log("📡 WebSocket instance active pour userId:", userId);
    } else {
      console.log("🔴 WebSocket non connecté pour userId:", userId);
    }
  }, [wsInstance, userId]);

  if (isMobileDevice()) {
    return <MobileRedirect />;
  }

  return (
    <Router>
      <div className="app-container">
        <Suspense fallback={<div>Loading translations...</div>}>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-account" element={<VerifyAccount />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfileContainer /></ProtectedRoute>} />
              <Route path="/portfolio/:firstName/:lastName/:slug" element={<PortfolioGlobal />} />
              <Route path="/portfolio/:firstName/:lastName/:slug/contact" element={<ContactScreen />} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>}>
                <Route path="global" element={<PortfolioGlobal />} />
                <Route path="education" element={<Education />} />
                <Route path="experience" element={<Experience />} />
                <Route path="skills" element={<Skills />} />
                <Route path="projects" element={<Projects />} />
                <Route path="certifications" element={<Certifications />} />
                <Route path="social" element={<Social />} />
                <Route path="languages" element={<Languages />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="interests" element={<Interests />} />
              </Route>
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/offers" element={<ProtectedRoute><OffersReceived /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><ContactHistory /></ProtectedRoute>} />
              <Route path="/member" element={<ProtectedRoute><MembersList /></ProtectedRoute>} />
              <Route path="/chat" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
              <Route path="/chat/:type/:id" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </Suspense>
      </div>
    </Router>
  );
};

export default App;