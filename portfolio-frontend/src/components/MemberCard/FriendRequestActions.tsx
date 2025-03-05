import React, { useCallback, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import { User } from "../../redux/features/userSlice";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  fetchPendingReceivedFriendRequests,
  fetchPendingSentFriendRequests,
  fetchFriends,
} from "../../redux/features/friendRequestSlice";
import "./FriendRequestActions.css";

interface FriendRequestActionsProps {
  member: User;
  pendingReceivedRequests?: any[];
  pendingSentRequests?: any[];
  friends?: any[];
}

const FriendRequestActions: React.FC<FriendRequestActionsProps> = ({
  member,
  pendingReceivedRequests = [],
  pendingSentRequests = [],
  friends = [],
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"reject" | "remove" | null>(null);
  const [localPendingSent, setLocalPendingSent] = useState<any[]>(pendingSentRequests);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Synchronisation de l'état local avec les props
  useEffect(() => {
    setLocalPendingSent(pendingSentRequests);
  }, [pendingSentRequests]);

  // Vérification des statuts avec gestion des cas undefined/null
  const pendingReceivedRequest = pendingReceivedRequests.find(
    (req) => req?.senderId === member.id && req?.status === "PENDING"
  );
  const pendingSentRequest = localPendingSent.find(
    (req) => req?.receiverId === member.id && req?.status === "PENDING"
  );
  const isFriend = friends.some((friend) => friend?.id === member.id);
  const isCurrentUser = currentUser?.id === member.id;

  // Envoi d'une demande d'ami
  const handleSendFriendRequest = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUser || isCurrentUser) return;

      dispatch(
        sendFriendRequest({
          senderId: currentUser.id,
          receiverId: member.id,
        })
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled" && currentUser?.id) {
          // Mise à jour locale immédiate
          setLocalPendingSent((prev) => [
            ...prev,
            {
              id: result.payload?.id || `${currentUser.id}-${member.id}-${Date.now()}`, // ID temporaire
              senderId: currentUser.id,
              receiverId: member.id,
              status: "PENDING",
            },
          ]);
          dispatch(fetchPendingSentFriendRequests(currentUser.id));
        } else if (result.meta.requestStatus === "rejected") {
          console.error("❌ Erreur lors de l'envoi de la demande d'ami:", result.payload);
        }
      });
    },
    [dispatch, currentUser, isCurrentUser, member.id]
  );

  // Acceptation d'une demande d'ami
  const handleAcceptFriendRequest = useCallback(
    (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      setIsModalOpen(false);
      dispatch(acceptFriendRequest(requestId)).then((result) => {
        if (result.meta.requestStatus === "fulfilled" && currentUser?.id) {
          dispatch(fetchPendingReceivedFriendRequests(currentUser.id));
          dispatch(fetchFriends(currentUser.id));
        } else if (result.meta.requestStatus === "rejected") {
          console.error("❌ Erreur lors de l'acceptation de la demande:", result.payload);
        }
      });
    },
    [dispatch, currentUser]
  );

  // Rejet d'une demande d'ami
  const handleRejectFriendRequest = useCallback(
    (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      setShowConfirm("reject");
    },
    []
  );

  const confirmReject = useCallback(
    (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      setIsModalOpen(false);
      setShowConfirm(null);
      dispatch(rejectFriendRequest(requestId)).then((result) => {
        if (result.meta.requestStatus === "fulfilled" && currentUser?.id) {
          dispatch(fetchPendingReceivedFriendRequests(currentUser.id));
        } else if (result.meta.requestStatus === "rejected") {
          console.error("❌ Erreur lors du rejet de la demande:", result.payload);
        }
      });
    },
    [dispatch, currentUser]
  );

  // Annulation d'une demande d'ami
  const handleCancelFriendRequest = useCallback(
    (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      setIsModalOpen(false);
      dispatch(cancelFriendRequest(requestId)).then((result) => {
        if (result.meta.requestStatus === "fulfilled" && currentUser?.id) {
          setLocalPendingSent((prev) => prev.filter((req) => req.id !== requestId));
          dispatch(fetchPendingSentFriendRequests(currentUser.id));
        } else if (result.meta.requestStatus === "rejected") {
          console.error("❌ Erreur lors de l'annulation de la demande:", result.payload);
        }
      });
    },
    [dispatch, currentUser]
  );

  // Suppression d'un ami
  const handleRemoveFriend = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowConfirm("remove");
    },
    []
  );

  const confirmRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsModalOpen(false);
      setShowConfirm(null);
      if (!currentUser || isCurrentUser) return;

      dispatch(
        removeFriend({
          userId: currentUser.id,
          friendId: member.id,
        })
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled" && currentUser?.id) {
          dispatch(fetchFriends(currentUser.id));
        } else if (result.meta.requestStatus === "rejected") {
          console.error("❌ Erreur lors de la suppression de l'ami:", result.payload);
        }
      });
    },
    [dispatch, currentUser, isCurrentUser, member.id]
  );

  const cancelConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(null);
  }, []);

  // Gestion de l'ouverture du modal
  const openModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  }, []);

  // Gestion de la fermeture du modal
  const closeModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(false);
  }, []);

  // Gestion au clavier pour le bouton principal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (pendingReceivedRequest || isFriend) {
          setIsModalOpen(true);
        } else {
          handleSendFriendRequest(e as any);
        }
      } else if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    },
    [pendingReceivedRequest, isFriend, isModalOpen, handleSendFriendRequest]
  );

  // Déterminer le texte et l'icône du bouton principal
  let buttonText = "Ajouter";
  let buttonIcon = "fas fa-user-plus";
  let buttonClass = "friend-request-button";
  let actionHandler = handleSendFriendRequest;

  if (pendingReceivedRequest) {
    buttonText = "Demande reçue";
    buttonIcon = "fas fa-user-clock";
    buttonClass = "friend-request-button pending";
  } else if (pendingSentRequest) {
    buttonText = "Demande envoyée";
    buttonIcon = "fas fa-user-clock";
    buttonClass = "friend-request-button pending-sent";
    actionHandler = (e: React.MouseEvent) => handleCancelFriendRequest(e, pendingSentRequest.id);
  } else if (isFriend) {
    buttonText = "Amis";
    buttonIcon = "fas fa-user-check";
    buttonClass = "friend-request-button friends";
  }

  // Si currentUser n'est pas défini, retourner un état de secours
  if (!currentUser) {
    return (
      <div className="friend-actions">
        <button className="friend-request-button disabled" disabled>
          <i className="fas fa-user-plus"></i>
          <span>Ajouter</span>
        </button>
      </div>
    );
  }

  return (
    <div className="friend-actions">
      <div className="friend-actions-container">
        <button
          ref={buttonRef}
          className={buttonClass}
          onClick={pendingReceivedRequest || isFriend ? openModal : actionHandler}
          onKeyDown={handleKeyDown}
          title={buttonText}
          aria-label={buttonText}
        >
          <i className={buttonIcon}></i>
          <span>{buttonText}</span>
        </button>

        {/* Modal pour "Demande reçue" ou "Amis" */}
        {isModalOpen && (pendingReceivedRequest || isFriend) && (
          <div className="friend-modal-overlay">
            <div className="friend-modal-content">
              <h3>
                {pendingReceivedRequest
                  ? "Gérer la demande d'ami"
                  : "Gérer la relation d'ami"}
              </h3>
              <p>
                {pendingReceivedRequest
                  ? `Demande d'ami reçue de ${member.firstName} ${member.lastName}`
                  : `${member.firstName} ${member.lastName} est votre ami`}
              </p>
              <div className="friend-modal-actions">
                {pendingReceivedRequest && (
                  <>
                    <button
                      className="accept-friend-button"
                      onClick={(e) => handleAcceptFriendRequest(e, pendingReceivedRequest.id)}
                    >
                      <i className="fas fa-check"></i> Accepter
                    </button>
                    <button
                      className="reject-friend-button"
                      onClick={(e) => handleRejectFriendRequest(e, pendingReceivedRequest.id)}
                    >
                      <i className="fas fa-times"></i> Rejeter
                    </button>
                  </>
                )}
                {isFriend && (
                  <button className="remove-friend-button" onClick={handleRemoveFriend}>
                    <i className="fas fa-user-minus"></i> Supprimer
                  </button>
                )}
                <button className="close-modal-button" onClick={closeModal}>
                  <i className="fas fa-times"></i> Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>{showConfirm === "reject" ? "Rejeter la demande ?" : "Supprimer l'ami ?"}</h3>
            <p>
              {showConfirm === "reject"
                ? `Êtes-vous sûr de vouloir rejeter la demande d'ami de ${member.firstName} ${member.lastName} ?`
                : `Êtes-vous sûr de vouloir supprimer ${member.firstName} ${member.lastName} de vos amis ?`}
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-button"
                onClick={(e) =>
                  showConfirm === "reject"
                    ? confirmReject(e, pendingReceivedRequest!.id)
                    : confirmRemove(e)
                }
              >
                Oui
              </button>
              <button className="cancel-button" onClick={cancelConfirm}>
                Non
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequestActions;