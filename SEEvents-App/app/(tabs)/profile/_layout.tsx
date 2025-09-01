import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
        <Stack.Screen name="edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="passwordChange/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default Layout;
