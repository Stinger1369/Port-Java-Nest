import { Dispatch } from "@reduxjs/toolkit";
import {
  addSentRequest,
  addReceivedRequest,
  addFriend,
  removeReceivedRequest,
  removeSentRequest,
  removeFriendFromList,
  fetchSentFriendRequests,
  fetchReceivedFriendRequests,
} from "../redux/features/friendSlice";

interface FriendData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl: string | null;
}

export const handleFriendNotifications = (
  dispatch: Dispatch<any>,
  userId: string,
  notificationType: string,
  fromUserId: string,
  toUserId: string,
  friendId: string,
  friendData: FriendData,
  sentRequests: FriendData[],
  receivedRequests: FriendData[],
  friends: FriendData[]
) => {
  switch (notificationType) {
    case "friend_request_received":
      if (userId === toUserId || userId !== fromUserId) { // Receiver
        dispatch(addReceivedRequest(friendData));
        dispatch(fetchReceivedFriendRequests(userId));
        console.log("✅ Demande reçue ajoutée:", friendData);
      }
      break;

    case "friend_request_sent":
      if (userId === fromUserId) { // Sender
        dispatch(addSentRequest(friendData));
        dispatch(fetchSentFriendRequests(userId));
        console.log("✅ Demande envoyée ajoutée:", friendData);
      }
      break;

    case "friend_request_accepted":
      console.log("🔍 Traitement de friend_request_accepted - userId:", userId, "fromUserId:", fromUserId, "toUserId:", toUserId, "friendId:", friendId);
      if (userId === toUserId || userId !== fromUserId) { // Receiver
        dispatch(addFriend(friendData));
        dispatch(removeReceivedRequest(fromUserId));
        dispatch(fetchReceivedFriendRequests(userId));
        console.log("✅ Demande acceptée (destinataire), ami ajouté:", friendData, "supprimée de receivedRequests:", fromUserId);
      } else if (userId === fromUserId) { // Sender
        dispatch(addFriend(friendData));
        dispatch(removeSentRequest(friendId));
        dispatch(fetchSentFriendRequests(userId));
        console.log("✅ Demande acceptée (expéditeur), ami ajouté:", friendData, "supprimée de sentRequests:", friendId);
      }
      break;

   case "friend_request_rejected":
  console.log("🔍 Traitement de friend_request_rejected - userId:", userId, "friendId:", friendId, "fromUserId:", fromUserId, "toUserId:", toUserId);
  if (userId === toUserId) { // Sender (celui qui a envoyé la demande)
    dispatch(removeSentRequest(friendId));
    dispatch(fetchSentFriendRequests(userId));
    console.log("✅ Demande rejetée (expéditeur), supprimée de sentRequests:", friendId);
  } else if (userId === fromUserId) { // Receiver (celui qui rejette)
    dispatch(removeReceivedRequest(friendId));
    dispatch(fetchReceivedFriendRequests(userId));
    console.log("✅ Demande rejetée (destinataire), supprimée de receivedRequests:", friendId);
  }
  console.log("✅ État après rejet - friendId:", friendId, "sentRequests:", sentRequests, "receivedRequests:", receivedRequests);
  break;

    case "friend_removed":
      console.log("🔍 Traitement de friend_removed - userId:", userId, "friendId:", friendId, "fromUserId:", fromUserId, "toUserId:", toUserId);
      dispatch(removeFriendFromList(friendId));
      dispatch(removeSentRequest(friendId));
      dispatch(removeReceivedRequest(friendId));
      dispatch(fetchSentFriendRequests(userId));
      dispatch(fetchReceivedFriendRequests(userId));
      console.log("✅ État nettoyé après friend_removed - friendId:", friendId, "sentRequests:", sentRequests, "receivedRequests:", receivedRequests, "friends:", friends);
      break;

    case "friend_request_canceled":
      console.log("🔍 Traitement de friend_request_canceled - userId:", userId, "friendId:", friendId, "fromUserId:", fromUserId, "toUserId:", toUserId);
      if (userId === fromUserId) { // Sender
        dispatch(removeSentRequest(friendId));
        dispatch(fetchSentFriendRequests(userId));
        console.log("✅ Demande annulée (expéditeur), supprimée de sentRequests:", friendId);
      } else if (userId !== fromUserId) { // Receiver
        dispatch(removeReceivedRequest(fromUserId));
        dispatch(fetchReceivedFriendRequests(userId));
        console.log("✅ Demande annulée (destinataire), supprimée de receivedRequests:", fromUserId);
      }
      break;

    default:
      console.warn("⚠️ Notification non gérée:", notificationType);
  }
};