import { useState, Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, resendVerificationCode } from "../../../redux/features/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Login.css";

const Login = () => {
  const { t, i18n, ready } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Stocke la clé ou le message brut
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Nouveau state pour les messages de succès
  const [unverified, setUnverified] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Met à jour dynamiquement les erreurs statiques locales en fonction de la langue
  useEffect(() => {
    if (error) {
      if (error === "login.error.unverified") {
        setError(t("login.error.unverified"));
      } else if (error === "login.error.userNotFound") {
        setError(t("login.error.userNotFound"));
      } else if (error === "login.error.generic") {
        setError(t("login.error.generic"));
      }
      // Les erreurs backend (ex. "too.many.requests.code") ne sont pas retraduites ici
    }
  }, [i18n.language, error, t]);

  // Efface le message de succès après 3 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer); // Nettoyage du timer
    }
  }, [successMessage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setUnverified(false);
    setUserNotFound(false);

    console.log("📤 Données envoyées :", { email, password });

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      navigate("/");
    } catch (err) {
      console.error("❌ Échec de connexion :", err);
      const errorMsg = String(err);
      if (errorMsg.includes("Account not verified")) {
        setError("login.error.unverified"); // Stocke la clé
        setUnverified(true);
      } else if (errorMsg.includes("User not found")) {
        setError("login.error.userNotFound"); // Stocke la clé
        setUserNotFound(true);
      } else {
        setError(errorMsg); // Utilise directement l'erreur renvoyée par le slice
      }
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await dispatch(resendVerificationCode({ email })).unwrap();
      setSuccessMessage(t("login.resendSuccess"));
    } catch (err) {
      console.error("❌ Échec de l'envoi du code :", err);
      const errorMsg = String(err);
      setError(errorMsg); // Utilise directement l'erreur renvoyée par le backend
    } finally {
      setResendLoading(false);
    }
  };

  if (!ready) {
    return <div>{t("login.loadingTranslations")}</div>;
  }

  return (
    <div className="login-container">
      <h2>{t("login.title")}</h2>
      {error && (
        <p className="error-message">
          {t(error.includes("login.error.") ? error : "login.error.generic", { defaultValue: error })}
        </p>
      )}
      {successMessage && (
        <p className="success-message">
          {successMessage}
        </p>
      )}

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
            disabled={resendLoading || !email}
            className="resend-btn"
          >
            {resendLoading ? t("login.resendLoading") : t("login.resendButton")}
          </button>
        </div>
      )}

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

const LoginWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <Login />
  </Suspense>
);

export default LoginWithSuspense;