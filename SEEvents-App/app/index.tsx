import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Href, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FIREBASE_AUTH } from "../FirebaseConfig";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  Auth,
} from "firebase/auth";
//import { MapReloadProvider } from "./utilities/MapReload";
import Toast from "react-native-toast-message";
import firebaseMessaging from "./services/firebaseMessaging";
import api from "./api/api";
import {
  GoogleSignin,
  GoogleSigninButton,
  User,
} from "@react-native-google-signin/google-signin";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<User>();
  const [error, setError] = useState<any>();
  const auth = FIREBASE_AUTH;
  const provider = new GoogleAuthProvider();

  let GoogleWebOAuth;
  if (Platform.OS == "web") {
    GoogleWebOAuth = require("@react-oauth/google");
  }

  // Initialize Firebase messaging
  useEffect(() => {
    // GoogleSignin.configure({
    //   webClientId:
    //     "",
    // });
    const initializeMessaging = async () => {
      try {
        await firebaseMessaging.initialize();

        // Set notification callback using Toast
        firebaseMessaging.setNotificationCallback((title, body, data) => {
          // Try to show a native notification first (for web)
          const shown = firebaseMessaging.showNotification(title, body, data);

          // Fall back to Toast if native notification fails
          if (!shown) {
            Toast.show({
              type: "success",
              text1: title,
              text2: body,
              position: "top",
              visibilityTime: 4000,
              onPress: () => {
                // Handle navigation when Toast is clicked
                if (data && data.eventId) {
                  router.push(`/events/${data.eventId}`);
                }
              },
            });
          }
        });

        // Set navigation callback
        firebaseMessaging.setNavigationCallback((data) => {
          if (data && data.eventId) {
            router.push(`/events/${data.eventId}`);
          }
        });
      } catch (error) {
        console.error("Failed to initialize Firebase messaging:", error);
      }
    };

    initializeMessaging();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/(tabs)/home");
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (authChecking) {
    return null;
  }

  const signIn = async () => {
    setLoading(true);
    try {
      await api.get(`/api/users/auth/${email}`).then((response) => {
        if (response && response.data) {
          if (response.data.exists) {
            signInWithEmailAndPassword(auth, email, password)
              .then(() => {
                router.push("/(tabs)/home");
              })
              .catch((e) => {
                alert("Sign in failed: " + e.message);
              });
          } else {
            throw Error;
          }
        } else {
          throw Error;
        }
      });
    } catch (e) {
      if (e instanceof Error) {
        alert("Sign in failed: " + e.message);
      } else {
        alert("Sign in failed: Email and password do no match.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      console.log("EFDSFSD");
      const signInResult = await GoogleSignin.signIn();
      console.log("1");
      if (!signInResult.data) {
        console.log("HELPPPP");
        throw Error();
      }
      setUserInfo(signInResult.data);
      // Try the new style of google-sign in result, from v13+ of that module

      const idToken = signInResult.data.idToken;
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(
        signInResult.data.idToken
      );
      console.log("HELP MEEEEE");
      const fcmToken = await firebaseMessaging.getToken();
      if (userInfo?.user.email) {
        setEmail(userInfo.user.email);
      }
      // Sign-in the user with the credential
      signInWithCredential(auth, googleCredential)
        .then(() => {
          api.get(`/api/users/auth/${email}`).then((response) => {
            if (response && response.data) {
              if (response.data.exists) {
                router.push("/home");
              } else {
                if (auth.currentUser && fcmToken && userInfo) {
                  api
                    .post(
                      "/api/users/",
                      {
                        id: auth.currentUser.uid,
                        userInfo: userInfo.user.name ? userInfo.user.name : "",
                        firstName: userInfo.user.givenName
                          ? userInfo.user.givenName
                          : "",
                        lastName: userInfo.user.familyName
                          ? userInfo.user.familyName
                          : "",
                        email: userInfo.user.email ? userInfo.user.email : "",
                        pfpUrl: userInfo.user.photo ? userInfo.user.photo : "",
                        fcmToken: fcmToken,
                      },
                      {
                        headers: {
                          "Content-Type": "application/x-www-form-urlencoded",
                        },
                      }
                    )
                    .then(() => {
                      router.push("/home");
                    });
                }
              }
            }
          });
        })
        .catch(() => {
          throw Error();
        });
    } catch (e) {
      console.log(e);
      setError(e);
    }
  };

  const signInGoogleWeb = async (res: any) => {
    try {
      console.log(res);
      const googleCredential = GoogleAuthProvider.credential(res.credential);
      const fcmToken = await firebaseMessaging.getToken();
      if (userInfo?.user.email) {
        setEmail(userInfo.user.email);
      }
      signInWithCredential(auth, googleCredential)
        .then((userCredential: any) => {
          const user = userCredential.user;
          const gmail = user.email;
          const displayName = user.displayName || "";
          const photoURL = user.photoURL || "";

          // Extract first and last name if available
          let firstName = "";
          let lastName = "";
          if (displayName) {
            const nameParts = displayName.split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }
          api.get(`/api/users/auth/${gmail}`).then((response) => {
            if (response && response.data) {
              if (response.data.exists) {
                router.navigate("/home");
              } else {
                if (auth.currentUser && fcmToken) {
                  api
                    .post(
                      "/api/users/",
                      {
                        id: auth.currentUser.uid,
                        username: displayName,
                        firstName: firstName,
                        lastName: lastName,
                        email: gmail,
                        pfpUrl: photoURL,
                        fcmToken: fcmToken,
                      },
                      {
                        headers: {
                          "Content-Type": "application/x-www-form-urlencoded",
                        },
                      }
                    )
                    .then(() => {
                      router.navigate("/home");
                    });
                }
              }
            }
          });
        })
        .catch(() => {
          throw Error();
        });
    } catch (e) {
      console.log(e);
      setError(e);
    }
  };

  return (
    //<MapReloadProvider>
    <>
      <SafeAreaView className="bg-white h-full">
        <ScrollView contentContainerStyle={{ height: "100%" }}>
          <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
              <View style={{paddingBottom: 10}}>
                <Image
                  style={{ height: 300, width: 300 }}
                  source={require("../assets/images/map.png")}
                />
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholder="Email"
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
              />

              {Platform.OS === "android" && (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={signInGoogle}
                />
              )}
              {Platform.OS === "web" && (
                <GoogleWebOAuth.GoogleOAuthProvider clientId="">
                  <GoogleWebOAuth.GoogleLogin
                    onSuccess={signInGoogleWeb}
                    onError={() => {
                      console.log("ERROR");
                    }}
                  />
                </GoogleWebOAuth.GoogleOAuthProvider>
              )}
              {loading ? (
                <ActivityIndicator size="small" style={{ margin: 28 }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={signIn}>
                  <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
              )}
            </KeyboardAvoidingView>

            <View style={styles.signupContainer}>
              <Text>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            
            {/* About the team link */}
            <TouchableOpacity 
              style={styles.aboutLink} 
              onPress={() => router.push("/(info)/about")}>
              <Text style={styles.aboutLinkText}>About the Project</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      {/* Add Toast container at the root */}
      <Toast />
    </>
    //</MapReloadProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "100%",
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
  signupContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  signupText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  aboutLink: {
    marginTop: 30, 
    padding: 10,
  },
  aboutLinkText: {
    color: "#007bff",
    fontSize: 14,
  },
});