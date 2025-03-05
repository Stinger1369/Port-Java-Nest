import { useState, Suspense } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Register.css";

const Register = () => {
  const { t, ready } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError(t("register.error.passwordMismatch"));
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
        // Afficher le message d'erreur renvoyé par le backend s'il existe
        setError(result.payload || t("register.error.generic"));
      }
    } catch (err: any) {
      // Gérer les erreurs inattendues
      setError(err.message || t("register.error.generic"));
    }
  };

  if (!ready) {
    return <div>Loading translations...</div>;
  }

  return (
    <div className="register-container">
      <h2>{t("register.title")}</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {error && <p className="error-message">{error}</p>}
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