import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { verifyEmail } from "../../../redux/features/authSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./VerifyAccount.css";

const VerifyAccount = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]); // Tableau pour stocker les 6 chiffres
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Message de succès
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Message d'erreur
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Références pour les champs de saisie

  // Gérer la vérification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null); // Réinitialiser les messages
    setErrorMessage(null);

    const verificationCode = code.join(""); // Concaténer les chiffres pour former le code complet
    if (verificationCode.length !== 6) {
      setErrorMessage("Veuillez entrer un code de 6 chiffres.");
      return;
    }

    const result = await dispatch(verifyEmail({ email, code: verificationCode }) as any);
    if (verifyEmail.fulfilled.match(result)) {
      setSuccessMessage("Votre compte a été vérifié avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => {
        navigate("/login"); // Rediriger après un délai pour permettre à l'utilisateur de voir le message
      }, 3000); // Redirection après 3 secondes
    } else {
      setErrorMessage("Échec de la vérification. Veuillez vérifier votre code.");
    }
  };

  // Gérer le changement dans chaque champ
  const handleChange = (index: number, value: string) => {
    // Ne permettre qu’un seul chiffre par champ
    if (value.length > 1 || !/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Passer automatiquement au champ suivant si un chiffre est saisi
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Gérer la suppression (Backspace)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Gérer le collage (paste) du code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("").slice(0, 6);
      setCode(newCode);
      inputRefs.current[5]?.focus(); // Mettre le focus sur le dernier champ
    }
  };

  // Mettre le focus sur le premier champ au chargement
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="verify-account-container">
      <h2 className="verify-account-title">Vérification du compte</h2>
      <p className="verify-account-message">
        Un code de vérification a été envoyé à <strong>{email}</strong>. Il est valide pendant 15 minutes.
      </p>
      <form onSubmit={handleVerify} className="verify-account-form">
        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              maxLength={1}
              ref={(el) => (inputRefs.current[index] = el)}
              className="code-input"
              required
            />
          ))}
        </div>
        <button type="submit" className="verify-account-button">
          Vérifier
        </button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default VerifyAccount;