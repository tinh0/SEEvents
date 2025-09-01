import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

type UserCardProps = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  pfpUrl: string;
}

const UserCard = (props: UserCardProps) => {
  return (
    <View style={styles.card}>
      <Text>{props.username}</Text>
      <Text>{props.firstName}</Text>
      <Text>{props.lastName}</Text>
      <Text>{props.pfpUrl}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    display: "flex"
  }
});

export default UserCard