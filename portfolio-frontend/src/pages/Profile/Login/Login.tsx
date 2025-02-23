import { useState, Suspense } from "react";
import { useDispatch } from "react-redux";
import { login, forgotPassword } from "../../../redux/features/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Login.css";

const Login = () => {
  const { t, ready } = useTranslation(); // ✅ 'ready' indique si les traductions sont chargées
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [unverified, setUnverified] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setUserNotFound(false);

    console.log("📤 Données envoyées :", { email, password });

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      navigate("/profile");
    } catch (err) {
      console.error("❌ Échec de connexion :", err);
      if (err === "Account not verified. Check your email.") {
        setError(t("login.error.unverified", "Your account is not yet verified. Check your email."));
        setUnverified(true);
      } else if (err === "User not found.") {
        setError(t("login.error.userNotFound", "User not found. Would you like to create an account?"));
        setUserNotFound(true);
      } else {
        setError(t("login.error.generic", "Login failed, please check your credentials."));
      }
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      alert(t("login.resendSuccess", "A new verification code has been sent to your email."));
    } catch (err) {
      alert(t("login.resendError", "Error sending the code."));
    } finally {
      setResendLoading(false);
    }
  };

  // Si les traductions ne sont pas encore prêtes, afficher un fallback
  if (!ready) {
    return <div>Loading translations...</div>;
  }

  return (
    <div className="login-container">
      <h2>{t("login.title")}</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder={t("login.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("login.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{t("login.submit")}</button>
      </form>

      {/* Boutons pour compte non vérifié */}
      {unverified && (
        <div className="verify-options">
          <p>{t("login.verifyPrompt")}</p>
          <button
            onClick={() => navigate(`/verify-account?email=${email}`)}
            className="verify-btn"
          >
            {t("login.verifyButton")}
          </button>
          <button
            onClick={handleResendCode}
            disabled={resendLoading}
            className="resend-btn"
          >
            {resendLoading ? t("login.resendLoading") : t("login.resendButton")}
          </button>
        </div>
      )}

      {/* Bouton pour créer un compte si l'utilisateur n'existe pas */}
      {userNotFound && (
        <div className="register-option">
          <button
            onClick={() => navigate("/register")}
            className="register-btn"
          >
            {t("login.registerButton")}
          </button>
        </div>
      )}

      <p>
        <Link to="/forgot-password">{t("login.forgotPassword")}</Link>
      </p>
    </div>
  );
};

// Envelopper dans Suspense pour gérer le chargement des traductions
const LoginWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <Login />
  </Suspense>
);

export default LoginWithSuspense;