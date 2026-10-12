import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for Socket.io real-time sensor updates.
 * Manages connection, room subscriptions, and latest data.
 */
export default function useSocket(siteId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const throttleRef = useRef(0);

  useEffect(() => {
    // Connect to Socket.io server
    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket.io connected:', socket.id);

      // Join site room if siteId is set
      if (siteId) {
        socket.emit('joinSite', siteId);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket.io disconnected');
    });

    socket.on('sensorUpdate', (payload) => {
      if (payload.siteId === siteId || !siteId) {
        const now = Date.now();
        if (now - throttleRef.current >= 500) {
          setLatestData(payload.data);
          setLastUpdate(new Date(payload.timestamp));
          throttleRef.current = now;
        }
      }
    });

    return () => {
      if (siteId) {
        socket.emit('leaveSite', siteId);
      }
      socket.disconnect();
    };
  }, [siteId]);

  // Switch site rooms
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;

    if (siteId) {
      socket.emit('joinSite', siteId);
    }

    return () => {
      if (siteId) {
        socket.emit('leaveSite', siteId);
      }
    };
  }, [siteId, connected]);

  const clearData = useCallback(() => {
    setLatestData(null);
    setLastUpdate(null);
  }, []);

  return { connected, latestData, lastUpdate, clearData };
}
