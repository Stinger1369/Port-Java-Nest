import { useState } from "react";
import { useDispatch } from "react-redux";
import { verifyEmail } from "../../../redux/features/authSlice"; // ✅ Correction de l'import
import { useNavigate, useSearchParams } from "react-router-dom";

const VerifyAccount = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(verifyEmail({ email, code }) as any); // ✅ Correction ici
    if (verifyEmail.fulfilled.match(result)) { // ✅ Correction ici
      alert("Votre compte a été vérifié avec succès ! Vous pouvez maintenant vous connecter.");
      navigate("/login");
    } else {
      alert("Échec de la vérification. Veuillez vérifier votre code.");
    }
  };

  return (
    <div>
      <h2>Vérification du compte</h2>
      <p>Un code de vérification a été envoyé à <strong>{email}</strong>. Il est valide pendant 15 minutes.</p>
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Entrez votre code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Vérifier</button>
      </form>
    </div>
  );
};

export default VerifyAccount;
