import React, { createContext, useContext, useState } from 'react';

const OnlineStatusContext = createContext<{
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
}>({
  isOnline: false,
  setIsOnline: () => {},
});

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  return (
    <OnlineStatusContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => useContext(OnlineStatusContext); 