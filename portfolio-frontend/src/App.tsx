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
import Education from "./pages/Portfolio/Education/Education";

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

        {/* ✅ Correction ici : Balise `<Route>` fermée correctement */}
        <Route path="/portfolio" element={<Portfolio />}>
          <Route path="education" element={<Education />} />
        </Route> {/* ✅ Cette ligne était mal fermée ! */}

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
