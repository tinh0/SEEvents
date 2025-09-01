import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Button,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import api from "../app/api/api";
import { FIREBASE_AUTH, storage } from "../FirebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

interface CommunitySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: number;
}

const CommunitySettingsModal: React.FC<CommunitySettingsModalProps> = ({
  visible,
  onClose,
  communityId,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [category, setCategory] = useState<string>("Art & Creativity");
  const [iconUrl, setIconUrl] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const [closed, setIsClosed] = useState(false);

  const categories = [
    "Art & Creativity",
    "Music",
    "Technology & Coding",
    "Health & Fitness",
    "Movies & TV Shows",
    "Books & Writing",
    "Food & Cooking",
    "Adventure & Travel",
    "Cultural",
    "Social Justice & Activism",
    "Entrepreneurship & Startups",
    "Science & Research",
    "Gaming",
    "Parenting & Family",
    "Pet Lovers",
    "Education",
    "Fashion & Style",
    "Faith & Spirituality",
    "Environment & Sustainability",
    "Comedy & Entertainment",
    "DIY & Makers",
    "Dance",
    "Wellness & Self-Improvement",
    "Finance & Investing",
    "Sports Fanatics",
    "Collectors",
    "Hobbies & Interests",
    "History Buffs",
    "Outdoor Enthusiasts",
    "Photography",
    "Local Community",
    "Support & Recovery",
  ];

  // Fetch community data when the modal is opened
  useFocusEffect(
    React.useCallback(() => {
      const fetchCommunityData = async () => {
        try {
          const response = await api.get(`/api/communities/${communityId}`);
          const communityData = Array.isArray(response.data)
            ? response.data[0]
            : response.data;

          if (communityData) {
            setName(communityData.name || "");
            setDescription(communityData.description || "");
            setContactEmail(
              communityData.contact_email || communityData.contactEmail || ""
            );
            setCategory(communityData.category || "Art & Creativity");
            setIconUrl(communityData.icon_url || communityData.iconUrl || "");
            setImage(communityData.icon_url || communityData.iconUrl || null);
            setIsClosed(communityData.closed);
          } else {
            console.error("No community data found");
          }
        } catch (error) {
          console.error("Error fetching community data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      if (visible) {
        setIsLoading(true);
        fetchCommunityData();
      }
    }, [visible, communityId])
  );

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setImage(localUri);
      // Don't update iconUrl yet - that will happen after upload
    }
  };

  const handleSaveChanges = async () => {
    try {
      let iconDownloadUrl = iconUrl;

      // Check if we need to upload a new image
      if (image && image !== iconUrl) {
        // This means the user selected a new image from the device
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, "community_icons");
        const iconRef = ref(storageRef, `community_${communityId}_icon.png`);

        // Upload image to Firebase Storage
        await uploadBytes(iconRef, blob);

        // Get the new image URL
        iconDownloadUrl = await getDownloadURL(iconRef);
      }

      // Now update the community with either the existing URL or new one
      const updateResponse = await api.put(`/api/communities/${communityId}`, {
        name,
        description,
        contactEmail,
        category,
        iconUrl: iconDownloadUrl,
        closed,
      });

      if (updateResponse.status === 200) {
        console.log("Community updated successfully");
        router.push("/explore");
      } else {
        console.log("Failed to update community");
      }
    } catch (error) {
      console.error("Error updating community", error);
    } finally {
      onClose();
    }
  };

  const handleDeleteCommunity = async () => {
    try {
      const response = await api.delete(`/api/communities/${communityId}`);

      if (response.status === 200) {
        console.log("Community deleted successfully");
        router.push("/explore");
      } else {
        console.log("Failed to delete community");
      }
    } catch (error) {
      console.error("Error deleting community", error);
    } finally {
      onClose(); // Close modal after deleting
    }
  };

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading community data...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Community Settings</Text>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <FontAwesome name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.inputLabel}>Community Name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Community Name"
          />
          <Text style={styles.inputLabel}>Community Description:</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Text..."
            multiline
          />
          <Text style={styles.inputLabel}>Contact Email:</Text>
          <TextInput
            style={styles.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="Contact Email"
          />
          <Text style={styles.inputLabel}>Category:</Text>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
          >
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>

          <Switch
            value={closed}
            onValueChange={setIsClosed}
            trackColor={{ false: "#767577", true: "#FFA001" }}
            thumbColor={"green"}
          />

          <Text style={styles.inputLabel}>Community Icon:</Text>
          <Button title="Pick an image from camera roll" onPress={pickImage} />
          {image && <Image source={{ uri: image }} style={styles.image} />}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveChanges}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteCommunity}
          >
            <Text style={styles.deleteButtonText}>Delete Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  closeModalButton: {
    alignSelf: "flex-end",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "rgba(76,175,80,1.00)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  saveButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "rgb(255 72 72)",
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 8,
  },
});

export default CommunitySettingsModal;
