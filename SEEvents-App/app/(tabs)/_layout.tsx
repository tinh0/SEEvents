import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Tabs, Redirect, Href, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { LoadScript } from "@react-google-maps/api";

const TabIcon = ({ icon, color, name, focused }: any) => {
  return (
    <View className="items-center justify-center gap-2">
      <Ionicons name={icon} size={32} color={color} />
      <Text style={{ color: color, fontSize: 11 }}>{name}</Text>
    </View>
  );
};

const TabsLayout = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = FIREBASE_AUTH.onAuthStateChanged((authObj) => {
      unsub();
      if (!authObj) {
        router.push("/");
      }
      setLoading(false);
    });
  }, []);
  const router = useRouter();
  var tabs = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFA001",
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="map" color={color} name="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="balloon-sharp"
              color={color}
              name="Events"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="search-outline"
              color={color}
              name="Explore"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: "Communities",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="people"
              color={color}
              name="Communities"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="heart-circle"
              color={color}
              name="Friends"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="person-circle"
              color={color}
              name="Profile"
              focused={focused}
            />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                const userId = FIREBASE_AUTH.currentUser?.uid;
                if (userId) {
                  router.push(
                    `/profile/${userId}` as Href<`/profile/${string}`>
                  );
                }
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
  return (
    !loading && (
      <>
        <LoadScript
          googleMapsApiKey=""
          libraries={["places"]}
          onLoad={() => console.log("Google maps API Loaded")}
          onError={() => console.error("Failed to load Google Maps API")}
        >{tabs}</LoadScript>
      </>
    )
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  tabBar: {
    height: 75,
  },
  label: {
    fontSize: 11,
  },
});
