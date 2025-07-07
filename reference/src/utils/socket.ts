import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://bike-taxi-production.up.railway.app";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"], // Use WebSocket only
      // Add authentication or query params if needed
    });
  }
  return socket;
}; 