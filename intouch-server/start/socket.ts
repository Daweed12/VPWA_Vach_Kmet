// start/socket.ts
import { Server as IOServer } from 'socket.io'
import server from '@adonisjs/core/services/server'

let io: IOServer | null = null

export async function boot() {
  // Wait until Adonis boots the HTTP server
  await server.booted

  const httpServer = server.getNodeServer()

  io = new IOServer(httpServer, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log('WS connected:', socket.id)

    socket.on('chat:message', (msg) => {
      io?.emit('chat:message', msg)
    })

    socket.on('disconnect', () => {
      console.log('WS disconnected:', socket.id)
    })
  })

  console.log('Socket.IO initialized')
}

export function getIO() {
  return io
}
