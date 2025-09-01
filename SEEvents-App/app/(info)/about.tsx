import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function AboutPage() {
  const teamPhotoSource = { uri: "../assets/images/teamphoto.png" };
  const diagramPhotoSource = { uri: "../assets/images/systemdiagram.png" };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>About Our Team</Text>

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fteamphoto.png?alt=media&token=dfbb77ad-b4ca-4eaf-afac-6d9d1e9b4382",
            }}
            style={styles.teamImage}
            resizeMode="cover"
          />
          <Text style={styles.imageCaption}>
            Team Members (left to right): Kai-Chen Chiang, Tinh Nguyen, Thien
            Nguyen, and Solon Grover
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>The Project</Text>
          <Text style={styles.paragraph}>
            SEEvents (pronounced See Events), is a local event notification
            web-app available on https://seevents.expo.app/. After logging in,
            users can view local events on a map created by other users. Users
            can view event details and interact via comments and upvotes. Users
            can set their notification preferences so that they will be notified
            of specific event types, allowing quick alerts for the activities
            they love. Users can also interact with other members by joining
            communities and making friends, where together they can organize
            events and foster greater local community involvement.
          </Text>

          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.paragraph}>
            In the fall semester of 2024, our team came together to discuss and
            plan ideas for our capstone project. Thien had a fantastic idea to
            build an app to help service followers of a campus free food social
            media account that he ran. This account was used by him to alert
            students at the U of U of free food events occuring on campus, so
            that they could easily attend them. We took up this idea, and
            broadened it to include events of all types, and many other features
            to facilitate community interaction. In a tragic turn of events,
            Thien fell into a coma after terrible car crash on October 25, 2024
            during the planning phase of our project. Kai, Tinh, and Solon have
            pushed on to develop the idea that Thien had envisioned, and we are
            deeply saddened that he was not able to be with us on the last leg
            of this journey.
          </Text>

          <Text style={styles.sectionTitle}>Technologies Used</Text>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fsystemdiagram.png?alt=media&token=31f28b9f-79e3-46cd-849a-6a6edfc18dc4",
              }}
              style={styles.teamImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.paragraph}>
            Our application is built using modern web and mobile technologies to
            ensure a seamless experience across platforms:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bullet}>
              • Frontend: React Native and Expo for cross-platform web and
              mobile development
            </Text>
            <Text style={styles.bullet}>
              • Backend: Node.js with Express for API services, event
              operations, user profiles, and notifications
            </Text>
            <Text style={styles.bullet}>
              • Database: MySQL hosted on AWS for data storage
            </Text>
            <Text style={styles.bullet}>
              • Authentication & Storage: Firebase for user authentication and
              image hosting
            </Text>
            <Text style={styles.bullet}>
              • APIs: Google Maps and Google Directions/Places for location
              services
            </Text>
            <Text style={styles.bullet}>
              • AI Integration: DeepSeek for quick event addition and ChatGPT
              for content moderation
            </Text>
            <Text style={styles.bullet}>
              • Additional Services: Render for backend hosting
            </Text>
          </View>
        </View>

        <View style={styles.navButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/(info)/team")}
          >
            <Text style={styles.navButtonText}>Meet Our Team</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/(info)/tutorial")}
          >
            <Text style={styles.navButtonText}>User Tutorial</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007bff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  teamImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
  },
  imageCaption: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },
  bulletPoints: {
    marginLeft: 10,
    marginTop: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 6,
  },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 40,
  },
  navButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
