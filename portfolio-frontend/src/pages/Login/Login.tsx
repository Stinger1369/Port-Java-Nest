import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await dispatch(login({ email, password }) as any);
    if (login.fulfilled.match(result)) {
      navigate("/profile");
    } else {
      setError("Échec de la connexion, vérifiez vos identifiants.");
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Se connecter</button>
      </form>
      <p>
        <a href="/forgot-password">Mot de passe oublié ?</a>
      </p>
    </div>
  );
};

export default Login;
