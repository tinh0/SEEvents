import { View, Text } from "react-native";
import React from "react";
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
type Props = {
  onSignIn: (res: CredentialResponse) => Promise<void>;
};

const GoogleSignInWeb = (onSignIn: Props) => {
  return (
    <GoogleOAuthProvider clientId="">
      <GoogleLogin
        onSuccess={onSignIn}
        onError={() => {
          console.log("ERROR");
        }}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleSignInWeb;
