import React, { createContext, useState, useContext } from "react";

// Create a context with default values
const MapReloadContext = createContext<{
    reloadMap: boolean;
    triggerReload: () => void;
}>({
    reloadMap: false,
    triggerReload: () => {},
});

// Provider component that wraps components needing map reload functionality
export const MapReloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [reloadMap, setReloadMap] = useState(false);

    const triggerReload = () => {
        setReloadMap((prev) => !prev); // Toggle state to trigger a reload
    };

    return (
        <MapReloadContext.Provider value={{ reloadMap, triggerReload }}>
            {children}
        </MapReloadContext.Provider>
    );
};

// Custom hook to use the map reload context
export const useMapReload = () => useContext(MapReloadContext);