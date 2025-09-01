import React from "react";
import { Platform } from "react-native";
import HomeMobile from "../../components/home.mobile";
import HomeWebMap from "../../components/home.web";
//import { MapReloadProvider } from "../utilities/MapReload";

const Home = () => {
  console.log(`Detected platform: ${Platform.OS}`);

  if (Platform.OS === "web") {
    console.log("Web Home Loaded");
    return (
      //<MapReloadProvider>
      <HomeWebMap />
      //</MapReloadProvider>
    );
  } else if (Platform.OS === "android") {
    console.log("Mobile Home Loaded");
    return <HomeMobile />;
  }

  return null; // Handle other platforms if needed
};

export default Home;
