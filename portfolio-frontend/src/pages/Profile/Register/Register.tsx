import { useState, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RootState } from "../../../redux/store"; // Assurez-vous d'importer RootState
import "./Register.css";

const Register = () => {
  const { t, i18n, ready } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Récupérer l'état de limitation depuis Redux
  const { resendCooldownUntil, remainingMinutes } = useSelector((state: RootState) => state.auth);

  // Gestion dynamique des erreurs locales
  useEffect(() => {
    if (error) {
      if (error === "register.error.passwordMismatch") {
        setError(t("register.error.passwordMismatch"));
      } else if (error === "register.error.generic") {
        setError(t("register.error.generic"));
      }
    }
  }, [i18n.language, error, t]);

  // Efface le message de succès après 3 secondes et redirige
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        navigate(`/verify-account?email=${encodeURIComponent(email)}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, email, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("register.error.passwordMismatch");
      return;
    }

    if (resendCooldownUntil && resendCooldownUntil > Date.now()) {
      setError(t("register.error.tooManyRequests", { minutes: remainingMinutes }));
      return;
    }

    try {
      const result = await dispatch(register({ email, password }) as any);
      if (register.fulfilled.match(result)) {
        setSuccessMessage(t("register.success"));
      } else {
        console.log("Erreur brute reçue du backend :", result.payload);
        setError(result.payload as string);
      }
    } catch (err: any) {
      console.error("Erreur inattendue :", err);
      setError(err.message || "register.error.generic");
    }
  };

  if (!ready) {
    return <div>{t("register.loadingTranslations", "Chargement des traductions...")}</div>;
  }

  return (
    <div className="register-container">
      <h2>{t("register.title")}</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {error && (
        <p className="error-message">
          {t(error.includes("register.error.") ? error : "register.error.generic", { defaultValue: error })}
        </p>
      )}
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder={t("register.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("register.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("register.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={resendCooldownUntil && resendCooldownUntil > Date.now()}
        >
          {resendCooldownUntil && resendCooldownUntil > Date.now()
            ? t("register.submitDisabled", { minutes: remainingMinutes })
            : t("register.submit")}
        </button>
      </form>
    </div>
  );
};

const RegisterWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <Register />
  </Suspense>
);

export default RegisterWithSuspense;