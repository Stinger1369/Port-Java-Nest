import { useState } from "react";
import { useDispatch } from "react-redux";
import { login, forgotPassword } from "../../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [unverified, setUnverified] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false); // Nouvel état
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setUserNotFound(false); // Réinitialiser cet état

    console.log("📤 Données envoyées :", { email, password });

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      navigate("/profile");
    } catch (err) {
      console.error("❌ Échec de connexion :", err);
      if (err === "Account not verified. Check your email.") {
        setError("Votre compte n'est pas encore vérifié. Vérifiez votre email.");
        setUnverified(true);
      } else if (err === "User not found.") {
        setError("Utilisateur non trouvé. Voulez-vous créer un compte ?");
        setUserNotFound(true); // Activer cet état pour afficher le bouton
      } else {
        setError("Échec de la connexion, vérifiez vos identifiants.");
      }
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      alert("✅ Un nouveau code de vérification a été envoyé à votre email.");
    } catch (err) {
      alert("❌ Erreur lors de l'envoi du code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>

      {/* Boutons pour compte non vérifié */}
      {unverified && (
        <div className="verify-options">
          <p>Votre compte n'est pas encore vérifié.</p>
          <button
            onClick={() => navigate(`/verify-account?email=${email}`)}
            className="verify-btn"
          >
            🔍 Vérifier mon compte
          </button>
          <button
            onClick={handleResendCode}
            disabled={resendLoading}
            className="resend-btn"
          >
            {resendLoading ? "📩 Envoi en cours..." : "🔄 Renvoyer le code"}
          </button>
        </div>
      )}

      {/* Bouton pour créer un compte si l'utilisateur n'existe pas */}
      {userNotFound && (
        <div className="register-option">
          <button
            onClick={() => navigate("/register")}
            className="register-btn"
          >
            ✍️ Créer un compte
          </button>
        </div>
      )}

      <p>
        <a href="/forgot-password">Mot de passe oublié ?</a>
      </p>
    </div>
  );
};

export default Login;