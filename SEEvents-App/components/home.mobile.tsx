import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Button,
  Linking,
  AppState,
  Image,
  Switch,
} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  Callout,
} from "react-native-maps";
import * as Location from "expo-location";
import api from "../app/api/api";
import filters from "../constants/filters";
import { FIREBASE_AUTH } from "@/FirebaseConfig";

import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

type MarkerType = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string | undefined; // Include image URL
  id: string; // Add an ID field for navigation
  startTime: Date;
  endTime: Date;
};

const HomeMobile = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [markers, setMarkers] = useState<MarkerType[]>([]); // Stores all markers
  const [filteredMarkers, setFilteredMarkers] = useState<MarkerType[]>([]); // Stores filtered markers
  const [categories, setCategories] = useState<string[]>([]); // Stores unique categories
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Currently selected category
  const [loading, setLoading] = useState(false);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");

  // New states for notification preferences
  const [isNotificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAndRequestPermissions();
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionStatus === "granted") {
        fetchEventsAndCategories();
        fetchNotificationPreferences();
      }
    }, [permissionStatus])
  );

  useEffect(() => {
    filterMarkersByCategory(selectedCategory);
  }, [selectedCategory, markers]);

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === "active") {
      checkPermissionStatus();
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        fetchCurrentLocation();
      }
    } catch (err) {
      console.error("Error checking location permissions:", err);
    }
  };

  const checkAndRequestPermissions = async () => {
    setLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === "undetermined") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(newStatus);
        if (newStatus === "granted") {
          fetchCurrentLocation();
        }
      } else if (status === "granted") {
        setPermissionStatus("granted");
        fetchCurrentLocation();
      } else {
        setPermissionStatus("denied");
      }
    } catch (err) {
      console.error("Error handling permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: 6,
      });
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (err) {
      console.error("Error fetching current location:", err);
    }
  };

  const fetchEventsAndCategories = async () => {
    try {
      const response = await api.get("/api/events");
      const fetchedMarkers = response.data.map((event: any) => ({
        latitude: event.locationPointX,
        longitude: event.locationPointY,
        title: event.name || "Event",
        description: event.description || "No description",
        category: event.category || "General", // Default category
        thumbnailUrl: event.thumbnailUrl || undefined, // Get image URL from database
        id: event.id, // Add event ID
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
      }));

      setMarkers(fetchedMarkers); // Set all markers
      setFilteredMarkers(fetchedMarkers); // Initially show all markers

      const uniqueCategories = Array.from(
        new Set<string>(
          fetchedMarkers.map((marker: MarkerType) => marker.category)
        )
      );
      setCategories(uniqueCategories); // Set unique categories
    } catch (err) {
      console.error("Error fetching events and categories:", err);
    }
  };

  // Function to fetch user's notification preferences
  const fetchNotificationPreferences = async () => {
    try {
      // Get user ID from Firebase Auth
      const userId = FIREBASE_AUTH.currentUser?.uid;

      if (!userId) {
        console.log("User not authenticated");
        return;
      }

      const response = await api.get(
        `/api/users/preferences/notifications/${userId}`
      );
      if (response.data && Array.isArray(response.data.preferences)) {
        setNotificationPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      // If this fails, we'll start with empty preferences, which is fine for a new user
    }
  };

  // Function to save notification preferences to database
  const saveNotificationPreferences = async () => {
    try {
      setIsSaving(true);
      // Get user ID from Firebase Auth
      const userId = FIREBASE_AUTH.currentUser?.uid;

      if (!userId) {
        console.log("User not authenticated");
        setIsSaving(false);
        return;
      }

      await api.post(`/api/users/preferences/notifications/${userId}`, {
        preferences: notificationPreferences,
      });
      setIsSaving(false);
      setNotificationModalVisible(false);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      setIsSaving(false);
      // Show error to user
      alert("Failed to save preferences. Please try again.");
    }
  };

  // Function to toggle a filter type in the preferences array
  const toggleFilterPreference = (filter: string) => {
    setNotificationPreferences((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((item) => item !== filter);
      } else {
        return [...prev, filter];
      }
    });
  };

  const filterMarkersByCategory = (category: string | null) => {
    if (category) {
      setFilteredMarkers(
        markers.filter((marker) => marker.category === category)
      );
    } else {
      setFilteredMarkers(markers); // Show all markers when no category is selected
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Fetching location or waiting for permission...</Text>
      </View>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <View style={styles.container}>
        <Text>Location permissions are required to use this feature.</Text>
        <Button title="Go to Settings" onPress={openSettings} />
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.container}>
        <Text>
          Unable to fetch location. Please enable permissions in settings.
        </Text>
        <Button title="Go to Settings" onPress={openSettings} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {filteredMarkers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
          >
            <Callout
              onPress={() =>
                router.push({
                  pathname: "/events/[id]",
                  params: {
                    id: marker.id,
                  },
                })
              }
            >
              <View style={{ maxWidth: 200 }}>
                {marker.thumbnailUrl && (
                  <>
                    <Text>
                      <Image
                        source={{ uri: marker.thumbnailUrl }}
                        style={{ width: 150, height: 150 }}
                      />
                    </Text>
                  </>
                )}
                <Text style={styles.calloutTitle}>{marker.title}</Text>
                <Text>{marker.description}</Text>
                {marker.startTime.toLocaleDateString() ==
                marker.endTime.toLocaleDateString() ? (
                  <Text>
                    {marker.startTime.toLocaleTimeString([], {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {marker.endTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : (
                  <>
                    <Text>
                      {marker.startTime.toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                    </Text>
                  </>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Event Filters Button */}
      <TouchableOpacity
        style={styles.eventFiltersButton}
        onPress={() => setFilterVisible(true)}
      >
        <Text style={styles.buttonText}>Event Filters</Text>
      </TouchableOpacity>

      {/* Notification Preferences Button */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => setNotificationModalVisible(true)}
      >
        <Text style={styles.buttonText}>Notification Preferences</Text>
      </TouchableOpacity>

      {/* Filter Categories Modal */}
      <Modal
        transparent
        visible={isFilterVisible}
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Events</Text>
            <ScrollView>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  !selectedCategory && styles.filterOptionActive,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.filterText}>All Categories</Text>
              </TouchableOpacity>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    selectedCategory === category && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={styles.filterText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.buttonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Preferences Modal */}
      <Modal
        transparent
        visible={isNotificationModalVisible}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Preferences</Text>
            <Text style={styles.modalSubtitle}>
              Select event types you want to be notified about:
            </Text>

            <ScrollView style={styles.preferencesScrollView}>
              {filters.map((filter, index) => (
                <View key={index} style={styles.preferenceItem}>
                  <Text style={styles.preferenceText}>{filter}</Text>
                  <Switch
                    value={notificationPreferences.includes(filter)}
                    onValueChange={() => toggleFilterPreference(filter)}
                    trackColor={{ false: "#767577", true: "#FFA001" }}
                    thumbColor={
                      notificationPreferences.includes(filter)
                        ? "#f5dd4b"
                        : "#f4f3f4"
                    }
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  isSaving ? styles.savingButton : styles.saveButton,
                ]}
                onPress={saveNotificationPreferences}
                disabled={isSaving}
              >
                <Text style={styles.buttonText}>
                  {isSaving ? "Saving..." : "Done"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={() => router.push("/events/create")}
        activeOpacity={0.7}
        style={styles.addButton}
      >
        <View style={styles.white}></View>
        <AntDesign name="pluscircle" size={75} color="#FFA001" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  eventFiltersButton: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 5,
  },
  notificationButton: {
    position: "absolute",
    top: 60,
    left: 20,
    padding: 10,
    backgroundColor: "#85a5ff",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    margin: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  filterOption: {
    padding: 10,
    backgroundColor: "#eee",
    marginVertical: 5,
    borderRadius: 5,
  },
  filterOptionActive: {
    backgroundColor: "#85a5ff",
  },
  filterText: {
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: "#85a5ff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  preferenceText: {
    fontSize: 16,
    flex: 1,
  },
  preferencesScrollView: {
    maxHeight: 300,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: "#FFA001",
    flex: 1,
    marginLeft: 5,
  },
  savingButton: {
    backgroundColor: "#ccc",
    flex: 1,
    marginLeft: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  detailsButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 55,
    borderRadius: 1000,
  },
  white: {
    position: "absolute",
    bottom: 15,
    left: 15,
    backgroundColor: "white",
    height: 50,
    width: 50,
  },
});

export default HomeMobile;
