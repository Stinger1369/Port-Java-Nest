import { useState, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { t, i18n, ready } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Logs pour déboguer, placés avant toute logique
  console.log("📢 Langue actuelle :", i18n.language);
  console.log("📝 Traductions disponibles :", i18n.getDataByLanguage(i18n.language));
  console.log("🔍 resetPassword.title:", t("resetPassword.title"));

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!token) {
      setError(t("resetPassword.error.invalidToken", "Invalid or expired token."));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.error.passwordMismatch", "Passwords do not match."));
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/api/auth/reset-password", { token, newPassword });
      setMessage(t("resetPassword.success", "Your password has been successfully reset. Redirecting to login..."));
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || t("resetPassword.error.generic", "An error occurred while resetting your password."));
    }
  };

  if (!ready) {
    return <div>{t("loading", "Loading translations...")}</div>; // Utilise une clé de traduction pour le fallback
  }

  return (
    <div className="reset-password-container">
      <h2>🔒 {t("resetPassword.title", "Reset your password")}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {!message && (
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder={t("resetPassword.newPasswordPlaceholder", "New password")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t("resetPassword.confirmPasswordPlaceholder", "Confirm new password")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">🔄 {t("resetPassword.submit", "Reset password")}</button>
        </form>
      )}
    </div>
  );
};

const ResetPasswordWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <ResetPassword />
  </Suspense>
);

export default ResetPasswordWithSuspense;