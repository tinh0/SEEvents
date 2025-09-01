import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // For gear icon
import {
  useLocalSearchParams,
  router,
  useFocusEffect,
  Href,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // For back arrow icon
import api from "../../api/api";
import { FIREBASE_AUTH } from "../../../FirebaseConfig";
import CommunitySettingsModal from "../../../components/CommunitySettingsModal";
import EventsCard from "@/components/EventsCard";
import { showAlert } from "@/app/utilities/crossPlatformAlerts";
import ConfirmationModal from "@/components/ConfirmationModal";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Community {
  name: string;
  description: string;
  iconUrl: string;
  contactEmail: string;
  closed: boolean;
}

const CommunityPage = () => {
  const { id } = useLocalSearchParams(); // Retrieve params
  const [events, setEvents] = useState([]); // State for events
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false); // State for modal
  const [isModerator, setIsModerator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [community, setCommunity] = useState<Community>();
  const [members, setMembers] = useState<User[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [removingMember, setRemovingMember] = useState("");
  const [requested, setRequested] = useState(false);

  const communityId = Array.isArray(id) ? id[0] : id;

  // Initial data loading
  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      console.log(`/api/events/${id}`);
      if (Number(id)) {
        api.get(`/api/communities/${id}`).then((response) => {
          if (response && response.data) {
            setCommunity(response.data[0]);
            fetchCommunityEvents();
            fetchModeratorStatus();
            fetchMembershipStatus();
            fetchCommunityMembers();
            fetchRequests();
            fetchRequested();
            setIsLoading(false);
          }
        });
      } else {
        router.push("/communities");
      }
    }, [id])
  );

  // Modified function to toggle Members Modal - now fetches fresh data when opened
  const toggleMembersModal = () => {
    if (!isMembersModalVisible) {
      // If we're opening the modal, fetch fresh data first
      fetchCommunityMembers();
    }
    setIsMembersModalVisible(!isMembersModalVisible);
  };

  // Modified function to toggle Request Modal - now fetches fresh data when opened
  const handleOpenRequestModal = () => {
    fetchRequests(); // Fetch fresh data before opening
    setRequestModalVisible(true);
  };

  const fetchCommunityEvents = async () => {
    try {
      api.get(`/api/communities/events/${id}`).then((response) => {
        if (response && response.data) {
          console.log(response.data);
          setEvents(response.data);
        }
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      showAlert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequested = async () => {
    try {
      api
        .get(
          `/api/community_members/request/member/${FIREBASE_AUTH.currentUser?.uid}/${communityId}`
        )
        .then((response) => {
          if (response && response.data) {
            setRequested(response.data.requested);
          }
        });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      showAlert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      api
        .get(`/api/community_members/request/${communityId}`)
        .then((response) => {
          if (response && response.data) {
            setRequests(response.data);
          }
        });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      showAlert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModeratorStatus = async () => {
    try {
      const response = await api.get(`/api/community_moderators/${id}`);
      const data = response.data as User[];
      console.log("Moderators data:", data);

      const userId = FIREBASE_AUTH.currentUser?.uid;
      console.log("Current user ID:", userId);

      if (!userId) {
        console.log("No user ID found");
        return;
      }

      const isModerator = data.some((mod: User) => mod.id === userId);
      console.log("Is moderator?", isModerator);
      setIsModerator(isModerator);
    } catch (err) {
      console.error("Error fetching moderator data:", err);
      showAlert("Error", "Failed to fetch moderator data.");
    }
  };

  const fetchMembershipStatus = async () => {
    try {
      const response = await api.get(`/api/community_members/${id}`);
      const members = response.data as User[];

      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) return;

      const isMember = members.some((member: User) => member.id === userId);
      //console.log("Members: " + JSON.stringify(members, null, 2));
      //console.log("Member of this community: " + isMember);
      setIsMember(isMember);
    } catch (err) {
      console.error("Error fetching membership status:", err);
      showAlert("Error", "Failed to fetch membership status.");
    }
  };

  const fetchCommunityMembers = async () => {
    try {
      const response = await api.get(`/api/community_members/${id}`);
      if (response && response.data) {
        setMembers(response.data);
      }
    } catch (err) {
      console.error("Error fetching community members:", err);
      showAlert("Error", "Failed to fetch community members.");
    }
  };

  const handleJoinGroup = async () => {
    try {
      const response = await api.post(`/api/community_members`, {
        communityId: id,
        userId: FIREBASE_AUTH.currentUser?.uid,
      });
      if (response.status === 201) {
        showAlert("Success", "You have joined the group.");
        setIsMember(true);
        fetchCommunityMembers(); // Refresh the members list
      }
    } catch (err) {
      console.error("Error joining group:", err);
      showAlert("Error", "Failed to join the group.");
    }
  };

  const handleAddMember = async (uid: any) => {
    try {
      const response = await api.post(`/api/community_members`, {
        communityId: id,
        userId: uid,
      });
      if (response.status === 201) {
        await api.delete(`/api/community_members/request/${uid}/${id}`);
        showAlert("Success", "You have accepted the request.");
        fetchCommunityMembers(); // Refresh members list
        fetchRequests(); // Refresh requests list
      }
    } catch (err) {
      console.error("Error joining group:", err);
      showAlert("Error", "Failed to join the group.");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await api.delete(`/api/community_members`, {
        data: { communityId: id, userId: FIREBASE_AUTH.currentUser?.uid },
      });
      if (response.status === 200) {
        showAlert("Success", "You have left the group.");
        setIsMember(false);
        fetchCommunityMembers(); // Refresh the members list
      }
    } catch (err) {
      console.error("Error leaving group:", err);
      showAlert("Error", "Failed to leave the group.");
    }
  };

  const createEvent = async () => {
    router.push({
      pathname: "/(tabs)/events/create/[id]",
      params: {
        id: 0,
        communityId: id,
      },
    });
  };

  // Navigate to the community chat room
  const navigateToCommunityChat = () => {
    if (isMember || isModerator) {
      router.push(
        `/chat/community/${communityId}` as Href<`/chat/community/${number}`>
      );
    } else {
      showAlert(
        "Members Only",
        "Please join the community to access the chat."
      );
    }
  };

  // Navigate to member profile
  const navigateToMemberProfile = (memberId: string) => {
    router.push(`/profile/${memberId}` as Href<`/profile/${string}`>);
  };

  const handleRemoveMember = (id: any) => {
    setRemoveModalVisible(true);
    setRemovingMember(id);
  };

  const handleRequestJoin = async () => {
    try {
      const response = await api.post(`/api/community_members/request`, {
        communityId: id,
        userId: FIREBASE_AUTH.currentUser?.uid,
      });
      if (response.status === 200) {
        showAlert(
          "Success",
          "You have successfully requested to join this community."
        );
        setRequested(true);
        fetchRequests(); // Refresh the requests list
      }
    } catch (err) {
      showAlert("Error", "Failed to request to join the group.");
    }
  };

  const removeMember = async () => {
    try {
      const response = await api.delete(`/api/community_members`, {
        data: { communityId: id, userId: removingMember },
      });
      if (response.status === 200) {
        showAlert("Success", "You have kicked them from the community.");
        setRemoveModalVisible(false);
        
        // Refresh both lists
        fetchCommunityMembers();
        setIsMembersModalVisible(false); // Close the modal
      }
    } catch (err) {
      console.error("Error removing member:", err);
      showAlert("Error", "Failed to remove the member.");
    }
  };

  if (isLoading) {
    return <Text className="loading">Loading...</Text>;
  } else {
    return (
      <ScrollView style={styles.container}>
        {community && (
          <>
            {/* Back Arrow */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  //router.back();
                  router.push("/communities");
                } else {
                  router.push("/communities");
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.header}>
              {(community.iconUrl != "" && community.iconUrl != null && (
                <Image
                  style={styles.communityImage}
                  source={{ uri: community.iconUrl }}
                />
              )) || (
                <Image
                  style={styles.communityImage}
                  source={require("../../../assets/images/missing_image.png")}
                />
              )}
              <View style={styles.communityDetails}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.communityDescription}>
                  {community.description}
                </Text>
                <Text style={styles.contactEmail}>
                  Contact Email: {community.contactEmail || "N/A"}
                </Text>
              </View>
              {isModerator && ( // Render settings gear if user is a moderator
                <TouchableOpacity
                  onPress={() => setIsSettingsModalVisible(true)}
                  style={styles.settingsButton}
                >
                  <FontAwesome name="gear" size={24} color="#000" />
                </TouchableOpacity>
              )}
            </View>

            {/* Join/Leave Group Button & Chat Button */}
            <View style={styles.actionsContainer}>
              {!isModerator && (
                <View style={styles.buttonWrapper}>
                  <TouchableOpacity
                    style={isMember ? styles.leaveButton : styles.joinButton}
                    onPress={
                      isMember
                        ? handleLeaveGroup
                        : community.closed
                        ? !requested
                          ? handleRequestJoin
                          : () => {}
                        : handleJoinGroup
                    }
                  >
                    <Text style={styles.buttonText}>
                      {isMember
                        ? "Leave Group"
                        : community.closed
                        ? !requested
                          ? "Request to Join"
                          : "Join Request Sent"
                        : "Join Group"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Chat Button - only visible to members and moderators */}
              {(isMember || isModerator) && (
                <View style={styles.buttonWrapper}>
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={navigateToCommunityChat}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={16}
                      color="white"
                      style={styles.icon}
                    />
                    <Text style={styles.buttonText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* View Members Button - only visible to members and moderators */}
            {(isMember || isModerator) && (
              <View style={styles.membersButtonContainer}>
                <TouchableOpacity
                  style={styles.membersButton}
                  onPress={toggleMembersModal}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color="white"
                    style={styles.icon}
                  />
                  <Text style={styles.buttonText}>View Members List</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* View Members Requests Button - only visible to moderators */}
            {isModerator && community.closed && (
              <View style={styles.membersButtonContainer}>
                <TouchableOpacity
                  style={styles.membersButton}
                  onPress={handleOpenRequestModal}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color="white"
                    style={styles.icon}
                  />
                  <Text style={styles.buttonText}>View Members Requests</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Upcoming Events Section */}
            {(!community.closed || isMember || isModerator) && (
              <>
                <Text style={styles.eventsHeader}>Upcoming Events:</Text>
                {isLoading ? (
                  <Text>Loading events...</Text>
                ) : events.length > 0 ? (
                  <ScrollView style={styles.scroll}>
                    {events.map((event: any) => {
                      return (
                        <EventsCard
                          key={event.id}
                          id={event.id}
                          name={event.name}
                          organizer={event.organizer}
                          attendeeLimit={event.attendeeLimit}
                          locationName={event.locationName}
                          description={event.description}
                          category={event.category}
                          thumbnailUrl={event.thumbnailUrl}
                          startTime={event.startTime}
                          endTime={event.endTime}
                          handlePress={() =>
                            router.navigate({
                              pathname: "../events/[id]",
                              params: {
                                id: event.id,
                              },
                            })
                          }
                        />
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text>No upcoming events available.</Text>
                )}
              </>
            )}

            {isModerator && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => createEvent()}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color="white"
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>Create Community Event</Text>
              </TouchableOpacity>
            )}
            {/* Settings Modal */}
            <CommunitySettingsModal
              visible={isSettingsModalVisible}
              onClose={() => setIsSettingsModalVisible(false)}
              communityId={Number(id)}
            />

            {/* Members List Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={isMembersModalVisible}
              onRequestClose={toggleMembersModal}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Community Members</Text>

                  <ScrollView style={styles.membersList}>
                    {members.length > 0 ? (
                      members.map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.memberRow}
                          onPress={() => {
                            toggleMembersModal();
                            navigateToMemberProfile(member.id);
                          }}
                        >
                          <View style={styles.memberCard}>
                            <View>
                              <Text>{`${member.firstName} ${member.lastName}`}</Text>
                              {member.username && (
                                <Text style={styles.usernameText}>
                                  @{member.username}
                                </Text>
                              )}
                            </View>
                            {member.username &&
                              isModerator &&
                              member.id != FIREBASE_AUTH.currentUser?.uid && (
                                <TouchableOpacity
                                  onPress={() => handleRemoveMember(member.id)}
                                >
                                  <Ionicons
                                    name="person-remove"
                                    size={24}
                                    color="red"
                                  />
                                </TouchableOpacity>
                              )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text>No members found</Text>
                    )}
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={toggleMembersModal}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Request List Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={requestModalVisible}
              onRequestClose={() => setRequestModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Join Requests</Text>

                  <ScrollView style={styles.membersList}>
                    {requests.length > 0 ? (
                      requests.map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.memberRow}
                          onPress={() => {
                            setRequestModalVisible(false);
                            navigateToMemberProfile(member.id);
                          }}
                        >
                          <View style={styles.memberCard}>
                            <View>
                              <Text>{`${member.firstName} ${member.lastName}`}</Text>
                              {member.username && (
                                <Text style={styles.usernameText}>
                                  @{member.username}
                                </Text>
                              )}
                            </View>
                            {member.username && isModerator && (
                              <TouchableOpacity
                                onPress={() => handleAddMember(member.id)}
                              >
                                <Ionicons
                                  name="person-add"
                                  size={24}
                                  color="green"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text>No members found</Text>
                    )}
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setRequestModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <ConfirmationModal
              visible={removeModalVisible}
              onCancel={() => {
                setRemoveModalVisible(false);
              }}
              onConfirm={removeMember}
              message="Are you sure you want to remove this member?"
            />
          </>
        )}
        {!community && (
          <>
            <Text>Community Not Found</Text>
          </>
        )}
      </ScrollView>
    );
  }
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center", // Changed from space-between
    marginVertical: 16,
    gap: 8,
  },
  buttonWrapper: {
    width: "48%", // This limits the button's width to roughly half of the container
  },
  joinButton: {
    backgroundColor: "rgba(76,175,80,1.00)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center", // Center the content horizontally
  },
  leaveButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    alignItems: "center", // Center the content horizontally
  },
  chatButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center", // Center the content horizontally
    alignItems: "center", // Center vertically
  },
  membersButtonContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  membersButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "60%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center", // Center the text
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    marginRight: 16, // Adds space between the arrow and the image
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  communityImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  communityDetails: {
    flex: 1,
    justifyContent: "center",
  },
  communityName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 12,
    color: "#495057",
  },
  settingsButton: {
    padding: 8,
  },
  eventsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventCard: {
    backgroundColor: "#e9ecef",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  eventName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  eventButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  eventButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  scroll: {
    height: "100%",
    width: "100%",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(76, 175, 80, 1.00);",
    padding: 10,
    borderRadius: 5,
  },
  icon: {
    marginRight: 5,
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
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  membersList: {
    maxHeight: 400,
  },
  memberRow: {
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  memberCard: {
    width: "100%",
    padding: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  usernameText: {
    color: "#6c757d",
    fontSize: 12,
  },
  closeModalButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  closeModalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CommunityPage;