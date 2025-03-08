interface ButtonProps {
  className: string;
  icon: string;
  title: string;
  text: string | null;
}

export const getFriendButtonProps = (
  memberId: string,
  isFriend: boolean,
  hasSentRequest: boolean,
  hasReceivedRequest: boolean
): ButtonProps => {
  const logBase = `🔧 getFriendButtonProps pour ${memberId} - isFriend: ${isFriend}, hasSentRequest: ${hasSentRequest}, hasReceivedRequest: ${hasReceivedRequest}`;

  if (isFriend) {
    console.log(`${logBase} -> Icône sélectionnée: "fas fa-trash-alt" (Supprimer l'ami)`);
    return {
      className: "friend-remove-button",
      icon: "fas fa-trash-alt",
      title: "Supprimer l'ami",
      text: null,
    };
  } else if (hasSentRequest) {
    console.log(`${logBase} -> Icône sélectionnée: "fas fa-hourglass-half" (Demande en attente)`);
    return {
      className: "friend-pending-button",
      icon: "fas fa-hourglass-half",
      title: "Demande en attente",
      text: null,
    };
  } else if (hasReceivedRequest) {
    console.log(`${logBase} -> Icône sélectionnée: "fas fa-user-check" (Demande reçue)`);
    return {
      className: "friend-received-button",
      icon: "fas fa-user-check",
      title: "Demande reçue",
      text: null,
    };
  } else {
    console.log(`${logBase} -> Icône sélectionnée: "fas fa-user-plus" (Ajouter comme ami)`);
    return {
      className: "friend-request-button",
      icon: "fas fa-user-plus",
      title: "Ajouter comme ami",
      text: null,
    };
  }
};