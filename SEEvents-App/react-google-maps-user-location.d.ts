declare module "react-google-maps-user-location" {
    import React from "react";
    import { GoogleMap } from "@react-google-maps/api";
  
    interface UserLocationButtonProps {
      map: GoogleMap | null;
      onLocationRetrieved?: (position: GeolocationPosition) => void;
      iconOptions?: {
        scale?: number;
      };
    }
  
    const UserLocationButton: React.FC<UserLocationButtonProps>;
    export default UserLocationButton;
  }
  