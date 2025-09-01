import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { Redirect, router, Link } from "expo-router";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import api from "../api/api";
import { createUserWithEmailAndPassword } from "firebase/auth";
import messaging from "@react-native-firebase/messaging";
import firebaseMessaging from "../services/firebaseMessaging";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setlastName] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  const signUp = async () => {
    setLoading(true);

    try {
      // Step 1: Firebase signup
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const fcmToken = await firebaseMessaging.getToken();

      // Step 2: Send data to backend (with moderation check)
      await api
        .post(
          "/api/users/",
          {
            id: userCredential.user.uid,
            username,
            firstName,
            lastName,
            email,
            fcmToken,
          },
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        )
        .then((res) => {
          if (res.status == 201) {
            router.push("/(tabs)/home");
          } else {
            throw Error;
          }
        });
    } catch (e: any) {
      console.error("Registration failed:", e);
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
          router.push("/sign-up");
          if (Platform.OS === "web") {
            setTimeout(() => {
              window.location.reload();
            }, 0);
          }
        } catch (deleteErr) {
          console.warn("Failed to delete user:", deleteErr);
        }
      }

      const backendMessage =
        e?.response?.data?.error || e?.message || "Registration failed.";
      alert("Registration failed: " + backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View style={styles.container}>
          <KeyboardAvoidingView behavior="padding">
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Username"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
            />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="none"
              placeholder="First Name"
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setlastName}
              autoCapitalize="none"
              placeholder="Last Name"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
            />

            {loading ? (
              <ActivityIndicator size={"small"} style={{ margin: 28 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={signUp}>
                <Text style={styles.buttonText}>Create Account</Text>
              </TouchableOpacity>
            )}
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: "center",
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
