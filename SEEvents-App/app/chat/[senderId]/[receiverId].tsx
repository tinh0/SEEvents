import React, { useEffect, useState, useRef } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import api from "../../api/api";

const ChatRoom = () => {
  const params = useLocalSearchParams();
  const senderId = params.senderId as string;
  const receiverId = params.receiverId as string;
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch initial data and set up polling
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [senderRes, receiverRes] = await Promise.all([
          api.get(`/api/users/${senderId}`),
          api.get(`/api/users/${receiverId}`),
        ]);
        setSenderName(senderRes.data[0].username);
        setReceiverName(receiverRes.data[0].username);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/api/chat/${senderId}/${receiverId}`);
        setMessages(response.data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    const loadData = async () => {
      await fetchUsers();
      await fetchMessages();
      setLoading(false);
    };

    if (senderId && receiverId) {
      loadData();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [senderId, receiverId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const tempMessageId = Date.now().toString();
    const tempTimestamp = new Date().toISOString();
  
    const tempMessage = {
      id: tempMessageId,
      senderId, // Ensure senderId is explicitly set
      receiverId,
      message: newMessage,
      timestamp: tempTimestamp, // Use a valid timestamp immediately
      local: true, // Mark it as a local message
    };
  
    setNewMessage("");
    setMessages(prevMessages => [...prevMessages, tempMessage]);
  
    try {
      const response = await api.post("/api/chat/send", {
        senderId,
        receiverId,
        message: newMessage,
        timestamp: tempTimestamp,
      });
  
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempMessageId ? response.data.message : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== tempMessageId)
      );
      alert("Failed to send message");
    }
  };
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `${receiverName}'s Chat` }} />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageContainer}
        contentContainerStyle={{ paddingVertical: 10, flexGrow: 1, justifyContent: 'flex-end' }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.senderId === senderId
                ? styles.currentUserBubble
                : styles.otherUserBubble
            ]}
          >
            <Text
              style={
                msg.senderId === senderId
                  ? styles.currentUserText
                  : styles.otherUserText
              }
            >
              {msg.message}
            </Text>
            <Text
              style={[
                styles.timestamp,
                msg.senderId === senderId
                  ? styles.currentUserTimestamp
                  : styles.otherUserTimestamp
              ]}
            >
              {msg.senderId === senderId ? senderName : receiverName} •{" "}
              {msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString()
                : "Sending..."} 
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.input}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  messageContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  currentUserBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
    borderBottomLeftRadius: 4,
  },
  currentUserText: {
    color: "white",
    fontSize: 16,
  },
  otherUserText: {
    color: "black",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  currentUserTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherUserTimestamp: {
    color: "rgba(0, 0, 0, 0.5)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default ChatRoom;