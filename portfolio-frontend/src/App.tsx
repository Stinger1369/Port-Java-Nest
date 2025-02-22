import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Login from "./pages/Profile/Login/Login";
import Register from "./pages/Profile/Register/Register";
import VerifyAccount from "./pages/Profile/VerifyAccount/VerifyAccount";
import Profile from "./pages/Profile/Profile";
import ForgotPassword from "./pages/Profile/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/Profile/ResetPassword/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import EditProfile from "./pages/Profile/EditProfile/EditProfile";
import Portfolio from "./pages/Portfolio/Portfolio";
import PortfolioGlobal from "./pages/Portfolio/PortfolioGlobal/PortfolioGlobal"; // ✅ Import du Portfolio Global
import Education from "./pages/Portfolio/Education/Education";
import Experience from "./pages/Portfolio/Experience/Experience";
import Skills from "./pages/Portfolio/Skills/Skills";
import Projects from "./pages/Portfolio/Projects/Projects";
import Certifications from "./pages/Portfolio/Certifications/Certifications";
import Social from "./pages/Portfolio/Social/Social";
import Languages from "./pages/Portfolio/Languages/Languages";
import Recommendations from "./pages/Portfolio/Recommendations/Recommendations";
import Interests from "./pages/Portfolio/Interests/Interests";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/edit-profile" element={<EditProfile />} />

        {/* ✅ Routes du Portfolio */}
        <Route path="/portfolio" element={<Portfolio />}>
          <Route path="global" element={<PortfolioGlobal />} /> {/* ✅ Portfolio complet */}
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

        {/* ✅ Route protégée pour Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
