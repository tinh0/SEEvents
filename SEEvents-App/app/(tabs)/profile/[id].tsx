import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Platform,
  Button,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import api from "../../api/api";
import { FIREBASE_AUTH, storage } from "../../../FirebaseConfig";
import { signOut } from "firebase/auth";
import {
  Href,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
//import { useMapReload } from "../../utilities/MapReload";
import { showAlert } from "../../utilities/crossPlatformAlerts";
import Feather from "@expo/vector-icons/build/Feather";
import ConfirmationModal from "@/components/ConfirmationModal";

interface User {
  username: string;
  email: string;
  lastName: number;
  firstName: string;
}

const Profile = () => {
  const { id } = useLocalSearchParams();
  const userId = id;
  const [username, setUsername] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [user, setUser] = useState<User>();
  const [isLoading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [storedImage, setStoredImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Add state to track if user signed in with Google
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const loggedInUserId = FIREBASE_AUTH.currentUser?.uid;
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [deletingActivity, setDeletingActivity] = useState(0);
  
  // Add state to track friendship status
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) {
        console.error("No user ID found in URL parameters.");
        return;
      }

      console.log("Profile User ID:", userId);
      console.log("Logged-in User ID:", loggedInUserId);
      console.log("Is Own Profile:", isOwnProfile);

      // Reset state when loading a new profile
      setFriendRequestSent(false);
      setIsFriend(false);
      setFriendRequestLoading(false);

      // Ensure userId is a string (in case it's an array)
      const profileUserId = Array.isArray(userId) ? userId[0] : userId;

      const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
        unsub();
        if (authObj) {
          // Compare the profileUserId with the logged-in user's ID
          setIsOwnProfile(authObj.uid === profileUserId);
          
          // Check if user signed in with Google
          const providerData = authObj.providerData;
          const isGoogle = providerData.some(provider => provider.providerId === 'google.com');
          setIsGoogleUser(isGoogle);
          
          // Check if this user is already a friend
          checkFriendshipStatus(authObj.uid, profileUserId);
        } else {
          console.log("not logged in");
        }
      });

      setLoading(true);

      api
        .get(`/api/users/${profileUserId}`)
        .then((response) => {
          if (response.data && response.data.length > 0) {
            setUser(response.data[0]);
            setProfileImage(response.data[0].pfpUrl);
          } else {
            console.error("User data is empty.");
          }
        })
        .catch((error) => console.error("Error fetching user:", error))
        .finally(() => setLoading(false));

      api
        .get(`/api/users/userActivities/${profileUserId}`)
        .then((response) => setActivities(response.data || []))
        .catch((error) => console.error("Error fetching activities:", error));
    }, [userId])
  );

  // Function to check if the user is already a friend
  const checkFriendshipStatus = async (currentUserId: string, profileUserId: string) => {
    try {
      const response = await api.get(`/api/friends/friends/${currentUserId}`);
      if (response.data && response.data.friends) {
        const friendsList = response.data.friends;
        // Check if the profile user is in the friends list
        const isUserFriend = friendsList.some((friend: { id: any; }) => friend.id === profileUserId);
        setIsFriend(isUserFriend);
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }
  };

  // Function to send a friend request
  const sendFriendRequest = async () => {
    if (isOwnProfile || !user || !loggedInUserId) return;

    try {
      setFriendRequestLoading(true);
      
      // Get the email of the profile user
      const response = await api.post("/api/friends/send", {
        senderId: loggedInUserId,
        receiverEmail: user.email,
      });
      
      showAlert("Success", response.data.message);
      setFriendRequestSent(true);
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
      setFriendRequestLoading(false);
    }
  };

  const pickImage = async () => {
    if (!isOwnProfile) {
      console.log("Cannot change profile image for other users.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setStoredImage(profileImage);
      setImage(result.assets[0].uri);
      setProfileImage(result.assets[0].uri);
      setFileName(result.assets[0].fileName || "default.png");
      setUploading(true);
    }
  };

  const cancelUploadImage = async () => {
    setProfileImage(storedImage);
    setUploading(false);
  };

  const uploadImage = async () => {
    if (!isOwnProfile || !profileImage) return;

    const user = FIREBASE_AUTH.currentUser;
    if (!image || !user) return;

    try {
      setUploading(true); // Indicate that the upload is in progress

      const response = await fetch(image);
      const blob = await response.blob();
      const storageRef = ref(storage, "images");
      const thisImageRef = ref(storageRef, fileName);

      // Upload image to Firebase Storage
      await uploadBytes(thisImageRef, blob);
      console.log("Uploaded a blob or file!");

      // Get the URL of the uploaded image
      const url = await getDownloadURL(thisImageRef);

      // Send the URL to the backend
      const apiResponse = await api.post(
        `/api/users/pfp/${user.uid}`,
        { pfpUrl: url },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      console.log("Profile picture updated:", apiResponse.data);
      setProfileImage(url);
      setImage(null);
      setUploading(false); // Reset uploading state
    } catch (error: any) {
      // Handle API errors or unexpected errors
      if (error.response && error.response.data && error.response.data.error) {
        showAlert("Error", error.response.data.error);
      } else {
        showAlert("Error", "An unexpected error occurred. Please try again.");
      }
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(FIREBASE_AUTH);
      setSettingsVisible(false);
      if (Platform.OS === "web") {
        //triggerReload();
        setTimeout(() => {
          window.location.reload();
        }, 0);
      }
      router.navigate("/");
    } catch (e: any) {
      console.error("Error signing out:", e);
      alert("Sign out failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startDeleteActivity = async (id: number) => {
    setConfirmationModalVisible(true);
    setDeletingActivity(id);
  };

  const confirmDeleteActivity = async () => {
    api.delete(`/api/users/userActivities/${deletingActivity}`).then(() => {
      console.log("success");
      setConfirmationModalVisible(false);
      api
        .get(`/api/users/userActivities/${id}`)
        .then((response) => setActivities(response.data || []))
        .catch((error) => console.error("Error fetching activities:", error));
    });
  };

  const cancelDeleteActivity = async () => {
    setConfirmationModalVisible(false);
  };

  if (isLoading) {
    return <Text className="loading">Loading...</Text>;
  } else {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView style={styles.container}>
          {user && (
            <>
              {/* Header Section */}
              <View style={styles.header}>
                <Text style={styles.profileTitle}>
                  Profile of {user?.username}
                </Text>
                {isOwnProfile && (
                  <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                    <Ionicons name="settings-outline" size={40} color="#333" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Profile Section - Now using the same styling as the activity section */}
              <View style={styles.section}>
                <View style={styles.profileContent}>
                  <TouchableOpacity
                    disabled={!isOwnProfile}
                    onPress={pickImage}
                  >
                    {(profileImage != "" && profileImage != null && (
                      <Image
                        style={styles.profileImage}
                        source={{ uri: profileImage }}
                      />
                    )) || (
                      <Image
                        style={styles.profileImage}
                        source={require("../../../assets/images/missing_image.png")}
                      />
                    )}
                  </TouchableOpacity>
                  {uploading && isOwnProfile && (
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => cancelUploadImage()}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => uploadImage()}
                      >
                        <Text style={styles.buttonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Username row with conditional elements */}
                  <View style={styles.usernameRow}>
                    <Text style={styles.profileName}>{user.username}</Text>
                    {/* Only show message icon if not own profile AND is a friend */}
                    {!isOwnProfile && isFriend && (
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            `/chat/${loggedInUserId}/${userId}` as Href<`/chat/${string}/${string}`>
                          )
                        }
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={30}
                          color="#007bff"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Add Friend Request button if not own profile and not already a friend */}
                  {!isOwnProfile && !isFriend && !friendRequestSent && (
                    <TouchableOpacity
                      style={styles.friendRequestButton}
                      onPress={sendFriendRequest}
                      disabled={friendRequestLoading}
                    >
                      <Text style={styles.friendRequestText}>
                        {friendRequestLoading ? "Sending..." : "Send Friend Request"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show message if friend request was just sent */}
                  {!isOwnProfile && !isFriend && friendRequestSent && (
                    <Text style={styles.requestSentText}>Friend request sent</Text>
                  )}
                  
                  <View style={styles.profileDetails}>
                    <Text style={styles.detailText}>Email: {user.email}</Text>
                    <Text style={styles.detailText}>
                      {user.firstName} {user.lastName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Activity Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Activity</Text>
                <ScrollView>
                  {activities.map((activity: any) => {
                    return (
                      <View key={activity.id} style={styles.activityItem}>
                        {(activity.thumbnailUrl != "" &&
                          activity.thumbnailUrl != null && (
                            <Image
                              style={styles.activityImage}
                              source={{ uri: activity.thumbnailUrl }}
                            />
                          )) ||
                          (activity.communityImage != "" &&
                            activity.communityImage != null && (
                              <Image
                                style={styles.activityImage}
                                source={{ uri: activity.communityImage }}
                              />
                            )) || (
                            <Image
                              style={styles.activityImage}
                              source={require("../../../assets/images/missing_image.png")}
                            />
                          )}
                        <View style={styles.activityTextContainer}>
                          <Text style={styles.activityDate}>
                            {new Date(activity.timestamp).toLocaleDateString(
                              [],
                              {
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Text>
                          <Text style={styles.activityText}>
                            {activity.type === "event_going" &&
                              `${user.username} is attending ${activity.eventName}`}
                            {activity.type === "event_interest" &&
                              `${user.username} is interested in ${activity.eventName}`}
                            {activity.type === "event_comment" &&
                              `${user.username} commented on ${activity.eventName}: "${activity.commentText}"`}
                            {activity.type === "event_like" &&
                              `${user.username} liked the ${activity.eventName}`}
                            {activity.type === "community_create" &&
                              `${user.username} created a community: ${activity.communityName}`}
                            {activity.type === "community_join" &&
                              `${user.username} joined a community: ${activity.communityName}`}
                            {activity.type === "event_create" &&
                              `${user.username} is hosting ${
                                activity.eventName
                              } on ${new Date(
                                activity.eventTime
                              ).toLocaleTimeString([], {
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`}
                          </Text>
                        </View>
                        {isOwnProfile && (
                          <TouchableOpacity
                            onPress={() => {
                              startDeleteActivity(activity.id);
                            }}
                          >
                            <Feather name="trash-2" size={24} color="red" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
              <ConfirmationModal
                visible={confirmationModalVisible}
                onCancel={cancelDeleteActivity}
                onConfirm={confirmDeleteActivity}
                message="Are you sure you want to delete this activity?"
              />
            </>
          )}
        </ScrollView>

        {/* Settings Modal */}
        <Modal
          visible={settingsVisible}
          animationType="slide"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
              style={styles.backArrow}
            >
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={styles.settingsOptions}>
              <TouchableOpacity
                onPress={() => {
                  setSettingsVisible(false);
                  router.push(`/profile/edit/${loggedInUserId}`);
                }}
                style={styles.settingsOption}
              >
                <Text style={styles.optionText}>Update Profile</Text>
              </TouchableOpacity>
              
              {/* Only show password change option for non-Google users */}
              {!isGoogleUser && (
                <TouchableOpacity 
                  style={styles.settingsOption}
                  onPress={() => {
                    setSettingsVisible(false);
                    router.push(`/profile/passwordChange/${loggedInUserId}` as Href<`/profile/passwordChange/${string}`>);
                  }}
                >
                  <Text style={styles.optionText}>Change Password</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => logout()}
              >
                <Text style={styles.optionText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    margin: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    paddingHorizontal: 16, // Add horizontal padding to avoid touching screen edges
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 10,
    gap: 10, // Add space between Cancel and Save buttons
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 25,
    fontWeight: "bold",
  },
  profileContent: {
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  profileDetails: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activityImage: {
    width: 75,
    height: 75,
    borderRadius: 5,
    marginRight: 10,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  activityText: {
    fontSize: 16,
    flexWrap: "wrap",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  backArrow: {
    marginBottom: 20,
  },
  backArrowText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  settingsOptions: {
    marginTop: 20,
  },
  settingsOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  optionText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  page: {
    backgroundColor: "white",
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  // New styles for friend request button
  friendRequestButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
    width: "80%",
  },
  friendRequestText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  requestSentText: {
    color: "#4CAF50",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
    fontStyle: "italic",
  }
});