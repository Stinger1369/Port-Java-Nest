import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { verifyEmail, resendVerificationCode } from "../../../redux/features/authSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./VerifyAccount.css";

const VerifyAccount = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setErrorMessage(t("verifyAccount.invalidCode", "Veuillez entrer un code de 6 chiffres."));
      return;
    }

    const result = await dispatch(verifyEmail({ email, code: verificationCode }) as any);
    if (verifyEmail.fulfilled.match(result)) {
      setSuccessMessage(t("verifyAccount.success", "Votre compte a été vérifié avec succès ! Vous pouvez maintenant vous connecter."));
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setErrorMessage(t("verifyAccount.verificationFailed", "Échec de la vérification. Veuillez vérifier votre code."));
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setErrorMessage(null);
    try {
      await dispatch(resendVerificationCode({ email })).unwrap();
      setSuccessMessage(t("verifyAccount.resendSuccess", "Un nouveau code a été envoyé à votre email."));
      setResendDisabled(false); // Réactiver si succès
    } catch (err) {
      const errorMsg = err ? String(err) : t("verifyAccount.resendError", "Erreur lors de l'envoi du nouveau code.");

      // Vérifier si l'erreur est liée à la limite de débit
      if (errorMsg.includes("Trop de demandes de code")) {
        const match = errorMsg.match(/attendre (\d+) minutes/);
        if (match) {
          const minutes = parseInt(match[1], 10);
          setRemainingMinutes(minutes);
          setResendDisabled(true);
          // Traduire le message avec le nombre de minutes
          setErrorMessage(t("verifyAccount.tooManyRequests", "Trop de demandes de code. Veuillez attendre {{minutes}} minutes.", { minutes }));

          // Compte à rebours pour réactiver le bouton
          const interval = setInterval(() => {
            setRemainingMinutes((prev) => {
              if (prev && prev > 1) return prev - 1;
              clearInterval(interval);
              setResendDisabled(false);
              return null;
            });
          }, 60000); // 1 minute
        } else {
          setErrorMessage(errorMsg);
        }
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("").slice(0, 6);
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="verify-account-container">
      <h2 className="verify-account-title">{t("verifyAccount.title", "Vérification du compte")}</h2>
      <p className="verify-account-message">
        {t("verifyAccount.message", "Un code de vérification a été envoyé à ")} <strong>{email}</strong>. {t("verifyAccount.validity", "Il est valide pendant 15 minutes.")}
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
          {t("verifyAccount.verifyButton", "Vérifier")}
        </button>
      </form>
      <button
        onClick={handleResendCode}
        disabled={resendLoading || !email || resendDisabled}
        className="resend-btn"
      >
        {resendLoading
          ? t("verifyAccount.resendLoading", "Envoi en cours...")
          : resendDisabled && remainingMinutes
          ? t("verifyAccount.resendDisabled", "Attendre {{minutes}} min", { minutes: remainingMinutes })
          : t("verifyAccount.resendButton", "Renvoyer un nouveau code")}
      </button>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default VerifyAccount;