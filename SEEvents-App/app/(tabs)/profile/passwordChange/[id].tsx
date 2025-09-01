import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { FIREBASE_AUTH } from "../../../../FirebaseConfig";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import api from "../../../api/api";
import { showAlert } from "../../../utilities/crossPlatformAlerts";

const PasswordChange = () => {
  const { id } = useLocalSearchParams();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = () => {
    // Clear previous errors
    setError("");

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return false;
    }

    // Password strength check (minimum 8 characters with at least 1 number and 1 letter)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters with at least 1 letter and 1 number");
      return false;
    }

    return true;
  };

  const changePassword = async () => {
    try {
      setLoading(true);
      
      if (!validatePassword()) {
        setLoading(false);
        return;
      }

      const user = FIREBASE_AUTH.currentUser;
      
      if (!user || !user.email) {
        setError("User not authenticated properly");
        setLoading(false);
        return;
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase
      await updatePassword(user, newPassword);

      // Update password in backend (if needed)
      await api.post(`/api/users/change-password/${user.uid}`, {
        userId: user.uid,
      });

      showAlert("Success", "Password changed successfully");
      router.back();
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      
      // Type guard to check if it's a Firebase error
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === "auth/wrong-password") {
          setError("Current password is incorrect");
        } else if (firebaseError.code === "auth/requires-recent-login") {
          setError("Please log out and log back in before changing your password");
        } else {
          setError("Failed to change password. Please try again.");
        }
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Change Password</Text>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formContainer}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              autoCapitalize="none"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator size="small" color="#007bff" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={changePassword}>
              <Text style={styles.buttonText}>Save Password</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 4,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 4,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginVertical: 10,
    textAlign: "center",
  },
  loader: {
    marginTop: 24,
  },
});

export default PasswordChange;