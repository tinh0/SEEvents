import React, { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { KeyboardAvoidingView } from "react-native";
import EventsMobile from "../../../../components/events.mobile";
import EventsWeb from "../../../../components/events.web";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import api from "../../../api/api";
import { FIREBASE_AUTH, storage } from "../../../../FirebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { showAlert } from "../../../utilities/crossPlatformAlerts";

import filters from "../../../../constants/filters";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs, { Dayjs } from "dayjs";
import { AntDesign, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { createWorker } from "tesseract.js";
import axios from "axios";

const CreateEvent = () => {
  const { id, communityId } = useLocalSearchParams<{
    id?: string;
    communityId?: string;
  }>(); // Retrieve params
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [attendeeLimit, setAttendeeLimit] = useState("");
  const [locationName, setLocationName] = useState("");
  const [category, setCategory] = useState(filters[0]);
  const [loading, setLoading] = useState(false);
  const [coordinateX, setCoordinateX] = useState(0.0);
  const [coordinateY, setCoordinateY] = useState(0.0);
  const [links, setLinks] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isFastAddModalVisible, setIsFastAddModalVisible] = useState(false);
  const [isStartModalVisible, setIsStartModalVisible] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(0);
  const [communities, setCommunities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState("");

  const [apiText, setApiText] = useState("");
  const [apiImage, setApiImage] = useState<string | null>(null);
  const [apiDisplayImage, setDisplayApiImage] = useState<string | null>(null);

  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [organizerError, setOrganizerError] = useState(false);
  const [attendeeLimitError, setAttendeeLimitError] = useState(false);
  const [locationNameError, setLocationNameError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [apiLoading, setIsApiLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (isNaN(Number(id)) && !(id == undefined)) {
        router.push(`/(tabs)/events`);
      } else {
        if (Number(id) != 0 && id != undefined) {
          fetchEvent();
          setIsEditing(true);
        }
        const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
          unsub();
          if (authObj) {
            setUserId(authObj.uid);
            fetchMyCommunities(authObj.uid);
          } else {
            console.log("not logged in");
          }
        });
        const date = new Date();
        const dateString =
          date.getFullYear().toString().padStart(2, "0") +
          "-" +
          (date.getMonth() + 1).toString().padStart(2, "0") +
          "-" +
          date.getDate().toString().padStart(2, "0") +
          " " +
          date.getHours().toString().padStart(2, "0") +
          ":" +
          date.getMinutes().toString().padStart(2, "0");
        setStartDate(dateString);
        setEndDate(dateString);
        setStartDateFormatted(new Date().toISOString());
        setEndDateFormatted(new Date().toISOString());
      }
    }, [id, communityId])
  );

  const fetchMyCommunities = async (uid: string) => {
    try {
      setLoading(true);
      api.get(`/api/communities/mycommunities/${uid}`).then((response) => {
        if (response && response.data) {
          setCommunities(response.data);
          if (Number(communityId)) {
            for (const comm of response.data) {
              if (comm.communities.id == communityId) {
                setSelectedCommunity(Number(communityId));
              }
            }
          }

          setLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      api.get(`/api/events/${id}}`).then((response) => {
        if (response && response.data) {
          console.log(response.data);
          setName(response.data[0].name);
          setDescription(response.data[0].description);
          setOrganizer(response.data[0].organizer);
          setAttendeeLimit(response.data[0].attendeeLimit);
          setCategory(response.data[0].category);
          setCoordinateX(response.data[0].locationPointX);
          setCoordinateY(response.data[0].locationPointY);
          setLocationName(response.data[0].locationName);
          setDisplayImage(response.data[0].thumbnailUrl);
          setLinks(response.data[0].links);
          setSelectedCommunity(
            response.data[0].communityId ? response.data[0].communityId : 0
          );
          setStartDateFormatted(response.data[0].startTime);
          setStartDateFormatted(response.data[0].endTime);
          const sDate = new Date(response.data[0].startTime);
          const sDateString =
            sDate.getFullYear().toString().padStart(2, "0") +
            "-" +
            (sDate.getMonth() + 1).toString().padStart(2, "0") +
            "-" +
            sDate.getDate().toString().padStart(2, "0") +
            " " +
            sDate.getHours().toString().padStart(2, "0") +
            ":" +
            sDate.getMinutes().toString().padStart(2, "0");
          const eDate = new Date(response.data[0].endTime);
          const eDateString =
            eDate.getFullYear().toString().padStart(2, "0") +
            "-" +
            (eDate.getMonth() + 1).toString().padStart(2, "0") +
            "-" +
            eDate.getDate().toString().padStart(2, "0") +
            " " +
            eDate.getHours().toString().padStart(2, "0") +
            ":" +
            eDate.getMinutes().toString().padStart(2, "0");
          setEndDate(eDateString);
          setLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
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
      setDisplayImage(result.assets[0].uri);
      setFileName(result.assets[0].fileName || "default.png");
    }
  };

  const pickApiImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setApiImage(result.assets[0].uri);
      setDisplayApiImage(result.assets[0].uri);
    }
  };

  const submitApi = async () => {
    try {
      setIsApiLoading(true);
      let input = "";
      if (apiImage) {
        const worker = await createWorker("eng");
        const {
          data: { text },
        } = await worker.recognize(apiImage);
        console.log(text);
        // Clean up
        await worker.terminate();
        input += text;
      }
      input += apiText;
      try {
        const response = await axios.post(
          "https://api.deepseek.com/v1/chat/completions",
          {
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: `Extract structured JSON from this text. Return ONLY valid JSON without markdown matching this schema:
                  {
                    eventName: "",
                    organizer: "",
                    locationName: "",
                    details: "",
                    startDateTime: ISOString,
                    endDateTime: ISOString,
                    capactiy: number
                  }`,
              },
              {
                role: "user",
                content: `Process this text into structured data:\n\n${input}`,
              },
            ],
            response_format: { type: "json_object" },
          },
          {
            headers: {
              Authorization: ``,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response.data.choices[0].message.content);
        const jsonText = JSON.parse(response.data.choices[0].message.content);
        if (jsonText) {
          if (jsonText.eventName) {
            setName(jsonText.eventName);
          }
          if (jsonText.organizer) {
            setOrganizer(jsonText.organizer);
          }
          if (jsonText.locationName) {
            setLocationName(jsonText.locationName);
          }
          if (jsonText.details) {
            setDescription(jsonText.details);
          }
          if (jsonText.startDateTime) {
            setStartDate(jsonText.startDateTime);
          }
          if (jsonText.endDateTime) {
            setEndDate(jsonText.endDateTime);
          }
          if (jsonText.capactiy) {
            setAttendeeLimit(jsonText.capactiy);
          }
        }
        setIsApiLoading(false);
        setIsFastAddModalVisible(false);
      } catch (err) {
        setIsApiLoading(false);
        throw Error;
      }
    } catch (err) {
      console.log(err);
      return null;
    } finally {
      console.log("done");
    }
  };

  const handleMapClicked = (X: number, Y: number) => {
    setCoordinateX(X);
    setCoordinateY(Y);
  };

  const validateField = (value: any, setError: any) => {
    console.log(value);
    if (!value.trim()) {
      setError(true);
      return false;
    }
    setError(false);
    return true;
  };

  const validateDateField = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log("Start Date:", start);
    console.log("End Date:", end);
    console.log("Is End Date > Start Date?", end > start);

    if (!(end > start)) {
      setDateError(true);
      return false;
    }
    setDateError(false);
    return true;
  };

  const createEvent = async () => {
    setLoading(true);
    //form validation
    // Validate all fields
    if (attendeeLimit === "") {
      setAttendeeLimitError(true);
    }
    const isValid = [
      validateField(name, setNameError),
      validateField(description, setDescriptionError),
      validateField(organizer, setOrganizerError),
      validateField(locationName, setLocationNameError),
      validateDateField(),
      !attendeeLimitError,
    ].every(Boolean);
    console.log(isValid);

    if (!isValid) {
      console.log("NOT VALID");
      setLoading(false);
      return;
    }

    try {
      if (userId) {
        // If an image exists, upload it first
        if (image) {
          const response = await fetch(image);
          const blob = await response.blob();
          const storageRef = ref(storage, "images");
          const thisImageRef = ref(storageRef, fileName);
          await uploadBytes(thisImageRef, blob);
          console.log("Uploaded a blob or file!");

          await getDownloadURL(thisImageRef).then((url) => {
            const eventData = {
              id: id,
              name,
              description,
              organizer,
              attendeeLimit,
              locationName,
              category,
              locationPointX: coordinateX,
              locationPointY: coordinateY,
              startTime: startDateFormatted,
              endTime: endDateFormatted,
              organizerId: userId,
              links,
              thumbnailUrl: url,
              ...(selectedCommunity && { communityId: selectedCommunity }),
            };
            api
              .post("/api/events/", eventData, {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              })
              .then((res) => {
                setName("");
                setDescription("");
                setOrganizer("");
                setAttendeeLimit("");
                setLocationName("");
                setCategory(filters[0]);
                setCoordinateX(0.0);
                setCoordinateY(0.0);
                setLinks("");
                setFileName("");
                setImage("");
                setLoading(false);

                // Navigate to the event page
                router.push(`/(tabs)/events/${res.data.id}`);
              });
          });

          // Create the event

          // Clear form fields only on successful event creation
        } else {
          // Prepare the event data, conditionally including thumbnailUrl
          const eventData = {
            id: id,
            name,
            description,
            organizer,
            attendeeLimit,
            locationName,
            category,
            locationPointX: coordinateX,
            locationPointY: coordinateY,
            startTime: startDateFormatted,
            endTime: endDateFormatted,
            organizerId: userId,
            links,
            thumbnailUrl: displayImage,
          };

          // Create the event
          const response = await api.post("/api/events/", eventData, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }); // Clear form fields only on successful event creation
          setName("");
          setDescription("");
          setOrganizer("");
          setAttendeeLimit("");
          setLocationName("");
          setCategory(filters[0]);
          setCoordinateX(0.0);
          setCoordinateY(0.0);
          setLinks("");
          setFileName("");
          setImage("");
          setLoading(false);

          // Navigate to the event page
          router.push(`/(tabs)/events/${response.data.id}`);
        }
      }
    } catch (error: any) {
      // Handle API errors or unexpected errors
      if (error.response && error.response.data && error.response.data.error) {
        showAlert("Error", error.response.data.error);
      } else {
        showAlert("Error", "An unexpected error occurred. Please try again.");
      }
      setLoading(false);
      setIsEditing(false);
    }
  };

  const [startDate, setStartDate] = useState(new Date().toISOString()); // Initialize with current date
  const [endDate, setEndDate] = useState(new Date().toISOString()); // Initialize with current date
  const [startDateFormatted, setStartDateFormatted] = useState("");
  const [endDateFormatted, setEndDateFormatted] = useState("");

  const onStartChange = useCallback((params: any) => {
    const date = new Date(params.date).toISOString(); // Convert to ISO string
    setStartDate(date);
    setStartDateFormatted(date);
  }, []);

  const onEndChange = useCallback((params: any) => {
    const date = new Date(params.date).toISOString(); // Convert to ISO string
    setEndDate(date);
    setEndDateFormatted(date);
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              router.push("/events");
            }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Details</Text>
              <View style={styles.twoColumnContainer}>
                <View style={styles.column}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Event Name"
                  />
                  {nameError ? (
                    <Text style={styles.errorText}>Invalid Name!</Text>
                  ) : null}
                  <TextInput
                    style={styles.input}
                    value={organizer}
                    onChangeText={setOrganizer}
                    placeholder="Organizer"
                  />
                  {organizerError ? (
                    <Text style={styles.errorText}>Invalid Organizer!</Text>
                  ) : null}
                </View>
                <View style={styles.column}>
                  <TextInput
                    style={styles.input}
                    value={attendeeLimit}
                    onChangeText={(text) =>
                      setAttendeeLimit(text.replace(/[^0-9]/g, ""))
                    }
                    placeholder="Capacity"
                    keyboardType="numeric"
                  />
                  {attendeeLimitError ? (
                    <Text style={styles.errorText}>Invalid Capacity!</Text>
                  ) : null}
                  <TextInput
                    style={styles.input}
                    value={locationName}
                    onChangeText={setLocationName}
                    placeholder="Location Name"
                  />
                  {locationNameError ? (
                    <Text style={styles.errorText}>Invalid Location Name!</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Event Description"
                multiline
              />
              {descriptionError ? (
                <Text style={styles.errorText}>Invalid Description!</Text>
              ) : null}
            </View>

            <View style={styles.formSection}>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={links}
                onChangeText={setLinks}
                placeholder="Links that users can visit for additional information. Separate multiple links with a new line."
                multiline
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Timing</Text>
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Start Date & Time:</Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setIsStartModalVisible(true)}
                >
                  <Text style={styles.dateText}>
                    {dayjs(startDate).toDate().toLocaleTimeString([], {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Feather name={"calendar"} size={24} color={"#000000"} />
                </TouchableOpacity>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>End Date & Time:</Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setIsEndModalVisible(true)}
                >
                  <Text style={styles.dateText}>
                    {dayjs(endDate).toDate().toLocaleTimeString([], {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Feather name={"calendar"} size={24} color={"#000000"} />
                </TouchableOpacity>
              </View>
              {dateError ? (
                <Text style={styles.errorText}>Invalid Event Date!</Text>
              ) : null}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Category:</Text>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                {filters.map((filter, index) => (
                  <Picker.Item label={filter} value={filter} key={index} />
                ))}
              </Picker>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Add to Your Community:</Text>
              <Picker
                selectedValue={selectedCommunity}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedCommunity(itemValue)}
              >
                <Picker.Item label="Add event to your community" value="" />
                {communities.map((community: any) => (
                  <Picker.Item
                    key={community.communities.id}
                    label={community.communities.name}
                    value={community.communities.id}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Click to Enter Event Location:</Text>
              {!loading && (
                <View style={styles.mapContainer}>
                  {Platform.OS === "web" ? (
                    <EventsWeb
                      sendDataToForm={handleMapClicked}
                      x={coordinateX}
                      y={coordinateY}
                    />
                  ) : (
                    <EventsMobile
                      sendDataToForm={handleMapClicked}
                      coordinates={{ x: coordinateX, y: coordinateY }}
                    />
                  )}
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Button
                title="Pick an image from camera roll"
                onPress={pickImage}
              />
              {displayImage && (
                <Image source={{ uri: displayImage }} style={styles.image} />
              )}
            </View>

            <View style={styles.createEventButtonContainer}>
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Button onPress={createEvent} title="Create Event" />
              )}
            </View>
          </ScrollView>

          <Modal
            visible={isStartModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Set Start Date/Time</Text>
                <DateTimePicker
                  mode="single"
                  date={startDate}
                  timePicker={true}
                  onChange={onStartChange}
                />
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setIsStartModalVisible(false)}
                >
                  <FontAwesome name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={isEndModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Set End Date/Time</Text>
                <DateTimePicker
                  mode="single"
                  date={endDate}
                  timePicker={true}
                  onChange={onEndChange}
                />
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setIsEndModalVisible(false)}
                >
                  <FontAwesome name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={isFastAddModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Quick Add Events</Text>
                <View>
                  <TextInput
                    numberOfLines={100}
                    style={styles.multiline}
                    value={apiText}
                    onChangeText={setApiText}
                    multiline={true}
                    placeholder="Paste event details or add photos to automatically fill out form."
                  />
                  <Button
                    title="Pick an image from camera roll"
                    onPress={pickApiImage}
                  />
                  {apiDisplayImage && (
                    <Image
                      source={{ uri: apiDisplayImage }}
                      style={[styles.image, {height: 250}]}
                    />
                  )}
                </View>
                <View style={styles.row}>
                  {!apiLoading && (
                    <TouchableOpacity
                      style={styles.submitApiButton}
                      onPress={() => submitApi()}
                    >
                      <Text style={styles.buttonText}>Submit Details</Text>
                    </TouchableOpacity>
                  )}
                  {apiLoading && (
                    <ActivityIndicator size="small" color="#0000ff" />
                  )}

                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setIsFastAddModalVisible(false)}
                  >
                    <FontAwesome name="close" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            onPress={() => setIsFastAddModalVisible(true)}
            activeOpacity={0.7}
            style={styles.addButton}
          >
            <View style={styles.white}></View>
            <AntDesign name="pluscircle" size={75} color="#FFA001" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  scroll: {
    paddingVertical: 16,
    paddingHorizontal: 2,
    flexGrow: 1,
  },
  formSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  twoColumnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    color: "#444",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginTop: -6,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
    height: 52,
    padding: 4,
  },
  iconContainer: {
    marginRight: 10,
  },
  mapContainer: {
    height: 400,
    width: "100%",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backButton: {
    padding: 8,
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: 200,
    marginTop: 16,
    borderRadius: 8,
  },
  descriptionInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#444",
  },
  calendarButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  createEventButtonContainer: {
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    padding: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  closeModalButton: {
    alignSelf: "flex-end",
    padding: 10,
    marginTop: 10,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 50,
    borderRadius: 1000,
  },
  white: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "white",
    height: 50,
    width: 50,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center", // Center the text
  },
  submitApiButton: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(76, 175, 80, 1.00);",
    padding: 10,
    borderRadius: 5,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  multiline: {
    height: 150,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  }
});

export default CreateEvent;
