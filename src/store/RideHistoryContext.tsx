import React, { createContext, useContext, useState, useEffect } from 'react';
import { rideHistoryService, RideHistoryItem as ApiRideHistoryItem } from '../services/rideHistoryService';
import { getRidePrice } from '../utils/priceUtils';

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
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  addRide: (ride: RideHistoryItem) => void;
  clearHistory: () => void;
  fetchRideHistory: () => Promise<void>;
  refreshRideHistory: () => Promise<void>;
}

const RideHistoryContext = createContext<RideHistoryContextType | undefined>(undefined);

export const RideHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRideHistory = async (token?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('No authentication token provided');
      }
      
      console.log('🔄 Fetching ride history from API...');
      const response = await rideHistoryService.fetchRideHistory(token);
      
      if (response.success) {
        console.log('✅ Ride history fetched successfully:', response.data.length, 'rides');
        setRides(response.data);
        setHasLoaded(true);
      } else {
        console.error('❌ Failed to fetch ride history:', response.error);
        setError(response.error || 'Failed to fetch ride history');
      }
    } catch (error) {
      console.error('❌ Error in fetchRideHistory:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshRideHistory = async (token?: string) => {
    console.log('🔄 Refreshing ride history...');
    setHasLoaded(false); // Reset the loaded flag to allow refresh
    await fetchRideHistory(token);
  };

  const addRide = (ride: RideHistoryItem) => {
    // Round the fare for easier payment between driver and user
    const roundedRide = {
      ...ride,
      fare: getRidePrice(ride.fare)
    };
    setRides((prev) => [roundedRide, ...prev]);
  };

  const clearHistory = () => {
    setRides([]);
    setError(null);
    setHasLoaded(false);
  };

  // Note: fetchRideHistory will be called from the component with the token

  return (
    <RideHistoryContext.Provider value={{ 
      rides, 
      loading, 
      error, 
      hasLoaded,
      addRide, 
      clearHistory, 
      fetchRideHistory,
      refreshRideHistory 
    }}>
      {children}
    </RideHistoryContext.Provider>
  );
};

export const useRideHistory = () => {
  const ctx = useContext(RideHistoryContext);
  if (!ctx) throw new Error('useRideHistory must be used within a RideHistoryProvider');
  return ctx;
}; 