import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchPendingContacts, acceptContactRequest } from "../../../redux/features/contactSlice";
import "./OffersReceived.css";

interface Contact {
  id: string;
  senderId: string | null;
  receiverId: string;
  isAccepted: boolean;
  senderEmail: string | null;
  senderPhone: string | null;
  message: string | null;
  senderName: string;
  receiverName: string;
  isDeveloperContact: boolean;
}

const OffersReceived: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingContacts, loading, error } = useSelector((state: RootState) => state.contact);

  useEffect(() => {
    dispatch(fetchPendingContacts());
  }, [dispatch]);

  const handleAccept = (contactId: string) => {
    dispatch(acceptContactRequest(contactId)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        // Rafraîchir immédiatement les pendingContacts pour éviter les décalages
        dispatch(fetchPendingContacts());
      }
    });
  };

  if (loading) {
    return <p>⏳ Chargement des demandes...</p>;
  }

  if (error) {
    return <p className="error-message">❌ Erreur : {error}</p>;
  }

  if (pendingContacts.length === 0) {
    return (
      <div className="offers-received-container">
        <h1>Demandes de contact reçues</h1>
        <p>Aucune demande de contact en attente.</p>
      </div>
    );
  }

  return (
    <div className="offers-received-container">
      <h1>Demandes de contact reçues</h1>
      <ul className="contact-list">
        {pendingContacts.map((contact) => (
          <li key={contact.id} className="contact-item">
            <div className="contact-details">
              <p><strong>De :</strong> {contact.senderName}</p>
              {contact.senderEmail && <p><strong>Email :</strong> {contact.senderEmail}</p>}
              {contact.senderPhone && <p><strong>Téléphone :</strong> {contact.senderPhone}</p>}
              {contact.message && <p><strong>Message :</strong> {contact.message}</p>}
              <p><strong>Type :</strong> {contact.isDeveloperContact ? "Développeur" : "Utilisateur"}</p>
            </div>
            <button
              className="accept-button"
              onClick={() => handleAccept(contact.id)}
            >
              ✅ Accepter
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OffersReceived;