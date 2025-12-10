import { io, type Socket } from 'socket.io-client';
import { api } from 'boot/api';

export function useSocket() {
  let socket: Socket | null = null;

  const initSocket = () => {
    // Don't recreate if already exists and connected
    if (socket) {
      if (socket.connected) {
        console.log('Socket already connected');
        return;
      }
      // If socket exists but not connected, disconnect and recreate
      socket.disconnect();
      socket = null;
    }

    console.log('🔌 Initializing Socket.IO connection...');

    // Get API base URL from the api instance
    const apiBaseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
    const socketUrl = apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash

    console.log('🔗 Connecting to:', socketUrl);

    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: false,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return socket;
  };

  const joinChannel = (channelId: number) => {
    if (!socket) {
      console.warn('⚠️ Socket not initialized, initializing now...');
      initSocket();
      // Wait a bit for socket to initialize, then try again
      setTimeout(() => {
        if (socket?.connected) {
          socket.emit('channel:join', channelId);
          console.log('✅ Joined channel after initialization:', channelId);
        } else {
          socket?.once('connect', () => {
            socket?.emit('channel:join', channelId);
            console.log('✅ Joined channel after delayed connection:', channelId);
          });
        }
      }, 100);
      return;
    }

    if (!socket.connected) {
      console.warn('⚠️ Socket not connected, will join when connected. Channel:', channelId);
      // Wait for connection and then join
      const connectHandler = () => {
        socket?.emit('channel:join', channelId);
        console.log('✅ Joined channel after reconnection:', channelId);
        socket?.off('connect', connectHandler); // Remove listener to avoid duplicates
      };
      socket.once('connect', connectHandler);
      return;
    }

    socket.emit('channel:join', channelId);
    console.log('✅ Emitted channel:join for channel:', channelId);
  };

  const leaveChannel = (channelId: number) => {
    if (!socket?.connected) {
      return;
    }
    socket.emit('channel:leave', channelId);
    console.log('Left channel:', channelId);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const joinUserRoom = (userId: number) => {
    if (!socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot join user room. User:', userId);
      return;
    }
    socket.emit('user:join', userId);
    console.log('✅ Emitted user:join for user:', userId);
  };

  const getSocket = () => socket;

  return {
    socket: getSocket,
    initSocket,
    joinChannel,
    leaveChannel,
    disconnectSocket,
    joinUserRoom,
  };
}
