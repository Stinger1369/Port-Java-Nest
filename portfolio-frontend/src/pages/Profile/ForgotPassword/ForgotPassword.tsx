import { useState, Suspense } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const { t, ready } = useTranslation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await axios.post("http://localhost:8080/api/auth/forgot-password", { email });
      setMessage(t("forgotPassword.success", response.data.message));
      setEmailSent(true);
    } catch (error: any) {
      setError(error.response?.data?.error || t("forgotPassword.error.generic", "An error occurred."));
    }
  };

  if (!ready) {
    return <div>{t("loading", "Loading translations...")}</div>;
  }

  return (
    <div className="forgot-password-container">
      <h2>{t("forgotPassword.title", "Forgot Password")}</h2>

      {message && (
        <div className="success-message">
          <p>{message}</p>
          <p>{t("forgotPassword.successInstructions", "Please check your email and follow the link to reset your password.")}</p>
          <button onClick={() => navigate("/login")}>
            {t("forgotPassword.backToLogin", "Back to login")}
          </button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      {!emailSent && (
        <form onSubmit={handleForgotPassword}>
          <input
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder", "Enter your email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">{t("forgotPassword.submit", "Send")}</button>
        </form>
      )}
    </div>
  );
};

const ForgotPasswordWithSuspense = () => (
  <Suspense fallback={<div>Loading translations...</div>}>
    <ForgotPassword />
  </Suspense>
);

export default ForgotPasswordWithSuspense;