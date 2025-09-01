// First, let's add a helper function to calculate distance between coordinates
// Add this function in your Events component or in a separate utilities file

// Utility function to calculate distance between two points using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles
  return distance;
};

import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Redirect, router, Link, useFocusEffect } from "expo-router";
import api from "../../api/api";
import EventsCard from "@/components/EventsCard";
import CustomButton from "@/components/CustomButton";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import filters from "@/constants/filters";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDistanceModalVisible, setDistanceModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [userId, setUserId] = useState("");
  const [isUpcomingEvents, setIsUpcomingEvents] = useState(true);
  const [isMyEvents, setIsMyEvents] = useState(false);
  const [isSavedEvents, setIsSavedEvents] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [selectedDistance, setSelectedDistance] = useState(30); // Default 30 miles
  const [eventsWithDistance, setEventsWithDistance] = useState([]);

  // Get user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn("Permission denied or error occurred: ", error);
        }
      );
    }
  }, []);

  const fetchEvents = async (uid: string) => {
    try {
      const response = await api.get("/api/events");
      const responseData = response.data;

      // Calculate distance for each event
      const eventsWithDistanceInfo = responseData.map(
        (event: { locationPointX: any; locationPointY: any }) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.locationPointX,
            event.locationPointY
          );
          return { ...event, distance };
        }
      );

      // Sort events by distance
      const sortedEvents = eventsWithDistanceInfo.sort(
        (a: { distance: number }, b: { distance: number }) =>
          a.distance - b.distance
      );
      setEvents(sortedEvents);
      setEventsWithDistance(sortedEvents);

      const response3 = await api.get(`/api/events/myEvents/${uid}`);
      const myEventsWithDistance = response3.data
        .map((event: { locationPointX: any; locationPointY: any }) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.locationPointX,
            event.locationPointY
          );
          return { ...event, distance };
        })
        .sort(
          (a: { distance: number }, b: { distance: number }) =>
            a.distance - b.distance
        );

      setMyEvents(myEventsWithDistance);

      const response2 = await api.get(`/api/events/saved/${uid}`);
      const savedEventsWithDistance = response2.data
        .map((event: { locationPointX: any; locationPointY: any }) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.locationPointX,
            event.locationPointY
          );
          return { ...event, distance };
        })
        .sort(
          (a: { distance: number }, b: { distance: number }) =>
            a.distance - b.distance
        );

      setSavedEvents(savedEventsWithDistance);
      setIsLoading(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  // Refresh events when user location changes
  useEffect(() => {
    if (userId && userLocation.lat !== 0 && userLocation.lng !== 0) {
      fetchEvents(userId);
    }
  }, [userLocation, userId]);

  const filteredEvents = isSavedEvents
    ? savedEvents.filter((event: any) => {
        const matchesSearch =
          event.name &&
          event.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesFilter = selectedFilter
          ? event.category === selectedFilter
          : true;
        const matchesDistance =
          selectedDistance === 0
            ? true // Show all distances when "All" is selected
            : selectedDistance === 50
            ? event.distance >= 50
            : event.distance <= selectedDistance;
        return matchesSearch && matchesFilter && matchesDistance;
      })
    : isMyEvents
    ? myEvents.filter((event: any) => {
        const matchesSearch =
          event.name &&
          event.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesFilter = selectedFilter
          ? event.category === selectedFilter
          : true;
        const matchesDistance =
          selectedDistance === 0
            ? true // Show all distances when "All" is selected
            : selectedDistance === 50
            ? event.distance >= 50
            : event.distance <= selectedDistance;
        return matchesSearch && matchesFilter && matchesDistance;
      })
    : events.filter((event: any) => {
        const matchesSearch =
          event.name &&
          event.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesFilter = selectedFilter
          ? event.category === selectedFilter
          : true;
        const matchesDistance =
          selectedDistance === 0
            ? true // Show all distances when "All" is selected
            : selectedDistance === 50
            ? event.distance >= 50
            : event.distance <= selectedDistance;
        return matchesSearch && matchesFilter && matchesDistance;
      });

  useFocusEffect(
    React.useCallback(() => {
      const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
        unsub();
        if (authObj) {
          setUserId(authObj.uid);
          if (userLocation.lat !== 0 && userLocation.lng !== 0) {
            fetchEvents(authObj.uid);
          }
        } else {
          console.log("not logged in");
        }
      });
    }, [userLocation])
  );

  const distanceOptions = [
    { label: "All distances", value: 0 },
    { label: "< 5 miles", value: 5 },
    { label: "< 10 miles", value: 10 },
    { label: "< 30 miles", value: 30 },
    { label: "50+ miles", value: 50 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <SafeAreaView style={styles.container}>
        {/* Category Filters Modal */}
        <Modal
          transparent={true}
          visible={isModalVisible}
          animationType="slide"
        >
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

        {/* Distance Filter Modal */}
        <Modal
          transparent={true}
          visible={isDistanceModalVisible}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Distance</Text>
              <ScrollView style={styles.filterList}>
                {distanceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedDistance(option.value);
                      setDistanceModalVisible(false);
                    }}
                  >
                    <Text>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Search Bar & Filters */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for events"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome name="filter" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setDistanceModalVisible(true)}
          >
            <FontAwesome name="map-marker" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Filter indicator */}
        <View style={styles.activeFiltersContainer}>
          {selectedFilter && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedFilter}</Text>
            </View>
          )}
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>
              {selectedDistance === 0
                ? "All distances"
                : selectedDistance === 50
                ? "50+ miles"
                : `< ${selectedDistance} miles`}
            </Text>
          </View>
        </View>

        <View style={styles.filterEventsContainer}>
          <TouchableOpacity
            style={styles.filterEventsButton}
            onPress={() => {
              setIsUpcomingEvents(true);
              setIsMyEvents(false);
              setIsSavedEvents(false);
            }}
          >
            <Text
              style={[
                styles.filterEventsText,
                isUpcomingEvents ? styles.highlight : null,
              ]}
            >
              Upcoming Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterEventsButton}
            onPress={() => {
              setIsUpcomingEvents(false);
              setIsMyEvents(true);
              setIsSavedEvents(false);
            }}
          >
            <Text
              style={[
                styles.filterEventsText,
                isMyEvents ? styles.highlight : null,
              ]}
            >
              My Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterEventsButton}
            onPress={() => {
              setIsUpcomingEvents(false);
              setIsMyEvents(false);
              setIsSavedEvents(true);
            }}
          >
            <Text
              style={[
                styles.filterEventsText,
                isSavedEvents ? styles.highlight : null,
              ]}
            >
              Saved Events
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <Text>Loading...</Text>
        ) : (
          <ScrollView style={styles.scroll}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event: any) => {
                return (
                  <EventsCard
                    key={event.id}
                    id={event.id}
                    name={event.name}
                    organizer={event.organizer}
                    attendeeLimit={event.attendeeLimit}
                    locationName={event.locationName}
                    description={event.description}
                    category={event.category}
                    thumbnailUrl={event.thumbnailUrl}
                    startTime={event.startTime}
                    endTime={event.endTime}
                    distance={event.distance}
                    handlePress={() =>
                      router.navigate({
                        pathname: "../events/[id]",
                        params: {
                          id: event.id,
                        },
                      })
                    }
                  />
                );
              })
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>No events to display</Text>
              </View>
            )}
          </ScrollView>
        )}
        <TouchableOpacity
          onPress={() => router.push("/events/create")}
          activeOpacity={0.7}
          style={styles.addButton}
        >
          <View style={styles.white}></View>
          <AntDesign name="pluscircle" size={75} color="#FFA001" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default Events;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    margin: 16,
  },
  scroll: {
    height: "100%",
    width: "100%",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  filterButton: {
    marginLeft: 8,
    padding: 5,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  filterTag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  filterTagText: {
    fontSize: 12,
    color: "#333",
  },
  communityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e9ecef",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexWrap: "wrap",
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
    flex: 1,
  },
  communityName: { fontSize: 18, fontWeight: "bold" },
  communityDescription: {
    fontSize: 14,
    color: "#6c757d",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  communityCategory: { fontSize: 12, color: "#495057", marginTop: 4 },
  goToPageButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 8,
    marginLeft: "auto",
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
    maxHeight: 300,
  },
  filterOption: { padding: 12 },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: "#ccc",
  },
  filterEventsButton: {
    padding: 10,
  },
  filterEventsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: 10,
    marginBottom: 10,
  },
  filterEventsText: {
    fontSize: 16,
    fontWeight: "400",
  },
  highlight: {
    color: "#FFA001",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 5,
    borderRadius: 1000,
  },
  white: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "white",
    height: 50,
    width: 50,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    height: 200,
  },
  noEventsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
