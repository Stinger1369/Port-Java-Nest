import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState, AppDispatch } from "../../../redux/store";
import { sendContactRequest } from "../../../redux/features/contactSlice";
import { fetchPortfolioByUsername } from "../../../redux/features/portfolioSlice";
import "./ContactPortfolio.css";

interface Portfolio { userId: string; }

const ContactScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { firstName, lastName, slug } = useParams<{ firstName: string; lastName: string; slug: string }>();

  const { portfolio, status: portfolioStatus } = useSelector((state: RootState) => state.portfolio);
  const { user } = useSelector((state: RootState) => state.user);
  const { loading, error } = useSelector((state: RootState) => state.contact);

  const [formData, setFormData] = useState({
    senderId: user?.id || null,
    receiverId: "",
    senderEmail: user?.email || "",
    senderPhone: user?.phone || "",
    message: "",
    isDeveloperContact: false,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    company: "",
  });

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (firstName && lastName && slug) {
      dispatch(fetchPortfolioByUsername({ firstName, lastName, slug }));
    }
  }, [dispatch, firstName, lastName, slug]);

  useEffect(() => {
    if (portfolio && !formData.isDeveloperContact) {
      setFormData((prev) => ({ ...prev, receiverId: portfolio.userId }));
    }
  }, [portfolio, formData.isDeveloperContact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReceiverId = formData.isDeveloperContact ? "67b9dc8e204697696b571ebd" : formData.receiverId;

    // Vérification pour utilisateur connecté
    if (user && user.id === finalReceiverId && !formData.isDeveloperContact) {
      setLocalError("Vous ne pouvez pas vous contacter vous-même.");
      return;
    }

    // Envoyer la requête et laisser le backend gérer les autres cas
    setLocalError(null);
    dispatch(
      sendContactRequest({
        ...formData,
        receiverId: finalReceiverId,
      })
    ).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setFormData({
          ...formData,
          senderEmail: user?.email || "",
          senderPhone: user?.phone || "",
          message: "",
          isDeveloperContact: false,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          company: "",
        });
      } else if (result.meta.requestStatus === "rejected") {
        setLocalError(result.payload as string);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isDeveloperContact: e.target.checked }));
    setLocalError(null);
  };

  if (portfolioStatus === "loading") {
    return <p>⏳ Chargement...</p>;
  }

  if (!firstName || !lastName || !slug) {
    return <p>❌ Accès invalide. Veuillez spécifier un portfolio.</p>;
  }

  return (
    <div className="contact-screen-container">
      <h1>
        Contacter{" "}
        {formData.isDeveloperContact
          ? "le développeur"
          : `${firstName} ${lastName}`}
      </h1>

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="firstName">Prénom</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={!!user}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Nom</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={!!user}
          />
        </div>

        <div className="form-group">
          <label htmlFor="senderEmail">Email</label>
          <input
            type="email"
            id="senderEmail"
            name="senderEmail"
            value={formData.senderEmail}
            onChange={handleChange}
            required={!user}
            disabled={!!user}
          />
        </div>

        <div className="form-group">
          <label htmlFor="senderPhone">Téléphone</label>
          <input
            type="tel"
            id="senderPhone"
            name="senderPhone"
            value={formData.senderPhone}
            onChange={handleChange}
            required={!user}
            disabled={!!user}
          />
        </div>

        <div className="form-group">
          <label htmlFor="company">Entreprise (facultatif)</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Écrivez votre message ici..."
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.isDeveloperContact}
              onChange={handleCheckboxChange}
            />
            Contacter le développeur à la place
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      {localError && <p className="error-message">{localError}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ContactScreen;