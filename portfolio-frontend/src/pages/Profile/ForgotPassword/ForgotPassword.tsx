import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
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
      setMessage(response.data.message);
      setEmailSent(true);
    } catch (error: any) {
      setError(error.response?.data?.error || "Une erreur s'est produite.");
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Mot de passe oublié</h2>

      {message && (
        <div className="success-message">
          <p>{message}</p>
          <p>📩 Veuillez vérifier votre boîte email et suivre le lien pour réinitialiser votre mot de passe.</p>
          <button onClick={() => navigate("/login")}>Retour à la connexion</button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      {!emailSent && (
        <form onSubmit={handleForgotPassword}>
          <input
            type="email"
            placeholder="Entrez votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Envoyer</button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
