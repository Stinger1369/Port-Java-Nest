import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchPendingContacts, fetchAcceptedContacts } from "../../../redux/features/contactSlice";
import "./ContactHistory.css";

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
  createdAt?: string;
  acceptedAt?: string;
}

const ContactHistory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingContacts, acceptedContacts, loading, error } = useSelector((state: RootState) => state.contact);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const allContacts = Array.from(
    new Map([...pendingContacts, ...acceptedContacts].map(contact => [contact.id, contact])).values()
  );

  useEffect(() => {
    console.log("🔄 Fetching contact history...");
    dispatch(fetchPendingContacts());
    dispatch(fetchAcceptedContacts());
  }, [dispatch]);

  useEffect(() => {
    console.log("📋 Pending contacts:", pendingContacts);
    console.log("📋 Accepted contacts:", acceptedContacts);
    console.log("📋 All contacts:", allContacts);
  }, [pendingContacts, acceptedContacts]);

  useEffect(() => {
    console.log("📋 All contacts mapped:", allContacts.map(c => ({ id: c.id, senderName: c.senderName, senderId: c.senderId })));
  }, [allContacts]);

  const openModal = (contact: Contact) => setSelectedContact(contact);
  const closeModal = () => setSelectedContact(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <p>⏳ Chargement de l'historique...</p>;
  }

  if (error) {
    return <p className="error-message">❌ Erreur : {error}</p>;
  }

  if (allContacts.length === 0) {
    return (
      <div className="contact-history-container">
        <h1>Historique des contacts</h1>
        <p>Aucune demande de contact dans l'historique.</p>
      </div>
    );
  }

  return (
    <div className="contact-history-container">
      <h1>Historique des contacts</h1>
      <ul className="contact-list">
        {allContacts.map((contact) => (
          <li key={contact.id} className="contact-item">
            <div className="contact-summary">
              <p><i className="fas fa-user"></i><strong>De :</strong> {contact.senderName}</p>
              <p><i className="fas fa-check-circle"></i><strong>Statut :</strong> {contact.isAccepted ? "Accepté" : "En attente"}</p>
            </div>
            <div className="contact-actions">
              <button className="details-button" onClick={() => openModal(contact)}>
                <i className="fas fa-info-circle"></i> Détails
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedContact && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2><i className="fas fa-address-book"></i> Détails du contact</h2>
            <p><i className="fas fa-user"></i><strong>De :</strong> {selectedContact.senderName}</p>
            {selectedContact.senderEmail && <p><i className="fas fa-envelope"></i><strong>Email :</strong> {selectedContact.senderEmail}</p>}
            {selectedContact.senderPhone && <p><i className="fas fa-phone"></i><strong>Téléphone :</strong> {selectedContact.senderPhone}</p>}
            {selectedContact.message && <p><i className="fas fa-comment"></i><strong>Message :</strong> {selectedContact.message}</p>}
            <p><i className="fas fa-user-tag"></i><strong>Type :</strong> {selectedContact.isDeveloperContact ? "Développeur" : "Utilisateur"}</p>
            <p><i className="fas fa-check-circle"></i><strong>Statut :</strong> {selectedContact.isAccepted ? "Accepté" : "En attente"}</p>
            <p><i className="fas fa-clock"></i><strong>Créé le :</strong> {formatDate(selectedContact.createdAt)}</p>
            {selectedContact.isAccepted && (
              <p><i className="fas fa-calendar-check"></i><strong>Accepté le :</strong> {formatDate(selectedContact.acceptedAt)}</p>
            )}
            <div className="modal-actions">
              <button className="close-button" onClick={closeModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactHistory;