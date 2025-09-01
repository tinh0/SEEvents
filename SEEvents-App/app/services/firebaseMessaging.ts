import { Platform } from "react-native";
import { FIREBASE_AUTH, FIREBASE_APP } from "../../FirebaseConfig"; // Adjust path as needed
import messaging from "@react-native-firebase/messaging";

// Define types
type NotificationCallback = (title: string, body: string, data?: any) => void;

// Define a class to handle all Firebase messaging operations
class FirebaseMessagingService {
  private static instance: FirebaseMessagingService;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private firebaseMessaging: any = null;
  private firebaseApp: any = null;
  private notificationCallback: NotificationCallback | null = null;
  private fcmToken: string | null = null;
  private initialized = false;
  private navigationCallback: ((data: any) => void) | null = null;

  public setNavigationCallback(callback: (data: any) => void): void {
    this.navigationCallback = callback;
  }

  // Singleton pattern
  public static getInstance(): FirebaseMessagingService {
    if (!FirebaseMessagingService.instance) {
      FirebaseMessagingService.instance = new FirebaseMessagingService();
    }
    return FirebaseMessagingService.instance;
  }

  // Initialize FCM
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("Initializing Firebase Messaging Service");

    if (Platform.OS === "web") {
      await this.initializeWeb();
    } else {
      await this.initializeMobile();
    }

    this.initialized = true;
    console.log("Firebase Messaging Service initialized");
  }

  // Initialize for web platform
  private async initializeWeb(): Promise<void> {
    try {
      // Import Firebase modules for web
      const { initializeApp } = require("firebase/app");
      const { getMessaging, onMessage } = require("firebase/messaging");

      // Firebase config
      const firebaseConfig = {
        apiKey: "",
        authDomain: "",
        projectId: "seeventsapp",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      };

      // Initialize Firebase only once
      if (!this.firebaseApp) {
        //this.firebaseApp = initializeApp(firebaseConfig);
      }
      this.firebaseApp = FIREBASE_APP

      // Register service worker
      if ("serviceWorker" in navigator) {
        try {
          this.serviceWorkerRegistration = await this.registerServiceWorker();

          // Initialize messaging once service worker is ready
          this.firebaseMessaging = getMessaging(this.firebaseApp);

          // Set up message handler
          onMessage(this.firebaseMessaging, (payload: any) => {
            console.log("Foreground message received:", payload);
            if (payload.notification && this.notificationCallback) {
              this.notificationCallback(
                payload.notification.title || "New Notification",
                payload.notification.body || "",
                payload.data // Pass the data
              );
            }
          });

          // Setup background click handler for web
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (
              event.data &&
              event.data.firebaseMessaging &&
              event.data.firebaseMessaging.type === "notification-clicked"
            ) {
              console.log("Notification clicked:", event.data);
              if (this.navigationCallback) {
                this.navigationCallback(
                  event.data.firebaseMessaging.payload.data
                );
              }
            }
          });

          // Request permission and get token
          await this.requestPermissionAndGetToken();
        } catch (err) {
          console.error("Web FCM initialization error:", err);
        }
      }
    } catch (error) {
      console.error("Error initializing web FCM:", error);
    }
  }

  // Initialize for mobile platforms
  private async initializeMobile(): Promise<void> {
    try {
      const { initializeApp } = require("@react-native-firebase/app");
      
      // Firebase config
      const firebaseConfig = {
        name: "[MESSAGINGMOBILE]",
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        databaseURL: ""
      };

      // Initialize Firebase only once
      this.firebaseApp = initializeApp(firebaseConfig);
      // Import messaging for mobile
      console.log(this.firebaseApp);

      console.log("MEEP");
      // Request permissions for mobile
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      console.log("HELP");

      // Set up notification opened handler
      messaging().onNotificationOpenedApp((remoteMessage: any) => {
        console.log("Notification opened app:", remoteMessage);
        if (this.navigationCallback && remoteMessage.data) {
          this.navigationCallback(remoteMessage.data);
        }
      });

      // Check if app was opened from a notification
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification && this.navigationCallback) {
        console.log(
          "App opened from quit state by notification:",
          initialNotification
        );
        this.navigationCallback(initialNotification.data);
      }

      if (enabled) {
        console.log("Mobile notification permissions granted");

        // Get token
        this.fcmToken = await messaging().getToken();
        console.log("Mobile FCM token:", this.fcmToken);

        // Set up foreground handler
        messaging().onMessage(async (remoteMessage: any) => {
          console.log("Foreground message received on mobile:", remoteMessage);
          if (remoteMessage.notification && this.notificationCallback) {
            this.notificationCallback(
              remoteMessage.notification.title || "New Notification",
              remoteMessage.notification.body || "",
              remoteMessage.data // Pass the data
            );
          }
        });

        // Set up background handler
        messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
          console.log("Background message received on mobile:", remoteMessage);
          // The OS will automatically show the notification
        });
      }
    } catch (error) {
      console.error("Error initializing mobile FCM:", error);
    }
  }

  // Register the service worker for web
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    try {
      console.log("Registering service worker...");
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("Service Worker registered with scope:", registration.scope);

      // Wait for the Service Worker to become active if it's not already
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const serviceWorker = registration.installing || registration.waiting;
          if (serviceWorker) {
            serviceWorker.addEventListener("statechange", (e) => {
              if ((e.target as ServiceWorker).state === "activated") {
                console.log("Service worker is now active");
                resolve();
              }
            });
          } else {
            resolve(); // Resolve anyway if something is wrong
          }
        });
      }

      return registration;
    } catch (err) {
      console.error("Service Worker registration failed:", err);
      throw err;
    }
  }

  // Request permission and get token for web
  private async requestPermissionAndGetToken(): Promise<void> {
    if (Platform.OS !== "web") return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Web notification permissions granted");
        await this.getWebToken();
      } else {
        console.log("Web notification permissions denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }

  // Get FCM token for web
  private async getWebToken(): Promise<void> {
    if (!this.serviceWorkerRegistration || !this.firebaseMessaging) {
      console.error(
        "Cannot get token: Service worker or messaging not initialized"
      );
      return;
    }

    try {
      const { getToken } = require("firebase/messaging");

      this.fcmToken = await getToken(this.firebaseMessaging, {
        vapidKey:
          "BDxbuaucd9AnLGbvnU77rSQTHD2Ktx5cJH9Pz2lN--6XKz_Xuab1yyRjzBFWPbHD8bfnkkpm7zWp4pnc5zi89SA",
        serviceWorkerRegistration: this.serviceWorkerRegistration,
      });

      console.log("Web FCM token:", this.fcmToken);

      // Save token in localStorage for persistence
      if (this.fcmToken) {
        localStorage.setItem("fcmToken", this.fcmToken);
      }
      const auth = FIREBASE_AUTH;
      const api = require("../api/api").default; // Adjust import as needed

      if (!auth.currentUser || !this.fcmToken) return;
      console.log(this.fcmToken);
      try {
        await api.post(
          `/api/users/update-token/${auth.currentUser.uid}`, // Create this endpoint in your backend
          {
            fcmToken: this.fcmToken,
          },
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
        console.log("Token updated in user profile");
      } catch (error) {
        console.error("Error updating token in user profile:", error);
      }

      // Update token in user profile if logged in
      this.updateTokenInUserProfile();
    } catch (error) {
      console.error("Error getting web token:", error);
    }
  }

  // Set notification callback
  public setNotificationCallback(callback: NotificationCallback): void {
    this.notificationCallback = callback;
  }

  // Get the FCM token
  public async getToken(): Promise<string | null> {
    // If we already have a token, return it
    if (this.fcmToken) return this.fcmToken;

    // For web, check localStorage first
    if (Platform.OS === "web") {
      const storedToken = localStorage.getItem("fcmToken");
      if (storedToken) {
        this.fcmToken = storedToken;
        return storedToken;
      }

      // If not in localStorage and we're initialized, try to get a new one
      if (this.initialized) {
        await this.getWebToken();
        return this.fcmToken;
      }
    } else {
      // For mobile, get a fresh token
      try {
        const messaging = require("@react-native-firebase/messaging").default;
        this.fcmToken = await messaging().getToken();
        return this.fcmToken;
      } catch (error) {
        console.error("Error getting mobile token:", error);
      }
    }

    return null;
  }

  // Update token in user profile if user is logged in
  public async updateTokenInUserProfile(): Promise<void> {}

  // Show a native notification (for web)
  public showNotification(title: string, body: string, data?: any): boolean {
    if (
      Platform.OS === "web" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        const notification = new Notification(title, {
          body,
          data,
        });

        // Add click handler
        notification.onclick = () => {
          notification.close();
          if (this.navigationCallback && data) {
            this.navigationCallback(data);
          }
          // Focus the window when notification is clicked
          window.focus();
        };

        return true;
      } catch (error) {
        console.error("Failed to show browser notification:", error);
        return false;
      }
    }
    return false;
  }
}

export default FirebaseMessagingService.getInstance();
