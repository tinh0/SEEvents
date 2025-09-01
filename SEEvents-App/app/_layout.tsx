import { StyleSheet, Text, View } from 'react-native'
import { Slot, Stack } from 'expo-router'
import React from 'react'
import "./../global.css"

const RootLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default RootLayout