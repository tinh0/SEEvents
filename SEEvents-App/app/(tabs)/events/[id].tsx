import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
import { FIREBASE_AUTH, storage } from "@/FirebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { showAlert } from "../../utilities/crossPlatformAlerts";
import axios from "axios";
import EventMap from "@/components/EventMap.web";
import { LinkPreview } from "@flyerhq/react-native-link-preview";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Event {
  name: string;
  organizer: string;
  attendeeLimit: number;
  locationName: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  startTime: Date;
  endTime: Date;
  communityId: number;
  active: boolean;
  deleted: boolean;
  organizerId: string;
  locationPointX: number;
  locationPointY: number;
  links: string;
}

const EventDetails = () => {
  const { id } = useLocalSearchParams();
  const [isLoading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event>();
  const [eventName, setEventName] = useState("");
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [going, setGoing] = useState([]);
  const [goingCount, setGoingCount] = useState(0);
  const [interested, setInterested] = useState([]);
  const [interestedCount, setInterestedCount] = useState(0);
  const [imInterested, setImInterested] = useState(false);
  const [imGoing, setImGoing] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAttendeesModalVisible, setIsAttendeesModalVisible] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [linksList, setLinksList] = useState([]);
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [active, setActive] = useState(true);

  const userId = FIREBASE_AUTH.currentUser?.uid;
  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      if (isNaN(Number(id))) {
        router.push(`/(tabs)/events`);
      } else {
        api.get(`/api/events/${id}`).then((response) => {
          if (response && response.data) {
            const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
              unsub();
              if (authObj) {
                if (authObj.uid == response.data[0].organizerId) {
                  setIsOwner(true);
                } else {
                  setIsOwner(false);
                }
                getLikedDisliked(authObj.uid);
                getInterested(authObj.uid);
                getGoing(authObj.uid);
              } else {
                console.log("not logged in");
              }
            });
            setEvent(response.data[0]);
            setEventName(response.data[0].name);
            if (response.data[0].links) {
              setLinksList(response.data[0].links.split("\n"));
            }
            if (response.data[0].active) {
              setActive(response.data[0].active);
            }
            getLikes();
            getDislikes();
            getComments();
            setLoading(false);
          }
        });
      }
    }, [id])
  );

  const getComments = async () => {
    await api.get(`/api/events/${id}/comments`).then((response) => {
      if (response && response.data) {
        console.log(response.data);
        setComments(response.data);
      }
    });
  };

  const deleteComment = async (commentId: any) => {
    await api
      .get(`/api/events/comments/delete/${commentId}`)
      .then((response) => {
        if (response && response.data) {
          console.log(response.data);
          getComments();
        }
      });
  };

  const likeEvent = async () => {
    await api.post(`/api/events/${id}/like/${userId}`).then((response) => {
      if (response && response.data) {
        setLikes(response.data[0].count);
        getDislikes();
        getLikedDisliked(userId);
      }
    });
  };

  const getLikes = async () => {
    await api.get(`/api/events/${id}/likeCount`).then((response) => {
      if (response && response.data) {
        setLikes(response.data[0].count);
      }
    });
  };

  const dislikeEvent = async () => {
    await api.post(`/api/events/${id}/dislike/${userId}`).then((response) => {
      if (response && response.data) {
        setDislikes(response.data[0].count);
        getLikes();
        getLikedDisliked(userId);
      }
    });
  };

  const getDislikes = async () => {
    await api.get(`/api/events/${id}/dislikeCount`).then((response) => {
      if (response && response.data) {
        setDislikes(response.data[0].count);
      }
    });
  };

  const getLikedDisliked = async (uid: any) => {
    await api.get(`/api/events/${id}/like/${uid}`).then((response) => {
      if (response && response.data) {
        setLiked(response.data.liked);
      }
    });
    await api.get(`/api/events/${id}/dislike/${uid}`).then((response) => {
      if (response && response.data) {
        setDisliked(response.data.disliked);
      }
    });
  };

  const getGoing = async (uid: any) => {
    api.get(`/api/events/${id}/going`).then((response) => {
      if (response && response.data) {
        console.log(response.data);
        setGoing(response.data);
        setGoingCount(response.data.length);
      }
    });
    api.get(`/api/events/${id}/going/${uid}`).then((response) => {
      if (response && response.data) {
        console.log(response.data);
        setImGoing(response.data.going);
      }
    });
  };

  const postGoing = async () => {
    api.post(`/api/events/${id}/going/${userId}`).then((response) => {
      if (response && response.data) {
        getGoing(userId);
      }
    });
  };

  const postInterested = async () => {
    api.post(`/api/events/${id}/interested/${userId}`).then((response) => {
      if (response && response.data) {
        getInterested(userId);
      }
    });
  };

  const getInterested = async (uid: any) => {
    api.get(`/api/events/${id}/interested`).then((response) => {
      if (response && response.data) {
        console.log(response.data);
        setInterested(response.data);
        setInterestedCount(response.data.length);
      }
    });
    api.get(`/api/events/${id}/interested/${uid}`).then((response) => {
      if (response && response.data) {
        setImInterested(response.data.interested);
      }
    });
  };

  const onChangeText = async (comment: string) => {
    setComment(comment);
  };

  const submitComment = async () => {
    try {
      if (!userId) {
        showAlert("Error", "You must be logged in to submit a comment.");
        return;
      }

      if (!comment || comment.trim() === "") {
        showAlert(
          "Error",
          "Comment cannot be empty. Please provide some text."
        );
        return;
      }

      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, "images");
        const thisImageRef = ref(storageRef, fileName);

        await uploadBytes(thisImageRef, blob);
        console.log("Uploaded a blob or file!");

        const url = await getDownloadURL(thisImageRef);
        await api.post(
          `/api/events/${id}/comments/${userId}`,
          {
            eventId: id,
            userId: userId,
            text: comment,
            imageUrl: url,
          },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        setComment("");
        setImage("");
        getComments();
      } else {
        await api.post(
          `/api/events/${id}/comments/${userId}`,
          {
            eventId: id,
            userId: userId,
            text: comment,
          },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        setComment("");
        getComments();
      }
    } catch (error: unknown) {
      console.error("Error submitting comment:", error);

      // Type-safe error handling for unknown error type
      if (axios.isAxiosError(error)) {
        // Handle Axios-specific errors
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "An error occurred with the request";

        showAlert("Error", errorMessage);
      } else if (error instanceof Error) {
        // Handle standard Error instances
        showAlert("Error", error.message);
      } else {
        // Fallback for completely unknown error types
        showAlert("Error", "An unexpected error occurred");
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setFileName(result.assets[0].fileName || "default.png");
    }
  };

  // Toggle attendees modal
  const toggleAttendeesModal = () => {
    setIsAttendeesModalVisible(!isAttendeesModalVisible);
  };

  // Navigate to attendee profile
  const navigateToAttendeeProfile = (attendeeId: string) => {
    router.push(`/profile/${attendeeId}`);
  };

  const confirmDelete = async () => {
    api.delete(`/api/events/${id}`).then(() => {
      console.log("success");
      setDeleteModalVisible(false);
      router.push("/events");
    });
  };

  const confirmDeactivate = async () => {
    api.put(`/api/events/activate/${id}`).then((res) => {
      console.log("success");
      setDeactivateModalVisible(false);
      setActive(res.data.active);
    });
  };

  if (isLoading) {
    return <Text className="loading">Loading...</Text>;
  } else {
    return (
      <ScrollView style={styles.container}>
        {event && !event.deleted && (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                router.navigate("/events");
              }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <View style={styles.header}>
              <Text style={styles.title}>{eventName} Details</Text>
              {isOwner && (
                <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                  <Ionicons name="settings-outline" size={40} color="#333" />
                </TouchableOpacity>
              )}
            </View>
            {(event.thumbnailUrl != "" && event.thumbnailUrl != null && (
              <Image
                style={styles.image}
                source={{ uri: event.thumbnailUrl }}
              />
            )) || (
              <Image
                style={styles.image}
                source={require("../../../assets/images/missing_image.png")}
              />
            )}
            <View style={styles.section}>
              <View style={styles.goingInterested}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => likeEvent()}
                >
                  <Text style={{ fontSize: 24 }}>{likes} </Text>
                  <Feather
                    name={"thumbs-up"}
                    size={24}
                    color={liked ? "#008000" : "#000000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => dislikeEvent()}
                >
                  <Text style={{ fontSize: 24 }}>{dislikes} </Text>
                  <Feather
                    name={"thumbs-down"}
                    size={24}
                    color={disliked ? "#C70039" : "#000000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => postInterested()}
                >
                  <Text>{interestedCount} Saved</Text>
                  <Feather
                    name={"bookmark"}
                    size={24}
                    color={imInterested ? "#008000" : "#000000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => postGoing()}
                >
                  <Text>{goingCount} Going</Text>
                  <Feather
                    name={"check-square"}
                    size={24}
                    color={imGoing ? "#008000" : "#000000"}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.section}>
              {!active && (
                <Text style={styles.warning}>
                  THIS EVENT IS NOT ACTIVE, OTHERS WILL NOT SEE IT. TO ACTIVAT
                  CLICK SETTINGS
                </Text>
              )}
              <Text style={styles.sectionTitle}>Event Details</Text>
              <Text style={styles.details}>
                Description: {event.description}
              </Text>
              <Text style={styles.details}>Organizer: {event.organizer}</Text>
              <Text style={styles.details}>Location: {event.locationName}</Text>
              <Text style={styles.details}>
                Time:{" "}
                {new Date(event.startTime).toLocaleDateString() ==
                new Date(event.endTime).toLocaleDateString() ? (
                  <Text>
                    {new Date(event.startTime).toLocaleTimeString([], {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(event.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : (
                  <>
                    <Text>
                      {new Date(event.startTime).toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" to \n             "}
                    </Text>
                    <Text>
                      {new Date(event.endTime).toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                    </Text>
                  </>
                )}
              </Text>
              <Text style={styles.details}>Category: {event.category}</Text>
              <Text style={styles.details}>
                Capacity: {event.attendeeLimit}
              </Text>

              {linksList && linksList.length != 0 && (
                <>
                  <Text style={styles.details}>Additional Links:</Text>
                  {linksList.map((link, index) => (
                    <Text
                      key={index}
                      style={[{ color: "blue" }, styles.details]}
                      onPress={() => Linking.openURL(link)}
                    >
                      {link}
                    </Text>
                  ))}
                </>
              )}
              {/* {event.links && <LinkPreview text={event.links} />} */}

              {/* View Attendees Button */}
              <View style={styles.attendeesButtonContainer}>
                <TouchableOpacity
                  style={styles.attendeesButton}
                  onPress={toggleAttendeesModal}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color="white"
                    style={styles.icon}
                  />
                  <Text style={styles.buttonText}>View Attendees</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => setShowDirections(!showDirections)}
              >
                {!showDirections ? (
                  <Text style={styles.buttonText}>Show Directions</Text>
                ) : (
                  <Text style={styles.buttonText}>Hide Directions</Text>
                )}
              </TouchableOpacity>
              <EventMap
                location={{
                  lat: event.locationPointX,
                  lng: event.locationPointY,
                }}
                showDirections={showDirections}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comments</Text>
              <View style={styles.row}>
                <TextInput
                  multiline
                  maxLength={512}
                  onChangeText={(text) => onChangeText(text)}
                  value={comment}
                  placeholder="Enter your comment here"
                  style={styles.commentInput}
                />
                <TouchableOpacity onPress={() => pickImage()}>
                  <Ionicons
                    name="images-outline"
                    style={styles.imageIcon}
                    size={50}
                    color="black"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => submitComment()}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
              {image && (
                <Image source={{ uri: image }} style={styles.commentImage} />
              )}
              {comments.map((comment: any) => {
                return (
                  <View key={comment.id} style={styles.comment}>
                    <Text style={styles.commentUser}>
                      {comment.pfpUrl && (
                        <>
                          <Image
                            source={{ uri: comment.pfpUrl }}
                            style={styles.pfpImage}
                          />
                        </>
                      )}
                      {comment.username} -{" "}
                      {new Date(comment.timestamp).toLocaleDateString()}{" "}
                      {new Date(comment.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isOwner && (
                        <Entypo
                          onPress={() => deleteComment(comment.id)}
                          name="circle-with-cross"
                          style={styles.deleteIcon}
                          size={24}
                          color="red"
                        />
                      )}
                    </Text>
                    <Text>{comment.text}</Text>
                    {comment.imageUrl != "" && (
                      <Image
                        source={{ uri: comment.imageUrl }}
                        style={styles.commentImage}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
        {(!event || (event && event.deleted)) && (
          <>
            <Text>Event Not Found</Text>
            <Text>Well, that's disappointing.</Text>
          </>
        )}

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
            <Text style={styles.modalTitle}>Event Settings</Text>
            <View style={styles.settingsOptions}>
              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => {
                  setSettingsVisible(false);
                  router.push({
                    pathname: "/(tabs)/events/create/[id]",
                    params: { id: Number(id) },
                  });
                }}
              >
                <Text style={styles.optionText}>Edit Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => setDeactivateModalVisible(true)}
              >
                <Text style={styles.optionText}>
                  {active ? "Deactivate Event" : "Activate Event"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => setDeleteModalVisible(true)}
              >
                <Text style={styles.optionText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Attendees List Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isAttendeesModalVisible}
          onRequestClose={toggleAttendeesModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Event Attendees</Text>

              <ScrollView style={styles.attendeesList}>
                {going.length > 0 ? (
                  going.map((attendee: any) => (
                    <TouchableOpacity
                      key={attendee.userId}
                      style={styles.attendeeRow}
                      onPress={() => {
                        toggleAttendeesModal();
                        navigateToAttendeeProfile(attendee.userId);
                      }}
                    >
                      <View style={styles.attendeeCard}>
                        <Text>{`${attendee.firstName || ""} ${
                          attendee.lastName || ""
                        }`}</Text>
                        {attendee.username && (
                          <Text style={styles.usernameText}>
                            @{attendee.username}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text>No attendees yet</Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={toggleAttendeesModal}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <ConfirmationModal
          visible={deactivateModalVisible}
          onCancel={() => {
            setDeactivateModalVisible(false);
          }}
          onConfirm={confirmDeactivate}
          message={
            active
              ? "Are you sure you want deactivate this event? Other users will not be able to see it"
              : "Are you sure you want activate this event? Other users will be able to see it"
          }
        />
        <ConfirmationModal
          visible={deleteModalVisible}
          onCancel={() => {
            setDeleteModalVisible(false);
          }}
          onConfirm={confirmDelete}
          message="Are you sure you want to delete this event? You cannot undo this action."
        />
      </ScrollView>
    );
  }
};

export default EventDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  image: {
    height: 300,
    width: "100%",
    borderRadius: 8,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  details: {
    fontSize: 16,
    marginVertical: 4,
  },
  goingInterested: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  submitButton: {
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
  comment: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  commentUser: {
    fontWeight: "bold",
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
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
  textContainer: {
    flex: 1,
  },
  imageIcon: {
    margin: 5,
  },
  commentImage: {
    width: "100%",
    height: 200,
    marginTop: 16,
    borderRadius: 8,
  },
  pfpImage: {
    height: 30,
    width: 30,
    borderRadius: 100,
    marginRight: 10,
  },
  deleteIcon: {
    marginLeft: "auto",
  },
  backButton: {
    padding: 8,
    marginBottom: 8,
  },
  // New styles for the attendees button and modal
  attendeesButtonContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  attendeesButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "60%",
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
  attendeesList: {
    maxHeight: 400,
  },
  attendeeRow: {
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  attendeeCard: {
    width: "100%",
    padding: 10,
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
  warning: {
    color: "red",
    fontWeight: "bold",
    fontSize: 20,
  },
});
