import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function TeamPage() {
  // Function to handle opening links
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't open link", err)
    );
  };

  // Define team members data
  const teamMembers = [
    {
      id: 1,
      name: "Solon Grover",
      bio: "Hello, I'm Solon, and I am a Computer Science major graduating in May 2025. My largest development project has been this SEEvents app, which I and my teammates have spent considerable time working on this last year. On my own time, I like to pursue mini-projects of my own, where last summer I trained an object recognition AI on data I gathered myself from a game I wanted to automate resource gathering for. The resulting python bot was eerily effective at its job, and I got it to run for a few days with great success, until suspicion was raised among the game moderators, who promptly shut down the operation.\n\nAs far as my hobbies go, I am a powerlifter that's in the gym six days a week, with recent achievements such as a 600 lbs squat, 385 lbs bench, and a 675 lbs deadlift. I also like to play and study chess online frequently, and occasionally I show up to local tournaments. Tinh is a much better player than I am, we actually first met in middle school during various chess events. Of course, like any good CS student, I love to game, and I also run a small youtube channel where I upload content from world domination strategy games.",
      image:
        "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fsolon.jpg?alt=media&token=8ebbd682-8948-4d1a-8601-fd2f7a7c4c8c",
      email: "solon.grover@gmail.com",
      linkedin: "https://www.linkedin.com/in/solon-grover/",
      position: "left",
    },
    {
      id: 2,
      name: "Kai-Chen Chiang",
      bio: "My name is Kai-Chen Chiang, and I am a senior pursuing a Bachelor of Science in Computer Science at the University of Utah, with an expected graduation date of June 2025. My academic focus lies in machine learning, and software engineering, with a particular interest in applying these technologies to real-world challenges such as autonomous systems and networked devices. I have developed strong technical expertise through coursework in digital system design, operating systems, and software engineering, earning a hardware engineering certification in the process. Currently, I am working on a capstone project, “SeEvents,” and a research project with Professor Morteza Fayazi, both of which demonstrate my commitment to solving complex technical problems through innovative approaches.",
      image:
        "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fkai.png?alt=media&token=d6d3daaa-22de-46e1-a3d5-53505e383621",
      email: "qwer26573030@gmail.com",
      linkedin: "https://www.linkedin.com/in/kai-chen-chiang-1091b7265/",
      position: "right",
    },
    {
      id: 3,
      name: "Tinh Nguyen",
      bio: "Hello! I'm Tinh Nguyen and I'm a senior at the University of Utah studying Computer Science. I've currently working on a webapp called SEEvents and also a security project for detecting LoTL attacks. I will be getting a master's in secure computing and have also worked with software development, web development, databases, and mobile app development.",
      image:
        "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Ftinh.png?alt=media&token=f77645c2-5ff2-47f3-bdb2-a3c9128d9dc4",
      email: "tinh62603@gmail.com",
      linkedin: "https://www.linkedin.com/in/tinh-nguyen0/",
      position: "left",
    },
    {
      id: 4,
      name: "Thien Nguyen",
      bio: "I am the originator of the SEEvents concept, inspired by my experience running a campus free food notification service. My vision was to create a platform that would connect students with events happening around them and foster a stronger sense of community. I'm passionate about community building and using technology to bring people together.",
      image:
        "https://firebasestorage.googleapis.com/v0/b/seeventsapp.firebasestorage.app/o/about%2Fthien.jpg?alt=media&token=0b9d2114-193b-4b4c-98d0-39aef3977103",
      email: "thien.member@example.com",
      linkedin: "https://www.linkedin.com/in/thien-nguyen-2191411b0/",
      position: "right",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Meet Our Team</Text>
        <Text style={styles.subtitle}>The faces behind SEEvents</Text>

        {teamMembers.map((member) => (
          <View
            key={member.id}
            style={[
              styles.memberContainer,
              {
                flexDirection:
                  member.position === "left" ? "row" : "row-reverse",
              },
            ]}
          >
            <View style={styles.imageSection}>
              <Image
                source={{ uri: member.image }}
                style={styles.memberImage}
              />
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberBio}>{member.bio}</Text>

              <View style={styles.contactSection}>
                <Text style={styles.contactTitle}>Contact Information:</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${member.email}`)}
                >
                  <Text style={styles.contactLink}>{member.email}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openLink(member.linkedin)}>
                  <Text style={styles.contactLink}>LinkedIn Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.navButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/(info)/about")}
          >
            <Text style={styles.navButtonText}>About Project</Text>
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
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  memberContainer: {
    marginBottom: 50,
    flexDirection: "row", // Will be overridden based on position
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  imageSection: {
    width: "30%",
  },
  bioSection: {
    width: "65%",
  },
  memberImage: {
    width: "100%",
    aspectRatio: 1, // Creates a square image
    borderRadius: 8,
  },
  memberName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  memberBio: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 15,
  },
  contactSection: {
    marginTop: 10,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  contactLink: {
    fontSize: 16,
    color: "#007bff",
    marginBottom: 5,
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
