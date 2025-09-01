// Explore.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import api from "../api/api";
import { useFocusEffect, useRouter } from "expo-router"; // Use expo-router for navigation
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import CommunityCard from "../../components/CommunityCard"; // Import the new CommunityCard component
import filters from "../../constants/filters";
import { showAlert } from "../utilities/crossPlatformAlerts";

interface Community {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  category: string;
  iconUrl?: string;
}

const Explore = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]); // `any[]` or define a type for community
  const [isLoading, setIsLoading] = useState(true); // Loading state to show while fetching data

  useFocusEffect(
    React.useCallback(() => {
      fetchCommunities();
    }, [])
  );

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/communities");
      console.log(response.data);
      const communities: Community[] = response.data;

      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) {
        console.warn("No user ID found");
        setCommunities(communities);
        return;
      }

      setCommunities(communities);
    } catch (err: any) {
      showAlert("Error", err.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered communities based on search text and selected filter
  const filteredCommunities = communities.filter((community) => {
    const matchesSearch =
      community.name &&
      community.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = selectedFilter
      ? community.category === selectedFilter
      : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for communities"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome name="filter" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Filters Modal */}
        <Modal transparent={true} visible={isModalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a Category</Text>
              <ScrollView style={styles.filterList}>
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedFilter("");
                    setModalVisible(false);
                  }}
                >
                  <Text>Clear Filter</Text>
                </TouchableOpacity>
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedFilter(filter);
                      setModalVisible(false);
                    }}
                  >
                    <Text>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Community List */}
        {isLoading ? (
          <Text>Loading...</Text>
        ) : (
          <FlatList
            data={filteredCommunities}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <CommunityCard
                key={item.id}
                id={item.id}
                contactEmail={item.contactEmail}
                name={item.name}
                category={item.category}
                description={item.description}
                iconUrl={item.iconUrl}
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, margin: 16, backgroundColor: "white" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  filterButton: { marginLeft: 8 },
  communityCard: {
    flexDirection: "row",
    alignItems: "flex-start", // Ensure content doesn't stretch the container
    backgroundColor: "#e9ecef",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexWrap: "wrap", // Allow content to wrap within the card
  },
  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#adb5bd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  communityInfoContainer: {
    flex: 1, // Allow this container to take up available space
  },
  communityName: { fontSize: 18, fontWeight: "bold" },
  communityDescription: {
    fontSize: 14,
    color: "#6c757d",
    flexWrap: "wrap", // Make sure the description text wraps
    marginBottom: 8, // Add some spacing between description and category
  },
  communityCategory: { fontSize: 12, color: "#495057", marginTop: 4 },
  goToPageButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 8,
    marginLeft: "auto", // Ensure the button is aligned to the right
  },
  goToPageText: { color: "#fff", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 32,
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  filterList: {
    maxHeight: 300, // Add max height to the scrollable filter list
  },
  filterOption: { padding: 12 },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: "#ccc", // Fallback in case the image fails
  },
});

export default Explore;
