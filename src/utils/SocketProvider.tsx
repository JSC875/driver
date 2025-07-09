import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from '@clerk/clerk-expo';

const SOCKET_URL = "https://roqet-socket.up.railway.app/";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
        query: {
          type: "driver",
          id: user.id,
        },
      });
      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}; 