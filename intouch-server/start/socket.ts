// start/socket.ts
import { Server as IOServer } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Env from '#start/env'

let io: IOServer | null = null

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
    console.log('✅ WS connected:', socket.id, 'Total clients:', io.sockets.sockets.size)

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

    socket.on('disconnect', (reason) => {
      console.log('WS disconnected:', socket.id, reason)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  console.log('Socket.IO initialized')
}

export function getIO() {
  return io
}
