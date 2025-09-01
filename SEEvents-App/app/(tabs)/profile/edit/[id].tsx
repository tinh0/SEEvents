import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import api from "@/app/api/api";
import { FIREBASE_AUTH, storage } from "@/FirebaseConfig";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { showAlert } from "@/app/utilities/crossPlatformAlerts";

const EditProfile = () => {
  const { id } = useLocalSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmed, setNewPasswordConfirmed] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const loggedInUserId = FIREBASE_AUTH.currentUser?.uid;

  useFocusEffect(
    React.useCallback(() => {
      if (!id) {
        console.error("No user ID found in URL parameters.");
        return;
      }

      console.log("Profile User ID:", id);
      console.log("Logged-in User ID:", loggedInUserId);
      console.log("Is Own Profile:", isOwnProfile);

      // Ensure userId is a string (in case it's an array)
      const profileUserId = Array.isArray(id) ? id[0] : id;

      const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
        unsub();
        if (authObj) {
          // Compare the profileUserId with the logged-in user's ID
          setIsOwnProfile(authObj.uid === profileUserId);
          if (authObj.uid === profileUserId) {
            setLoading(true);
            api
              .get(`/api/users/${id}`)
              .then((response) => {
                if (response.data && response.data.length > 0) {
                  setUsername(response.data[0].username);
                  setFirstName(response.data[0].firstName);
                  setLastName(response.data[0].lastName);
                  setImage(response.data[0].pfpUrl);
                } else {
                  console.error("User data is empty.");
                }
              })
              .catch((error) => console.error("Error fetching user:", error))
              .finally(() => setLoading(false));
          }
        } else {
          console.log("not logged in");
        }
      });
    }, [id])
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = "First name is required";
    if (!lastName) newErrors.lastName = "Last name is required";
    //if (!email) newErrors.email = "Email is required";
    if (!username) newErrors.username = "Username is required";

    // if (newPassword && newPassword.length < 6) {
    //   newErrors.newPassword = "Password must be at least 6 characters";
    // }

    // if (newPassword !== newPasswordConfirmed) {
    //   newErrors.newPasswordConfirmed = "Passwords don't match";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let profileImageUrl = profileImage;

      if (newImage) {
        const response = await fetch(newImage);
        const blob = await response.blob();
        const storageRef = ref(storage, "images");
        const thisImageRef = ref(storageRef, fileName);
        await uploadBytes(thisImageRef, blob);
        profileImageUrl = await getDownloadURL(thisImageRef);
      }

      const userData = {
        username,
        firstName,
        lastName,
        pfpUrl: profileImageUrl,
      };

      await api.put(`/api/users/${id}`, userData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      router.push(`/profile/${id}`);
    } catch (e: any) {
      console.error("Update failed:", e);
      console.log("Response from server:", e.response);

      const backendError =
        e.response?.data?.error || e.response?.data?.message || null;

      if (backendError) {
        showAlert("Update failed", backendError);
      } else {
        showAlert("Error", "Something went wrong. Please try again.");
      }
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
      setNewImage(result.assets[0].uri);
      setImage(result.assets[0].uri);
      setFileName(result.assets[0].fileName || "default.png");
      setUploading(true);
    }
  };

  return (
    (!loading && isOwnProfile && (
      <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image
              source={{ uri: image || undefined }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.placeholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        {errors.firstName && (
          <Text style={styles.errorText}>{errors.firstName}</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        {errors.lastName && (
          <Text style={styles.errorText}>{errors.lastName}</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        {errors.username && (
          <Text style={styles.errorText}>{errors.username}</Text>
        )}

        {!loading && (
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator style={styles.uploadIndicator} />}
      </View>
    )) ||
    (!isOwnProfile && (
      <>
        <View>
          <Text>This is not your profile</Text>
        </View>
      </>
    ))
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  errorInput: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    marginLeft: 5,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  imagePicker: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
  },
  uploadIndicator: {
    position: "absolute",
  },
});

export default EditProfile;
