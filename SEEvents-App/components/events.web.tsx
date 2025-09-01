import React, { useState, useEffect, useRef, useCallback } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
  LoadScript,
} from "@react-google-maps/api";
//import { useMapReload } from "@/app/utilities/MapReload";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import GooglePlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-google-places-autocomplete";

type MarkerType = {
  lat: number;
  lng: number;
  title: string;
  description: string;
};

type MapProps = {
  sendDataToForm?: (lat: number, lng: number) => void;
  x: number;
  y: number;
};

// Libraries we need from the Google Maps API
const libraries = ["places"];

const HomeWebMap = (props: MapProps) => {
  const [marker, setMarker] = useState<MarkerType | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isHandlingMarkerClick, setIsHandlingMarkerClick] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  //const { reloadMap } = useMapReload(); // Use the map reload context
  const [isFocused, setIsFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(null);

  // Store map instance in a ref
  const mapRef = useRef<google.maps.Map | null>(null);

  // Use the useJsApiLoader hook for loading the Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "",
    libraries: libraries as any,
  });

  // Reset all map-related state when component unmounts or when reload is triggered
  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => {
        // Cleanup function to reset state when component unmounts
        setMarker(null);
        setSelectedMarker(null);
        setIsFocused(false);
        if (mapRef.current) {
          // Remove all event listeners from the map
          google.maps.event.clearInstanceListeners(mapRef.current);
        }
        mapRef.current = null;
      };
    }, [
      //reloadMap,
      apiLoaded,
      mapRef.current,
    ])
  ); // Run this effect when reloadMap changes

  // Set initial props-based marker and center position
  useEffect(() => {
    if (isLoaded && props?.x && props?.y) {
      const lat = props.x;
      const lng = props.y;
      setMarker({ lat, lng, title: "New Marker", description: "Description" });
      setMapCenter({ lat, lng });
    }
  }, [isLoaded, props?.x, props?.y]);

  // Get user location
  useEffect(() => {
    let geolocationWatchId: number;

    if ("geolocation" in navigator && isLoaded) {
      geolocationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (!marker && props.sendDataToForm) {
            props.sendDataToForm(latitude, longitude);
          }

          if (props) {
            var lat;
            var lng;
            if (props.x == 0 && props.y == 0) {
              lat = position.coords.latitude;
              lng = position.coords.longitude;
            } else {
              lat = props.x;
              lng = props.y;
            }
            const newMarker = {
              lat,
              lng,
              title: "New Marker",
              description: "Description",
            };
            setMarker(newMarker);
            setMapCenter({ lat: lat, lng: lng });
          }
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn("Permission denied or error occurred: ", error);
        }
      );
    }

    // Add event listener to handle blocked requests
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes("ERR_BLOCKED_BY_CLIENT") ||
        event.message.includes("net::ERR_BLOCKED")
      ) {
        console.warn(
          "Network request blocked. This may affect map functionality."
        );
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      // Clean up geolocation watch
      if (geolocationWatchId) {
        navigator.geolocation.clearWatch(geolocationWatchId);
      }

      window.removeEventListener("error", handleError);
    };
  }, [isLoaded]);

  // Handler for map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Clean up function for map component
  const onUnmount = useCallback(() => {
    if (mapRef.current) {
      // Clear all event listeners
      google.maps.event.clearInstanceListeners(mapRef.current);
    }
    mapRef.current = null;
  }, []);

  // Handle map click with debounce to prevent double-firing
  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      // Skip if we're handling a marker click
      if (isHandlingMarkerClick) {
        setIsHandlingMarkerClick(false);
        return;
      }

      if (event.latLng && props.sendDataToForm) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarker({
          lat,
          lng,
          title: "New Marker",
          description: "Description",
        });
        props.sendDataToForm(lat, lng);
      }
    },
    [isHandlingMarkerClick, props]
  );

  const handleSearchInput = (search: any) => {
    console.log(search);
    setSearchInput(search.value.description);
    geocodeByAddress(search.value.description)
      .then((results) => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        console.log("Successfully got latitude and longitude", { lat, lng });

        setMarker({
          lat,
          lng,
          title: "New Marker",
          description: "Description",
        });
        setMapCenter({ lat, lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
        if (props.sendDataToForm) {
          props.sendDataToForm(lat, lng);
        }
      });
  };

  const handleMarkerClick = useCallback(() => {
    // Set the flag to prevent handling map click
    setIsHandlingMarkerClick(true);

    if (marker) {
      setSelectedMarker(marker);
    }
  }, [marker]);

  const goToUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      setMapCenter(userLocation);
      mapRef.current.panTo(userLocation);
    }
  }, [userLocation]);

  // Show loading or error state
  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error loading Google Maps: {loadError.message}</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Google Maps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={12}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          <View>
            <GooglePlacesAutocomplete
              selectProps={{
                value: searchInput,
                onChange: (value) => {
                  handleSearchInput(value);
                },
              }}
            />
          </View>
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

          {marker && (
            <Marker
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={handleMarkerClick}
            />
          )}

          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.lat,
                lng: selectedMarker.lng,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <View>
                <Text>{selectedMarker.title}</Text>
                <Text>Lat: {selectedMarker.lat.toFixed(4)}</Text>
                <Text>Lng: {selectedMarker.lng.toFixed(4)}</Text>
              </View>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
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
  );
};

const styles = StyleSheet.create({
  container: {
    height: 500,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  locationButton: {
    position: "absolute",
    bottom: 130,
    right: 20,
    width: 50,
    height: 50,
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
});

export default HomeWebMap;
