import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

// In dev, Vite proxy only handles HTTP; socket.io needs the backend origin directly.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : "/");

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    return () => s.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Subscribe a callback to one or more socket events; auto-cleans up.
export function useQueueEvents(events, handler) {
  const { socket } = useContext(SocketContext) || {};
  useEffect(() => {
    if (!socket) return;
    const list = Array.isArray(events) ? events : [events];
    list.forEach((e) => socket.on(e, handler));
    return () => list.forEach((e) => socket.off(e, handler));
  }, [socket, events, handler]);
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  return ctx?.socket || null;
}