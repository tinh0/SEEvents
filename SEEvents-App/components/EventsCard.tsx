import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import React from "react";

type EventsProps = {
  id: number;
  name: string;
  organizer: string;
  attendeeLimit: number;
  locationName: string;
  description: string;
  category: string;
  handlePress: any;
  thumbnailUrl: string;
  startTime: Date;
  endTime: Date;
  distance?: number; // Added distance prop
};

const EventsCard = (props: EventsProps) => {
  // Format distance to show 1 decimal place if under 10 miles, otherwise round to nearest mile
  const formatDistance = (distance: number) => {
    if (distance < 10) {
      return distance.toFixed(1);
    }
    return Math.round(distance);
  };

  return (
    <TouchableOpacity
      onPress={props.handlePress}
      activeOpacity={0.7}
      style={styles.card}
    >
      {(props.thumbnailUrl != "" && props.thumbnailUrl != null && (
        <Image style={styles.image} source={{ uri: props.thumbnailUrl }} />
      )) || (
        <Image
          style={styles.image}
          source={require("../assets/images/missing_image.png")}
        />
      )}

      <View style={styles.details}>
        <Text style={styles.name}>{props.name}</Text>
        {new Date(props.startTime).toLocaleDateString() ==
        new Date(props.endTime).toLocaleDateString() ? (
          <Text>
            {new Date(props.startTime).toLocaleTimeString([], {
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(props.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : (
          <>
            <Text style={styles.time}>
              {new Date(props.startTime).toLocaleDateString([], {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
            </Text>
          </>
        )}

        <Text>Organized by {props.organizer}</Text>
        
        <View style={styles.bottomRow}>
          <Text style={styles.eventCategory}>{props.category}</Text>
          {props.distance !== undefined && (
            <Text style={styles.distanceText}>
              {formatDistance(props.distance)} {props.distance === 1 ? 'mile' : 'miles'} away
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e9ecef",
    padding: 16,
    paddingBottom: 13,
    marginBottom: 8,
    borderRadius: 8,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    width: 75,
    height: 75,
    borderRadius: 100,
    marginRight: 16,
    backgroundColor: "#ccc",
  },
  details: {
    fontSize: 14,
    color: "#6c757d",
    flexWrap: "wrap",
    flex: 1,
  },
  organizer: {
    fontSize: 12,
  },
  time: {
    paddingBottom: 0,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  eventCategory: {
    fontSize: 12,
    color: "#495057",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
});

export default EventsCard;