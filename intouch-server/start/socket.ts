// start/socket.ts
import { Server as IOServer } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Env from '#start/env'
import { cleanupInactiveChannels } from '#start/routes/channels'

let io: IOServer | null = null
let cleanupInterval: ReturnType<typeof setInterval> | null = null

export async function boot() {
  // Wait until Adonis boots the HTTP server
  await server.booted

  const httpServer = server.getNodeServer()

  io = new IOServer(httpServer, {
    cors: {
      origin: Env.get('FRONTEND_ORIGIN', 'http://localhost:9000'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log('✅ WS connected:', socket.id, 'Total clients:', io?.sockets.sockets.size ?? 0)

    socket.on('channel:join', (channelId: number) => {
      const room = `channel:${channelId}`
      socket.join(room)
      console.log(`📥 Socket ${socket.id} joined room ${room}`)
    })

    socket.on('channel:leave', (channelId: number) => {
      const room = `channel:${channelId}`
      socket.leave(room)
      console.log(`📤 Socket ${socket.id} left room ${room}`)
    })

    socket.on('user:join', (userId: number) => {
      const userRoom = `user:${userId}`
      socket.join(userRoom)
      console.log(`📥 Socket ${socket.id} joined user room ${userRoom}`)
    })

    socket.on('chat:message', (msg) => {
      // Broadcast to all connected clients (fallback if no room specified)
      io?.emit('chat:message', msg)
    })

    socket.on('typing:update', (data: { channelId: number; userId: number; userName: string; userAvatar?: string; draftContent?: string }) => {
      const room = `channel:${data.channelId}`
      // Broadcast typing update to all users in the channel except the sender
      socket.to(room).emit('typing:update', {
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        draftContent: data.draftContent,
      })
      console.log(`⌨️ User ${data.userId} (${data.userName}) is typing in channel ${data.channelId}`)
    })

    socket.on('typing:stop', (data: { channelId: number; userId: number }) => {
      const room = `channel:${data.channelId}`
      // Broadcast typing stop to all users in the channel except the sender
      socket.to(room).emit('typing:stop', {
        userId: data.userId,
      })
      console.log(`⌨️ User ${data.userId} stopped typing in channel ${data.channelId}`)
    })

    socket.on('disconnect', (reason) => {
      console.log('WS disconnected:', socket.id, reason)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  console.log('Socket.IO initialized')

  cleanupInterval = setInterval(async () => {
    try {
      await cleanupInactiveChannels()
    } catch (error) {
      console.error('❌ Error during channel cleanup:', error)
    }
  }, 100)

  console.log('🧹 Channel cleanup scheduled every 10 seconds')
}

export function getIO() {
  return io
}

export function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    console.log('🧹 Channel cleanup stopped')
  }
}
