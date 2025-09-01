import React, { useEffect, useState, useRef } from "react";
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { FIREBASE_AUTH } from "../../../FirebaseConfig";
import { showAlert } from "@/app/utilities/crossPlatformAlerts";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  local?: boolean;
}

const CommunityChatRoom = () => {
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{id: string, username: string} | null>(null);
  const [communityName, setCommunityName] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  const communityId = Array.isArray(id) ? id[0] : id;

  // Fetch community details
  useEffect(() => {
    const fetchCommunityDetails = async () => {
      try {
        const response = await api.get(`/api/communities/${communityId}`);
        if (response && response.data && response.data.length > 0) {
          setCommunityName(response.data[0].name);
        }
      } catch (error) {
        console.error("Error fetching community details:", error);
      }
    };
    
    fetchCommunityDetails();
  }, [communityId]);

  // Check if user is member/moderator
  useEffect(() => {
    const checkMembershipStatus = async () => {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) return;
      
      try {
        // Check if member
        const membersResponse = await api.get(`/api/community_members/${communityId}`);
        const members = membersResponse.data as any[];
        setIsMember(members.some((member) => member.id === userId));
        
        // Check if moderator
        const moderatorsResponse = await api.get(`/api/community_moderators/${communityId}`);
        const moderators = moderatorsResponse.data as any[];
        setIsModerator(moderators.some((mod) => mod.id === userId));

        // If neither, redirect back
        if (!members.some((member) => member.id === userId) && 
            !moderators.some((mod) => mod.id === userId)) {
          showAlert("Access Denied", "You are not a member of this community.");
          router.back();
        }
      } catch (error) {
        console.error("Error checking membership status:", error);
      }
    };
    
    checkMembershipStatus();
  }, [communityId]);

  // Fetch current user details
  useEffect(() => {
    const userId = FIREBASE_AUTH.currentUser?.uid;
    if (userId) {
      api.get(`/api/users/${userId}`).then((response: { data: string | any[]; }) => {
        if (response && response.data && response.data.length > 0) {
          setCurrentUser({
            id: userId,
            username: response.data[0].username
          });
        }
      }).catch((error: any) => {
        console.error("Error fetching user details:", error);
      });
    }
  }, []);

  // Fetch messages and set up polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/api/community_chat/${communityId}`);
        setMessages(response.data.messages || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching community messages:", error);
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [communityId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
  
    const tempMessageId = Date.now().toString();
    const tempTimestamp = new Date().toISOString();
  
    const tempMessage = {
      id: tempMessageId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      message: newMessage,
      timestamp: tempTimestamp,
      local: true,
    };
  
    setNewMessage("");
    setMessages(prevMessages => [...prevMessages, tempMessage]);
  
    try {
      const response = await api.post("/api/community_chat/send", {
        communityId,
        senderId: currentUser.id,
        senderName: currentUser.username,
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
      showAlert("Error", "Failed to send message");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading community chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: communityName ? `${communityName} Chat` : "Community Chat",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageContainer}
        contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyChat}>No messages yet. Be the first to say hello!</Text>
        ) : (
          messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.senderId === currentUser?.id
                  ? styles.currentUserBubble
                  : styles.otherUserBubble
              ]}
            >
              <Text
                style={
                  msg.senderId === currentUser?.id
                    ? styles.currentUserText
                    : styles.otherUserText
                }
              >
                {msg.message}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  msg.senderId === currentUser?.id
                    ? styles.currentUserTimestamp
                    : styles.otherUserTimestamp
                ]}
              >
                {msg.senderName} •{" "}
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString()
                  : "Sending..."} 
              </Text>
            </View>
          ))
        )}
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
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
  },
  emptyChat: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  messageContainer: {
    flex: 1,
    padding: 16,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
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

export default CommunityChatRoom;