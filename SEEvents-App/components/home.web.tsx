import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
  Image,
  SafeAreaView,
  Switch,
} from "react-native";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import api from "../app/api/api";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import filters from "../constants/filters";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import dayjs from "dayjs";
import GooglePlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-google-places-autocomplete";

type MarkerType = {
  lat: number;
  lng: number;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string | null; // Include image URL
  id: string; // Add an ID field for navigation
  startTime: string; // Add startTime field
  endTime: string; // Add endTime field
  //userIsGoing?: boolean;
};

const HomeWebMap = () => {
  const userId = FIREBASE_AUTH.currentUser?.uid;
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<MarkerType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null); // For InfoWindow
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(null);

  // New states for notification preferences
  const [isNotificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [startFilter, setStartFilter] = useState<string>("");
  const [endFilter, setEndFilter] = useState<string>("");

  useEffect(() => {
    if (mapRef.current) {
      google.maps.event.addListener(
        mapRef.current,
        "click",
        function (event: { placeId: any }) {
          if (event.placeId) {
            // Force boolean true when resetting, instead of relying on getClickableIcons()
            setTimeout(() => {
              if (mapRef.current) {
                // First disable
                mapRef.current.setOptions({ clickableIcons: false });
                // Then re-enable with a definite boolean value
                mapRef.current.setOptions({ clickableIcons: true });
              }
            }, 100);
          }
        }
      );
    }

    return () => {
      if (mapRef.current) {
        google.maps.event.clearListeners(mapRef.current, "click");
      }
    };
  }, [mapRef.current, apiLoaded]);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            setMapCenter({ lat: latitude, lng: longitude });
            setUserLocation({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.warn("Permission denied or error occurred: ", error);
          }
        );
      } else {
        console.warn("Geolocation not supported in this browser");
      }

      fetchMarkersAndCategories();
      fetchNotificationPreferences();

      return () => {
        console.log("UNLOADING");
        setIsFocused(false);
      };
    }, [])
  );

  const fetchMarkersAndCategories = async () => {
    try {
      const response = await api.get("/api/events");

      const fetchedMarkers = await Promise.all(
        response.data.map(async (event: any) => {
          // let userIsGoing = false;

          // if (userId) {
          //   try {
          //     const goingRes = await api.get(
          //       `/api/events/${event.id}/going/${userId}`
          //     );
          //     userIsGoing = goingRes.data.going; // assuming backend returns { going: true }
          //   } catch (err) {
          //     console.warn(
          //       `Failed to check going status for event ${event.id}:`,
          //       err
          //     );
          //   }
          // }

          return {
            lat: event.locationPointX,
            lng: event.locationPointY,
            title: event.name || "Event",
            description: event.description || "No description",
            category: event.category || "General",
            thumbnailUrl: event.thumbnailUrl || null,
            id: event.id,
            startTime: event.startTime,
            endTime: event.endTime,
            //userIsGoing, // ← used to control marker color
          };
        })
      );
      setMarkers(fetchedMarkers);
      setFilteredMarkers(fetchedMarkers);

      // Extract unique categories from markers
      const uniqueCategories = Array.from(
        new Set(fetchedMarkers.map((marker: MarkerType) => marker.category))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error(
        "Error fetching markers and categories from database:",
        error
      );
    }
  };

  // Function to fetch user's notification preferences
  const fetchNotificationPreferences = async () => {
    try {
      // Assuming you have the user ID available (e.g., from auth context)
      const userId = FIREBASE_AUTH.currentUser?.uid;

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
      // Assuming you have the user ID available (e.g., from auth context)
      const userId = FIREBASE_AUTH.currentUser?.uid;

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

  const applyFilter = (filter: string) => {
    setSelectedFilter(filter);

    let results = [...markers];

    // 1. Filter by category
    if (filter !== "All") {
      results = results.filter((marker) => marker.category === filter);
    }

    // 2. Filter by time range
    if (startFilter && endFilter) {
      const start = new Date(startFilter).getTime();
      const end = new Date(endFilter).getTime();

      results = results.filter((marker) => {
        const markerStart = new Date(marker.startTime).getTime();
        const markerEnd = new Date(marker.endTime).getTime();
        return markerEnd >= start && markerStart <= end;
      });
    }

    setFilteredMarkers(results);
    setFilterVisible(false);
  };

  const handleMarkerClick = (marker: MarkerType, e?: any) => {
    // First clear any existing marker
    setSelectedMarker(null);

    // Then set the new marker with a slight delay to prevent accidental double actions
    setTimeout(() => {
      setSelectedMarker(marker);
    }, 100);
  };

  const goToUserLocation = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      mapRef.current?.panTo(userLocation);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);

    // Reset map clickability
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.setOptions({ clickableIcons: false });
        mapRef.current?.setOptions({ clickableIcons: true });
      }, 100);
    }
  };

  const handleMapClick = () => {
    // Close the InfoWindow if it's open
    if (selectedMarker) {
      setSelectedMarker(null);
    }
  };

  const handleSearchInput = (search: any) => {
    setSearchInput(search.value.description);
    geocodeByAddress(search.value.description)
      .then((results) => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        console.log("Successfully got latitude and longitude", { lat, lng });
        setMapCenter({ lat, lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={12}
          onClick={handleMapClick}
          onLoad={(map: google.maps.Map) => {
            mapRef.current = map;
          }}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {filteredMarkers.map((marker, index) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.title}
              onClick={() => handleMarkerClick(marker)}
              // icon={
              //   marker.userIsGoing
              //     ? "http://maps.google.com/mapfiles/ms/micons/green-dot.png"
              //     : undefined // default icon
              // }
            />
          ))}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url:
                  "data:image/svg+xml;utf-8," +
                  encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
                                  <circle cx="24" cy="24" r="10" fill="rgba(66, 133, 244, 0.2)" />
                                  <circle cx="24" cy="24" r="6" fill="#4285F4" />
                              </svg>
                            `),
              }}
            />
          )}
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.lat,
                lng: selectedMarker.lng,
              }}
              onCloseClick={handleInfoWindowClose}
            >
              <View style={{ maxWidth: 200 }}>
                {selectedMarker.thumbnailUrl && (
                  <Image
                    source={{ uri: selectedMarker.thumbnailUrl }}
                    style={{ width: 200, height: 200 }}
                  />
                )}
                <Text>{selectedMarker.title}</Text>
                <Text>{selectedMarker.description}</Text>

                <Text>
                  From:{" "}
                  {new Date(selectedMarker.startTime).toLocaleTimeString([], {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  {"\n"}
                  To:{" "}
                  {new Date(selectedMarker.endTime).toLocaleTimeString([], {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => {
                    // Set a flag or use a ref to indicate this was an intentional navigation
                    const id = selectedMarker?.id;
                    setSelectedMarker(null); // Close the InfoWindow first

                    // Add a small delay before navigation to ensure state updates first
                    setTimeout(() => {
                      router.push({
                        pathname: "../events/[id]",
                        params: { id },
                      });
                    }, 50);
                  }}
                >
                  <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
      
      {/* Modified top controls section - vertically stacked */}
      <View style={styles.topControls}>
        {/* Search input at the top */}
        <View style={styles.searchInputContainer}>
          <GooglePlacesAutocomplete
            selectProps={{
              value: searchInput,
              onChange: (value) => {
                handleSearchInput(value);
              },
            }}
          />
        </View>
        
        {/* Buttons row below search */}
        <View style={styles.buttonsRow}>
          {/* Notification Preferences Button */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setNotificationModalVisible(true)}
          >
            <View style={styles.notificationButtonTextContainer}>
              <Text style={styles.buttonText}>Notification</Text>
              <Text style={styles.buttonText}>Preferences</Text>
            </View>
          </TouchableOpacity>
          
          {/* Event Filters Button */}
          <TouchableOpacity
            style={styles.filterEventButton}
            onPress={() => setFilterVisible(true)}
          >
            <Text style={styles.buttonText}>Event Filters</Text>
          </TouchableOpacity>
          
          {/* Location Button */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={goToUserLocation}
          >
            <Image
              source={require("../assets/images/location.png")}
              style={styles.locationButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal - Removed Done button */}
      <Modal
        transparent
        visible={isFilterVisible}
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Events</Text>
            <Text style={styles.modalSubtitle}>
              Select the events you want to view on the map:
            </Text>
            <ScrollView style={styles.preferencesScrollView}>
              {/* Time Range Filters */}
              <Text style={styles.filterText}>Start Time:</Text>
              <input
                type="datetime-local"
                value={startFilter}
                onChange={(e) => setStartFilter(e.target.value)}
                style={{
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  width: "100%",
                }}
              />

              <Text style={styles.filterText}>End Time:</Text>
              <input
                type="datetime-local"
                value={endFilter}
                onChange={(e) => setEndFilter(e.target.value)}
                style={{
                  padding: 8,
                  marginBottom: 20,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  width: "100%",
                }}
              />
              <TouchableOpacity
                onPress={() => applyFilter("All")}
                style={styles.filterOption}
              >
                <Text style={styles.filterText}>All</Text>
              </TouchableOpacity>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => applyFilter(category)}
                  style={styles.filterOption}
                >
                  <Text style={styles.filterText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => applyFilter(selectedFilter || "All")}
              >
                <Text style={styles.buttonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchInputContainer: {
    width: "100%",
    marginBottom: 10,
    backgroundColor: "white",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 20, // Higher z-index so dropdown appears above buttons
    elevation: 20, // For Android
  },
  // For the container
  topControls: {
    position: "absolute",
    width: "100%",
    top: 10,
    padding: 10,
    zIndex: 10,
  },
  // Button row with adjusted z-index
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5, // Lower z-index than the search container
  },
  // Modified button styles to be only as wide as content
  filterEventButton: {
    backgroundColor: "#FFA001",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: "center",
  },
  notificationButton: {
    backgroundColor: "#85a5ff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 5,
  },
  container: {
    flex: 1,
  },
  locationButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  locationButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  notificationButtonTextContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    margin: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
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
    maxHeight: 400,
  },
  filterOption: {
    padding: 10,
    backgroundColor: "#eee",
    marginVertical: 5,
    borderRadius: 5,
  },
  filterText: {
    fontSize: 16,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    minWidth: 100,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  saveButton: {
    backgroundColor: "#FFA001",
  },
  savingButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  detailsButton: {
    backgroundColor: "#FFA001",
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
    left: 10,
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

export default HomeWebMap;