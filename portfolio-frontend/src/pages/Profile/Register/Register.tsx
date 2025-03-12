import { useState, Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Register.css";

const Register = () => {
  const { t, i18n, ready } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Stocke la clé ou le message brut
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Met à jour dynamiquement les erreurs en fonction de la langue
  useEffect(() => {
    if (error) {
      // Si l'erreur est une clé statique locale, retraduire avec la langue actuelle
      if (error === "register.error.passwordMismatch") {
        setError(t("register.error.passwordMismatch"));
      } else if (error === "register.error.generic") {
        setError(t("register.error.generic"));
      }
      // Les erreurs backend (ex. "email.already.used") restent telles quelles
    }
  }, [i18n.language, error, t]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("register.error.passwordMismatch"); // Stocke la clé, pas la traduction
      return;
    }

    try {
      const result = await dispatch(register({ email, password }) as any);
      if (register.fulfilled.match(result)) {
        setSuccessMessage(t("register.success"));
        setTimeout(() => {
          navigate(`/verify-account?email=${encodeURIComponent(email)}`);
        }, 3000);
      } else {
        console.log("Erreur brute reçue du backend :", result.payload);
        setError(result.payload as string); // Affiche directement le message traduit du backend
      }
    } catch (err: any) {
      console.error("Erreur inattendue :", err);
      setError(err.message || "register.error.generic"); // Stocke la clé comme fallback
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
        <button type="submit">{t("register.submit")}</button>
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