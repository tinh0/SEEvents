import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { router } from "expo-router";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { signOut } from "firebase/auth";

const Logout = () => {
  useEffect(() => {
    try {
      signOut(FIREBASE_AUTH);
      router.push("/");
    } catch (e: any) {
      console.error("Error signing out:", e);
      alert("Sign out failed. Please try again.");
    }
  }, []);

  return (
    <View>
      <Text>Logging Out</Text>
    </View>
  );
};

export default Logout;
