import { Platform } from "react-native";
import { FIREBASE_APP } from "../FirebaseConfig"; // ✅ Import existing Firebase instance
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import messaging from "@react-native-firebase/messaging"; // For React Native

// 🔹 Request Notification Permission (For Both Mobile & Web)
export async function requestNotificationPermission() {
    if (Platform.OS === "web") {
        const messagingWeb = getMessaging(FIREBASE_APP);
        try {
            const token = await getToken(messagingWeb, {
                vapidKey: "YOUR_WEB_VAPID_KEY",
            });
            console.log("Web Push Token:", token);
            return token;
        } catch (error) {
            console.error("Error getting Web Push Token:", error);
        }
    } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
            const token = await messaging().getToken();
            console.log("Mobile Push Token:", token);
            return token;
        }
    }
}

// 🔹 Handle Incoming Notifications
export function setupNotificationListeners() {
    if (Platform.OS === "web") {
        const messagingWeb = getMessaging(FIREBASE_APP);
        onMessage(messagingWeb, (payload) => {
            console.log("Web Notification Received:", payload);
            if (payload.notification) {
                new Notification(payload.notification.title || "No Title", {
                    body: payload.notification.body,
                });
            } else {
                console.error("Notification payload is undefined:", payload);
            }
        });
    } else {
        messaging().onMessage(async (remoteMessage) => {
            console.log("Foreground Notification:", remoteMessage);
        });

        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
            console.log("Background Notification:", remoteMessage);
        });
    }
}
