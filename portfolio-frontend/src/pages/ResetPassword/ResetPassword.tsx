import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css"; // Ajout du fichier CSS

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!token) {
      setError("⛔ Token invalide ou expiré.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("⚠️ Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/api/auth/reset-password", { token, newPassword });
      setMessage("✅ " + response.data.message + " Vous serez redirigé vers la connexion...");

      // ✅ Redirection automatique vers /login après 3 secondes
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || "❌ Une erreur s'est produite.");
    }
  };

  return (
    <div className="reset-password-container">
      <h2>🔒 Réinitialisation du mot de passe</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {!message && (
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmez le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">🔄 Réinitialiser</button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
