// start/socket.ts
import { Server as IOServer } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Env from '#start/env'

let io: IOServer | null = null

export async function boot() {
  try {
    console.log('🔧 Starting Socket.IO initialization...')
    
    // Wait until Adonis boots the HTTP server
    await server.booted
    console.log('✅ Server booted, getting HTTP server...')

    const httpServer = server.getNodeServer()
    
    if (!httpServer) {
      console.error('❌ HTTP server is not available!')
      return
    }

    console.log('✅ HTTP server obtained, creating Socket.IO server...')

    io = new IOServer(httpServer, {
      cors: {
        origin: Env.get('FRONTEND_ORIGIN', 'http://localhost:9000'),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['polling', 'websocket'], // Polling first for better compatibility
      allowEIO3: true, // Allow Engine.IO v3 clients
      pingTimeout: 60000,
      pingInterval: 25000
    })

    console.log('✅ Socket.IO server created, setting up event handlers...')

    io.on('connection', (socket) => {
      console.log('✅ WS connected:', socket.id, 'Total clients:', io?.sockets.sockets.size)

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

    console.log('✅ Socket.IO initialized and ready on http://localhost:3333/socket.io/')
  } catch (error) {
    console.error('❌ Error initializing Socket.IO:', error)
    throw error
  }
}

export function getIO() {
  return io
}
