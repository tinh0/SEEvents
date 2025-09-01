import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import UserCard from "./UserCard";

type ListModalProps = {
  isModalVisible: boolean;
  setIsModalVisible: any;
  topic: string;
  list: [];
};

const ListModal = (props: ListModalProps) => {
  return (
    <Modal visible={props.isModalVisible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{props.topic}</Text>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => props.setIsModalVisible(false)}
          >
            <FontAwesome name="close" size={24} color="black" />
          </TouchableOpacity>
          <ScrollView style={styles.scroll}>
        {props.list.map((user: any) => {
          return (
            <UserCard
              key={user.id}
              id={user.id}
              username={user.username}
              firstName={user.firstName}
              lastName={user.lastName}
              pfpUrl={user.pfpUrl}
            />
          );
        })}
      </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ListModal;

const styles = StyleSheet.create({
  scroll: {
    height: "100%",
    width: "100%",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  closeModalButton: {
    alignSelf: "flex-end",
  },
});
