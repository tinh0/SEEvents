import { Platform, Alert } from "react-native";

export const showAlert = (title: string, message: string | undefined) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    // Use browser's alert only if `window` is available
    window.alert(`${title}\n${message}`);
  } else {
    // Use React Native's Alert for mobile (iOS/Android)
    Alert.alert(title, message);
  }
};
