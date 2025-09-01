import React, { useState, useEffect } from "react";
import { View, Linking, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator, Button } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

type MarkerType = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
};

const EventsMobile = ({sendDataToForm}:any, {coordinates}: any) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<MarkerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "undetermined">("undetermined");

  useEffect(() => {
    checkAndRequestPermissions();
    console.log(coordinates);
    if (coordinates) {
      const latitude = coordinates.x;
      const longitude = coordinates.y;
      console.log(coordinates);
      setMarker({
        latitude,
        longitude,
        title: "Marker",
        description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
      });
    }
  }, []);

  const checkAndRequestPermissions = async () => {
    setLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === "undetermined") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
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
      const currentLocation = await Location.getCurrentPositionAsync({});
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

  const handleMapPress = (event: any) => {
    if (marker) {
      setMarker(null); // If a marker already exists, remove it
    } else {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      sendDataToForm(latitude, longitude) 
      setMarker({
        latitude,
        longitude,
        title: "Marker",
        description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
      });
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
        <Text>Unable to fetch location. Please enable permissions in settings.</Text>
        <Button title="Go to Settings" onPress={openSettings} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handleMapPress}
      >
        {marker && (
          <Marker
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
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
  modalButton: {
    backgroundColor: "#85a5ff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
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
});

export default EventsMobile;
