import React, { useState } from "react";
import { Href, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { FIREBASE_AUTH } from "../../FirebaseConfig"; // Firebase configuration
import { useRouter } from "expo-router";
import ConfirmationModal from "../../components/ConfirmationModal";
import { showAlert } from "../utilities/crossPlatformAlerts";

// Update Friend interface to include username
interface Friend {
  id: string;
  username?: string; // Make username optional in case some users don't have it
  firstName?: string;
  lastName?: string;
}

interface IncomingRequest {
  id: string;
  senderName: string;
  senderId: string;
  receiverId: string;
  senderUsername?: string; // Add username for incoming requests too
}

const Friends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(
    []
  );
  const [friendEmail, setFriendEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
      unsub();
      if (authObj) {
        setUserId(authObj.uid);
        fetchFriends(authObj.uid);
        fetchIncomingRequests(authObj.uid);
        setDataFetched(true); // Set dataFetched to true to stop further fetching
      } else {
        showAlert("Error", "You must be logged in to view friends.");
        return;
      }
    });
  };

  const fetchFriends = async (userId: string) => {
    try {
      // Fetch friends, now including names and usernames
      const response = await api.get(`/api/friends/friends/${userId}`);
      setFriends(response.data.friends); // Assuming response contains the 'friends' array with username
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchIncomingRequests = async (userId: string) => {
    try {
      // Updated API route for fetching incoming friend requests
      const response = await api.get(`/api/friends/incoming/${userId}`);
      setIncomingRequests(response.data.incomingRequests); // Assuming response contains the incomingRequests array
    } catch (error) {
      console.error("Error fetching incoming requests:", error);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendEmail) {
      showAlert("Error", "Please enter an email.");
      return;
    }

    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      showAlert("Error", "You must be logged in to send a friend request.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/friends/send", {
        senderId: currentUser.uid,
        receiverEmail: friendEmail,
      });
      showAlert("Success", response.data.message);
      setFriendEmail(""); // Clear email input
      setModalVisible(false); // Close modal
      setDataFetched(false); // Reset fetching state to allow re-fetching
    } catch (error) {
      console.error("Error sending friend request:", error);
  
      // Type guard to check if error is an object with the expected structure
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            data?: { 
              message?: string 
            } 
          } 
        };
        
        if (axiosError.response?.data?.message) {
          showAlert("Error", axiosError.response.data.message);
        } else {
          showAlert("Error", "Failed to send friend request. Please try again later.");
        }
      } else {
        showAlert("Error", "Failed to send friend request. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (
    requestId: string,
    senderId: string,
    receiverId: string,
    senderName: string,
    senderUsername?: string
  ) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      showAlert("Error", "You must be logged in to accept friend requests.");
      return;
    }

    try {
      // Optimistically update the UI by removing the request locally
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );

      // Fix: Split senderName into firstName and lastName
      // This is a simple approach - you might need to adjust based on your actual data format
      const nameParts = senderName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Immediately add the new friend to the friends list with correct property names
      setFriends((prevFriends) => [
        ...prevFriends,
        { 
          id: senderId, 
          firstName: firstName,
          lastName: lastName,
          username: senderUsername 
        },
      ]);

      const response = await api.post(`/api/friends/accept`, {
        sender_id: senderId,
        receiver_id: receiverId,
      });

      showAlert("Success", response.data.message);
      setDataFetched(false); // Re-fetch the data after accepting
    } catch (error) {
      console.error("Error accepting friend request:", error);
      // Rollback the optimistic update in case of failure
      setDataFetched(false);
    }
  };

  const denyFriendRequest = async (
    requestId: string,
    senderId: string,
    receiverId: string
  ) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      showAlert("Error", "You must be logged in to deny friend requests.");
      return;
    }

    try {
      // Optimistically update the UI by removing the request locally
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );

      const response = await api.post(`/api/friends/deny`, {
        sender_id: senderId,
        receiver_id: receiverId,
      });

      showAlert("Success", response.data.message);
      setDataFetched(false); // Re-fetch the data after denying
    } catch (error) {
      console.error("Error denying friend request:", error);
      // Rollback the optimistic update in case of failure
      setDataFetched(false);
    }
  };

  const unfriend = async (friendId: string) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      showAlert("Error", "You must be logged in to unfriend.");
      return;
    }

    try {
      const response = await api.post("/api/friends/unfriend", {
        userId: currentUser.uid,
        friendId: friendId,
      });
      showAlert("Success", response.data.message);

      // Update local state by filtering out the unfriended friend
      setFriends((prevFriends) =>
        prevFriends.filter((friend) => friend.id !== friendId)
      );
    } catch (error) {
      console.error("Error unfriending:", error);
      showAlert("Error", "Failed to unfriend user.");
    }
  };

  const handleUnfriend = (friendId: string) => {
    setFriendToRemove(friendId);
    setConfirmationModalVisible(true);
  };

  const confirmUnfriend = async () => {
    if (friendToRemove) {
      await unfriend(friendToRemove);
      setConfirmationModalVisible(false);
      setFriendToRemove(null);
    }
  };

  const cancelUnfriend = () => {
    setConfirmationModalVisible(false);
    setFriendToRemove(null);
  };

  // Helper function to get display name safely
  const getDisplayName = (friend: Friend) => {
    // If firstName and lastName are available, use them
    if (friend.firstName || friend.lastName) {
      return `${friend.firstName || ''} ${friend.lastName || ''}`.trim();
    }
    // Fallback to username if name parts aren't available
    return friend.username ? `User: ${friend.username}` : "Unknown User";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={[styles.section, styles.friendsSection]}>
          <Text style={styles.title}>Your Friends</Text>
          <ScrollView style={styles.scrollable}>
            {friends.length === 0 ? (
              <Text>No friends yet</Text>
            ) : (
              friends.map((friend) => (
                <View key={friend.id} style={styles.friendRow}>
                  <TouchableOpacity
                    style={styles.friendCard}
                    onPress={() =>
                      router.push(
                        `/profile/${friend.id}` as Href<`/profile/${string}`>
                      )
                    }
                  >
                    {/* Updated to match community page style */}
                    <View style={styles.memberCard}>
                      <Text>{getDisplayName(friend)}</Text>
                      {friend.username && (
                        <Text style={styles.usernameText}>@{friend.username}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleUnfriend(friend.id)}>
                    <Ionicons name="person-remove" size={24} color="red" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() =>
                      router.push(
                        `/chat/${userId}/${friend.id}` as Href<`/chat/${string}/${string}`>
                      )
                    }
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={30}
                      color="#007bff"
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <ConfirmationModal
          visible={confirmationModalVisible}
          onCancel={cancelUnfriend}
          onConfirm={confirmUnfriend}
          message="Are you sure you want to remove this friend?"
        />

        <View style={[styles.section, styles.requestsSection]}>
          <Text style={styles.title}>Incoming Friend Requests</Text>
          <ScrollView style={styles.scrollable}>
            {incomingRequests.length === 0 ? (
              <Text>No incoming requests</Text>
            ) : (
              incomingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  {/* Updated to properly display name and username for requests */}
                  <View style={styles.requestInfo}>
                    <Text style={styles.nameText}>{request.senderName}</Text>
                    {request.senderUsername && (
                      <Text style={styles.usernameText}>@{request.senderUsername}</Text>
                    )}
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() =>
                        acceptFriendRequest(
                          request.id,
                          request.senderId,
                          request.receiverId,
                          request.senderName,
                          request.senderUsername
                        )
                      }
                    >
                      <Text style={styles.accept}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.denyButton}
                      onPress={() =>
                        denyFriendRequest(
                          request.id,
                          request.senderId,
                          request.receiverId
                        )
                      }
                    >
                      <Text style={styles.deny}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.sendRequestButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.sendRequestText}>Send Friend Request</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Enter friend's email"
              value={friendEmail}
              onChangeText={setFriendEmail}
            />
            <Button
              title={loading ? "Sending..." : "Send Request"}
              onPress={sendFriendRequest}
              disabled={loading}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  contentContainer: {
    flexGrow: 1,
    margin: 16,
  },
  section: {
    marginBottom: 20,
  },
  friendsSection: {
    height: "50%",
  },
  requestsSection: {
    height: "50%",
  },
  scrollable: {
    maxHeight: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  friendCard: {
    flexGrow: 1,
    width: "auto",
    height: "100%",
    padding: 10,
  },
  friendRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 10,
  },
  memberCard: {
    justifyContent: "center",
  },
  nameText: {
    fontSize: 14,
    fontWeight: "500",
  },
  usernameText: {
    color: "#6c757d",
    fontSize: 12,
  },
  requestCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
  },
  acceptButton: {
    marginRight: 10,
  },
  denyButton: {
    marginLeft: 5,
  },
  accept: {
    color: "green",
  },
  deny: {
    color: "red",
  },
  sendRequestButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  sendRequestText: {
    color: "#fff",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  closeButton: {
    marginTop: 20,
  },
  chatButton: {
    marginLeft: 5
  }
});

export default Friends;