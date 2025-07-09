import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://roqet-socket.up.railway.app/";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      // Add auth if needed:
      // auth: { token: "YOUR_JWT" }
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 