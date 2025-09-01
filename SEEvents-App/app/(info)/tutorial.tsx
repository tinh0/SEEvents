import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function TutorialPage() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768; // Check if we're on a narrow screen

  // Tutorial sections data
  const tutorialSections = [
    {
      id: 1,
      title: "Getting Started",
      content: "Begin your journey with SEEvents by creating an account via sign up, or logging in through Google. Once registered, you'll be able to access all features of the application.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Flogin.png?alt=media&token=9ebd4c22-0565-486d-ac6c-8eb5a618dc35"
    },
    {
      id: 2,
      title: "Discovering Events",
      content: "After logging in, you'll be taken to the home screen featuring a map view. Events in your area will be displayed as markers on the map. You can tap on any marker to view basic event information, and tap 'Details' to see full event information. You can also edit notification preferences, search for locations, filter for events, and create your own event with the \"+\" button on this page.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fmap.png?alt=media&token=de549025-a2b7-42d3-8b40-dc5216de21ae"
    },
    {
      id: 3,
      title: "Event Page",
      content: "All even information is in in the event details page. Here you can interact via upvotes, downvotes, and comments, or save the event to your list, and indicate that you are going to the event. There is also a map provided to allow you to view routing directions.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Feventdetails.png?alt=media&token=bbde32f4-bdaa-4073-b972-4e46bd1953e8"
    },
    {
      id: 4,
      title: "Browsing Events",
      content: "In the events tab, you can filter on specific event category types, search the names for specific events, or filter by distance from your current location. You can view all upcoming events, events you've created, and events you've selected that you're going to.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fevents.png?alt=media&token=905a5e29-32b5-4725-bb3e-aaadbaedaa17"
    },
    {
      id: 5,
      title: "Explore Communities",
      content: "The explore tab will contain all communities, which you can search for or filter by category. ",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fexplore.png?alt=media&token=e26f9e89-51fb-41db-890e-d5e590feab92"
    },
    {
      id: 6,
      title: "Individual Communities",
      content: "Once you've joined a community, you can view community events, view the list of members, and chat with other members. Clicking on a member in the member list will take you to their profile.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Findividualcommunity.png?alt=media&token=f75ac833-f34b-42e6-882b-5cf004a66a7e"
    },
    {
      id: 7,
      title: "My Communities",
      content: "The communities that you have joined will appear in the Communities tab. Here, you can also create your own community!",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fmycommunities.png?alt=media&token=cc029836-d929-4762-9ad6-3ef924d079b6"
    },
    {
      id: 8,
      title: "Friends",
      content: "On the friends tab, you can view your current friends, and send out new friend requests! If you visit the profile of someone you are not friends with, you can also send them a friend request there.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Ffriends.png?alt=media&token=31fd1557-f3eb-4513-91e0-e428d965ea9f"
    },
    {
      id: 9,
      title: "Profile",
      content: "On the profile tab, you can change all of your bio information, such as your name, username, and profile image. There are additional options to change your password, or log out. Here, you can also view and remove your recent app activities.",
      image: "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fprofile.png?alt=media&token=10b16ea0-dca4-41c8-be6c-2057919d5833"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <Text style={styles.title}>User Tutorial</Text>
        <Text style={styles.subtitle}>Learn how to use SEEvents in a few simple steps</Text>
        
        {tutorialSections.map((section, index) => (
          <View key={section.id} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {/* Responsive layout - side by side on larger screens, stacked on mobile */}
            <View style={[
              styles.contentRow, 
              { flexDirection: isMobile ? 'column' : (index % 2 === 0 ? 'row' : 'row-reverse') }
            ]}>
              {/* Image container */}
              <View style={[
                styles.imageContainer,
                { width: isMobile ? '100%' : '40%' }
              ]}>
                <Image
                  source={{ uri: section.image }}
                  style={styles.sectionImage}
                  resizeMode="contain"
                />
              </View>
              
              {/* Text container */}
              <View style={[
                styles.textContainer,
                { width: isMobile ? '100%' : '55%' }
              ]}>
                <Text style={styles.sectionContent}>{section.content}</Text>
              </View>
            </View>
          </View>
        ))}
        
        <View style={styles.navButtons}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => router.push("/(info)/about")}>
            <Text style={styles.navButtonText}>About Project</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => router.push("/(info)/team")}>
            <Text style={styles.navButtonText}>Meet Our Team</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  contentRow: {
    flexDirection: 'row', // This will be overridden conditionally
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageContainer: {
    // width controlled dynamically
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10, // Add padding around the image
  },
  textContainer: {
    // width controlled dynamically
    paddingHorizontal: 10,
  },
  sectionImage: {
    width: '100%',
    aspectRatio: 0.5, // Portrait aspect ratio for app screenshots
    borderRadius: 8,
    borderWidth: 1, // Add border
    borderColor: '#ddd', // Light gray border color
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4, // Add elevation for Android shadow
      },
      web: {
        // For web platform
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      }
    }),
    backgroundColor: '#fff', // Add background color to ensure shadow is visible
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
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