// CommunityCard.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
type CommunityCardProps = {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  category: string;
  iconUrl?: string;
};

const CommunityCard = (props: CommunityCardProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.communityCard}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/communities/[id]",
          params: {
            id: props.id,
          },
        })
      }
    >
      {(props.iconUrl != "" && props.iconUrl != null && (
        <Image style={styles.communityIcon} source={{ uri: props.iconUrl }} />
      )) || (
        <Image
          style={styles.communityIcon}
          source={require("../assets/images/missing_image.png")}
        />
      )}
      <View style={styles.communityInfoContainer}>
        <Text style={styles.communityName}>{props.name}</Text>
        <Text style={styles.communityDescription}>{props.description}</Text>
        <Text style={styles.communityCategory}>{props.category}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  communityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e9ecef",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexWrap: "wrap",
  },
  communityIcon: {
    width: 75,
    height: 75,
    borderRadius: 100,
    marginRight: 16,
    backgroundColor: "#ccc",
  },
  communityInfoContainer: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  communityDescription: {
    fontSize: 14,
    color: "#6c757d",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  communityCategory: {
    fontSize: 12,
    color: "#495057",
    marginTop: 4,
  },
  goToPageButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 8,
    marginLeft: "auto",
  },
  goToPageText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CommunityCard;
