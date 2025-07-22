import React, { createContext, useContext, useState } from 'react';

export type RideStatus = 'accepted' | 'completed' | 'cancelled';

export interface RideHistoryItem {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  driver: string;
  fare: number;
  distance: number;
  duration: number;
  status: RideStatus;
  rating?: number;
  cancellationReason?: string;
}

interface RideHistoryContextType {
  rides: RideHistoryItem[];
  addRide: (ride: RideHistoryItem) => void;
  clearHistory: () => void;
}

const RideHistoryContext = createContext<RideHistoryContextType | undefined>(undefined);

export const RideHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rides, setRides] = useState<RideHistoryItem[]>([]);

  const addRide = (ride: RideHistoryItem) => {
    setRides((prev) => [ride, ...prev]);
  };

  const clearHistory = () => setRides([]);

  return (
    <RideHistoryContext.Provider value={{ rides, addRide, clearHistory }}>
      {children}
    </RideHistoryContext.Provider>
  );
};

export const useRideHistory = () => {
  const ctx = useContext(RideHistoryContext);
  if (!ctx) throw new Error('useRideHistory must be used within a RideHistoryProvider');
  return ctx;
}; 