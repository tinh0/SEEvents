import React, { useCallback, useEffect, useState } from "react";
import {
  GoogleMap,
  DirectionsService,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";
import { useFocusEffect } from "expo-router";
import { ScrollView, View, StyleSheet, Text } from "react-native";

type EventMapProps = {
  location: { lat: number; lng: number };
  showDirections: boolean;
};

interface DirectionsResponse {
  routes: any[];
  request: any;
}

const EventMap = (props: EventMapProps) => {
  const [response, setResponse] = useState<DirectionsResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destination] = useState(
    new google.maps.LatLng(props.location.lat, props.location.lng)
  );

  const [isFocused, setIsFocused] = useState(false);
  const [directionsList, setDirectionsList] = useState([]);
  const [map, setMap] = useState(null);
  // Count how many times direction api is called.
  let count = React.useRef(0);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);

      return () => {
        console.log("UNLOADING");
        setIsFocused(false);
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      console.log("calling");
      calculateRoute();
    }, [])
  );

  const calculateRoute = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const directionsService = new window.google.maps.DirectionsService();
          console.log("CALLING DIRECTIONS API ONLY RUN ONCE");
          directionsService
            .route({
              origin: new google.maps.LatLng(latitude, longitude),
              destination: destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
            })
            .then((results) => {
              setResponse(results);
              const steps: any = [];
              results.routes[0].legs.forEach((leg: any) => {
                leg.steps.forEach((step: any) => {
                  steps.push({
                    instruction: step.instructions,
                    distance: step.distance.text,
                    duration: step.duration.text,
                  });
                });
              });
              setDirectionsList(steps);
            });
        },
        (error) => {
          console.warn("Permission denied or error occurred: ", error);
        }
      );
    } else {
      console.warn("Geolocation not supported in this browser");
    }
  };

  return (
    <>
      {props.showDirections ? (
        <>
          <GoogleMap
            mapContainerStyle={styles.containerStyle}
            zoom={12}
            options={{
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {/* VERY DANGEROUS CODE BE CAREFUL */}
            {/* {userLocation && (
              <DirectionsService
                options={{
                  destination: destination,
                  origin: new google.maps.LatLng(
                    userLocation.lat,
                    userLocation.lng
                  ),
                  travelMode: google.maps.TravelMode.DRIVING,
                }}
                callback={directionsCallback}
              />
            )}*/}

            {response && (
              <DirectionsRenderer
                options={{
                  directions: response,
                  preserveViewport: true,
                }}
              />
            )}
          </GoogleMap>
          <View>
            <View style={styles.directionsContainer}>
              <Text
                style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}
              >
                Directions from your location
              </Text>

              {directionsList.length > 0 ? (
                <ScrollView style={styles.scroll}>
                  {directionsList.map((step: any, index) => (
                    <View key={index} style={styles.stepItem}>
                      {/* Number */}
                      <Text style={{ position: "absolute", left: -15 }}>
                        {index + 1}.
                      </Text>

                      {/* Instruction - need to sanitize HTML if needed */}
                      <Text style={styles.instructionText}>
                        {step.instruction.replace(/<[^>]*>?/gm, "")}
                      </Text>

                      {/* Distance/Duration */}
                      <Text style={styles.distanceDuration}>
                        {step.distance} · {step.duration}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <>
                  <Text>Loading directions...</Text>
                </>
              )}

              {/* Summary Information */}
              {response && response.routes[0] && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Route Summary</Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: "bold" }}>Total Distance:</Text>{" "}
                    {response.routes[0].legs[0].distance.text}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: "bold" }}>Total Duration:</Text>{" "}
                    {response.routes[0].legs[0].duration.text}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: "bold" }}>Start Address:</Text>{" "}
                    {response.routes[0].legs[0].start_address}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: "bold" }}>End Address:</Text>{" "}
                    {response.routes[0].legs[0].end_address}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      ) : (
        <>
          <GoogleMap
            mapContainerStyle={styles.containerStyle}
            zoom={12}
            center={destination}
            options={{
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            <Marker position={destination} />
          </GoogleMap>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    width: "100%",
    height: 400,
  },
  directionsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  directionsList: {
    paddingLeft: 20,
  },
  stepItem: {
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 16,
  },
  distanceDuration: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 5,
  },
  scroll: {
    height: 400,
  },
});

export default React.memo(EventMap);
