import { useState, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, resendVerificationCode } from "../../../redux/features/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RootState } from "../../../redux/store"; // Assurez-vous d'importer RootState
import "./Login.css";

const Login = () => {
  const { t, i18n, ready } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Récupérer l'état de limitation depuis Redux
  const { resendCooldownUntil, remainingMinutes } = useSelector((state: RootState) => state.auth);

  // Gestion dynamique des erreurs locales
  useEffect(() => {
    if (error && error.includes("login.error.")) {
      setError(t(error));
    }
  }, [i18n.language, error, t]);

  // Efface le message de succès après 3 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Met à jour le temps restant pour le bouton "Renvoyer le code"
  useEffect(() => {
    if (resendCooldownUntil) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diffMs = resendCooldownUntil - now;
        const minutesLeft = Math.ceil(diffMs / 60000); // Conversion en minutes
        if (minutesLeft <= 0) {
          // Pas besoin de réinitialiser ici, Redux le gère
          clearInterval(interval);
        }
      }, 1000); // Mise à jour chaque seconde
      return () => clearInterval(interval);
    }
  }, [resendCooldownUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setUnverified(false);
    setUserNotFound(false);
    setInvalidPassword(false);

    console.log("📤 Données envoyées :", { email, password });

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      navigate("/");
    } catch (err) {
      console.error("❌ Échec de connexion :", err);
      const errorMsg = String(err).toLowerCase();

      if (errorMsg.includes("account not verified") || errorMsg.includes("compte non vérifié")) {
        setError(errorMsg);
        setUnverified(true);
      } else if (errorMsg.includes("user not found") || errorMsg.includes("aucun utilisateur trouvé")) {
        setError(errorMsg);
        setUserNotFound(true);
      } else if (errorMsg.includes("invalid password") || errorMsg.includes("mot de passe invalide")) {
        setError(errorMsg);
        setInvalidPassword(true);
      } else if (errorMsg.includes("authentication failed") || errorMsg.includes("échec de l'authentification")) {
        setError(t("login.error.generic"));
        setInvalidPassword(true);
      } else {
        setError(errorMsg);
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
      const errorMsg = String(err).toLowerCase();
      setError(errorMsg);
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
          {error.includes("login.error.") ? t(error) : error}
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
            disabled={resendLoading || !email || (resendCooldownUntil && resendCooldownUntil > Date.now())}
            className="resend-btn"
          >
            {resendLoading
              ? t("login.resendLoading")
              : resendCooldownUntil && resendCooldownUntil > Date.now()
              ? t("login.resendDisabled", { minutes: remainingMinutes })
              : t("login.resendButton")}
          </button>
        </div>
      )}

      {userNotFound && (
        <div className="register-option">
          <p>{t("login.error.userNotFound")}</p>
          <button
            onClick={() => navigate("/register")}
            className="register-btn"
          >
            {t("login.registerButton")}
          </button>
        </div>
      )}

      {invalidPassword && (
        <div className="password-options">
          <p>{t("login.error.generic")}</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="forgot-password-btn"
          >
            {t("login.forgotPassword")}
          </button>
        </div>
      )}

      {!unverified && !userNotFound && !invalidPassword && (
        <p>
          <Link to="/forgot-password">{t("login.forgotPassword")}</Link>
        </p>
      )}
    </div>
  );
};

const LoginWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <Login />
  </Suspense>
);

export default LoginWithSuspense;