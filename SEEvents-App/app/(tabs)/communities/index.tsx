import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Button,
  Image,
  Switch,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import api from "../../api/api";
import { FIREBASE_AUTH, storage } from "../../../FirebaseConfig";
import CommunityCard from "../../../components/CommunityCard";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { showAlert } from "../../utilities/crossPlatformAlerts";
import filters from "@/constants/filters";

type Community = {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  category: string;
  iconUrl?: string;
  isModerator?: boolean;
};

const Communities = () => {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    category: "",
    description: "",
    iconUrl: "",
    closed: false,
  });

  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");

  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [iconUrlError, setIconUrlError] = useState(false);
  const [contactEmailError, setContactEmailError] = useState(false);

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

  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      // make sure auth loads in before loading in the page
      const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
        unsub();
        if (authObj) {
          setUserId(authObj.uid);
          fetchMyCommunities(authObj.uid);
        } else {
          console.log("not logged in");
        }
      });
    }, [])
  );

  const fetchMyCommunities = async (uid: string) => {
    try {
      setLoading(true);
      api.get(`/api/communities/mycommunities/${uid}`).then((response) => {
        if (response && response.data) {
          setCommunities(response.data);
          setLoading(false);
        }
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClosedChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, closed: value }));
  };

  const handleFinishCommunity = async () => {
    if (creatingCommunity) {
      try {
        setLoading(true);

        const isValid = [
          validateField(formData.name, setNameError),
          validateField(formData.category, setCategoryError),
          validateField(formData.contactEmail, setContactEmailError),
          validateField(formData.description, setDescriptionError),
          validateField(image, setIconUrlError),
        ].every(Boolean);
        if (!isValid) {
          setLoading(false);
          return;
        }

        if (image) {
          // Upload the image to storage
          const imageResponse = await fetch(image); // Renamed to `imageResponse`
          const blob = await imageResponse.blob();
          const storageRef = ref(storage, "images");
          const thisImageRef = ref(storageRef, fileName);
          await uploadBytes(thisImageRef, blob);

          // Get the download URL of the uploaded image
          const url = await getDownloadURL(thisImageRef);

          // Create the community with the image URL
          const apiResponse = await api.post("/api/communities", {
            // Renamed to `apiResponse`
            userId: FIREBASE_AUTH.currentUser?.uid,
            name: formData.name,
            contactEmail: formData.contactEmail,
            category: formData.category,
            description: formData.description,
            iconUrl: url,
            closed: formData.closed,
          });

          // Handle success
          resetForm();
          fetchMyCommunities(userId);
        } else {
          // Create the community without an image
          const apiResponse = await api.post("/api/communities", {
            // Renamed to `apiResponse`
            userId: FIREBASE_AUTH.currentUser?.uid,
            name: formData.name,
            contactEmail: formData.contactEmail,
            category: formData.category,
            description: formData.description,
            closed: formData.closed,
          });

          // Handle success
          resetForm();
          fetchMyCommunities(userId);
        }
      } catch (error: unknown) {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (error instanceof Error) {
          if ((error as any).response) {
            // Server responded with an error
            errorMessage =
              (error as any).response.data?.error ||
              "Something went wrong. Please try again.";
          } else if ((error as any).request) {
            // No response received
            errorMessage =
              "No response from the server. Please check your connection.";
          } else {
            // Other client-side errors
            errorMessage = error.message || "An unknown error occurred.";
          }
        }

        showAlert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      setCreatingCommunity(false);
    }
  };

  // Helper function to reset the form and state
  const resetForm = () => {
    setFormData({
      name: "",
      contactEmail: "",
      category: "",
      description: "",
      iconUrl: "",
      closed: false,
    });
    setCreatingCommunity(false);
    setFileName("");
    setFileUrl("");
    setImage(null);
  };

  const validateField = (value: any, setError: any) => {
    if (value === null) {
      setError(true);
      return false;
    }
    if (!value.trim()) {
      setError(true);
      return false;
    }

    setError(false);
    return true;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <SafeAreaView style={styles.container}>
        {!creatingCommunity ? (
          <>
            <ScrollView style={styles.communityList}>
              {communities.map((community: any) => (
                <CommunityCard
                  key={community.communities.id}
                  id={community.communities.id}
                  contactEmail={community.communities.contactEmail}
                  name={community.communities.name}
                  category={community.communities.category}
                  description={community.communities.description}
                  iconUrl={community.communities.iconUrl}
                />
              ))}
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push("/explore")}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color="white"
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>Explore Communities</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setCreatingCommunity(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color="white"
                style={styles.icon}
              />
              <Text style={styles.buttonText}>Create Community</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ScrollView>
              <Text style={styles.header}>Create Community</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCreatingCommunity(false)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.form}>
                <Text style={styles.label}>Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter community name..."
                  value={formData.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                />
                {nameError ? (
                  <Text style={styles.errorText}>Invalid Name!</Text>
                ) : null}
                <Text style={styles.label}>Contact Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact email..."
                  value={formData.contactEmail}
                  onChangeText={(text) =>
                    handleInputChange("contactEmail", text)
                  }
                />
                {contactEmailError ? (
                  <Text style={styles.errorText}>Invalid Contact Email!</Text>
                ) : null}
                <Text style={styles.label}>Community Category:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.category}
                    onValueChange={(itemValue) =>
                      handleInputChange("category", itemValue)
                    }
                    style={styles.input}
                  >
                    <Picker.Item label="Select category" value="" />
                    {filters.map((filter, index) => (
                      <Picker.Item key={index} label={filter} value={filter} />
                    ))}
                  </Picker>
                </View>
                {categoryError ? (
                  <Text style={styles.errorText}>Invalid Category!</Text>
                ) : null}
                <Text style={styles.label}>Description:</Text>
                <TextInput
                  style={[styles.input, styles.largeInput]}
                  placeholder="Enter description..."
                  multiline
                  value={formData.description}
                  onChangeText={(text) =>
                    handleInputChange("description", text)
                  }
                />
                {descriptionError ? (
                  <Text style={styles.errorText}>Invalid Description!</Text>
                ) : null}
                <Text style={styles.label}>Invite Only?</Text>
                <Switch
                  value={formData.closed}
                  onValueChange={handleClosedChange}
                  trackColor={{ false: "#767577", true: "#FFA001" }}
                  thumbColor={"green"}
                />
                <Button
                  title="Pick an image from camera roll"
                  onPress={pickImage}
                />
                {image && (
                  <Image source={{ uri: image }} style={styles.image} />
                )}
                {iconUrlError ? (
                  <Text style={styles.errorText}>Must put a photo!</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={handleFinishCommunity}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Creating..." : "Finish Community"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </View>
  );
};

export default Communities;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    margin: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 20,
  },
  communityList: {
    flex: 1,
    marginBottom: 10,
  },
  communityCard: {
    backgroundColor: "#d3d3d3",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  communityDescription: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  goToPageButton: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 5,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgb(55 163 251)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(76, 175, 80, 1.00);",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  icon: {
    marginRight: 5,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4A90E2",
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  largeInput: {
    height: 100,
    textAlignVertical: "top",
  },
  finishButton: {
    backgroundColor: "rgba(76, 175, 80, 1.00);",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  pickerWrapper: {
    maxHeight: 200,
    overflow: "hidden",
  },
  image: {
    width: 200,
    height: 200,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 4,
    display: "flex",
  },
});
