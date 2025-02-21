import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const Register = () => {
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
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const result = await dispatch(register({ email, password }) as any);
      if (register.fulfilled.match(result)) {
        alert(
          "Inscription réussie ! Un code de vérification a été envoyé à votre email. Il est valide pendant 15 minutes."
        );
        navigate(`/verify-account?email=${encodeURIComponent(email)}`);
      } else {
        alert("Échec de l'inscription");
      }
    } catch (err) {
      alert("Échec de l'inscription : " + (err.message || "Erreur inconnue"));
    }
  };

  return (
    <div>
      <h2>Créer un compte</h2>
      {error && <p style={{ color: "red" }}>{error}</p>} {/* Affichage de l'erreur */}
      <form onSubmit={handleRegister}>
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
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">S'inscrire</button>
      </form>
    </div>
  );
};

export default Register;