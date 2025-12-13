import { io, type Socket } from 'socket.io-client';
import { api } from 'boot/api';

let socket: Socket | null = null;

export function useSocket() {
  const initSocket = () => {
    if (socket?.connected) {
      return socket;
    }

    if (socket) {
      socket.connect();
      return socket;
    }

    const apiBaseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
    const socketUrl = apiBaseUrl.replace(/\/$/, '');

    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return socket;
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const joinChannel = (channelId: number) => {
    if (!socket?.connected) {
      socket?.once('connect', () => {
        socket?.emit('channel:join', channelId);
      });
      return;
    }
    socket.emit('channel:join', channelId);
  };

  const leaveChannel = (channelId: number) => {
    if (socket?.connected) {
      socket.emit('channel:leave', channelId);
    }
  };

  const joinUserRoom = (userId: number) => {
    if (!socket?.connected) {
      socket?.once('connect', () => {
        socket?.emit('user:join', userId);
      });
      return;
    }
    socket.emit('user:join', userId);
  };

  const getSocket = () => socket;

  return {
    socket: getSocket,
    initSocket,
    disconnectSocket,
    joinChannel,
    leaveChannel,
    joinUserRoom,
  };
}
