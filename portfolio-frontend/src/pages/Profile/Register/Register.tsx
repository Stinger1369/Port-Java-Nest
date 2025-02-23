import { useState, Suspense } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Register.css";

const Register = () => {
  const { t, ready } = useTranslation(); // ✅ Chargement des traductions
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Nouvel état pour confirmation
  const [error, setError] = useState(""); // État pour gérer les erreurs

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Réinitialiser l'erreur avant la soumission

    // Vérifier si les mots de passe correspondent
    if (password !== confirmPassword) {
      setError(t("register.error.passwordMismatch"));
      return;
    }

    try {
      const result = await dispatch(register({ email, password }) as any);
      if (register.fulfilled.match(result)) {
        alert(t("register.success"));
        navigate(`/verify-account?email=${encodeURIComponent(email)}`);
      } else {
        alert(t("register.error.generic"));
      }
    } catch (err) {
      alert(t("register.error.generic"));
    }
  };

  // Si les traductions ne sont pas prêtes, afficher un fallback
  if (!ready) {
    return <div>Loading translations...</div>;
  }

  return (
    <div className="register-container">
      <h2>{t("register.title")}</h2>
      {error && <p className="error-message">{error}</p>} {/* Affichage des erreurs */}

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

// 🔹 Utilisation de Suspense pour gérer le chargement des traductions
const RegisterWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <Register />
  </Suspense>
);

export default RegisterWithSuspense;
