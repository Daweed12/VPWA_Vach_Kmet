// start/ws.ts
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Env from '#start/env'
import Message from '#models/message'

let io: Server

export async function boot() {
  // Wait until Adonis boots the HTTP server
  await server.booted

  const httpServer = server.getNodeServer()

  io = new Server(httpServer, {
    path: '/ws',
    cors: {
      origin: Env.get('FRONTEND_ORIGIN', 'http://localhost:9000'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // (voliteľné) jednoduchý auth middleware
  io.use(async (socket, next) => {
    try {
      // ak máš auth tokeny, tu si ich vieš overiť
      // const token = socket.handshake.auth?.token
      // napr. cez auth.verify(token)
      // zatiaľ pustíme každého
      next()
    } catch (e) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    console.log('✅ WS connected:', socket.id, 'Total clients:', io.sockets.sockets.size)

    socket.on('channel:join', async (channelId: number) => {
      const room = `channel:${channelId}`
      socket.join(room)
      console.log(`📥 Socket ${socket.id} joined room ${room}`)
    })

    socket.on('channel:leave', (channelId: number) => {
      const room = `channel:${channelId}`
      socket.leave(room)
      console.log(`📤 Socket ${socket.id} left room ${room}`)
    })

    socket.on('chat:message', async (payload: {
      channelId: number
      senderId: number
      content: string
    }, ack?: (res: { ok: boolean; message?: any; error?: string }) => void) => {
      try {
        const { channelId, senderId, content } = payload

        // (voliteľné) over, že user je člen kanála
        // await ChannelMember.query()
        //  .where('channel_id', channelId)
        //  .where('user_id', senderId)
        //  .firstOrFail()

        const msg = await Message.create({
          channelId,
          senderId,
          content: content.trim(),
        })

        // Load sender relationship
        await msg.load('sender')

        const serialized = {
          id: msg.id,
          channelId: msg.channelId,
          content: msg.content,
          timestamp: msg.timestamp.toISO(),
          sender: msg.sender ? {
            id: msg.sender.id,
            nickname: msg.sender.nickname,
            firstname: msg.sender.firstname,
            surname: msg.sender.surname,
            email: msg.sender.email,
            profilePicture: msg.sender.profilePicture,
          } : null
        }

        io.to(`channel:${channelId}`).emit('chat:message', serialized)
        ack?.({ ok: true, message: serialized })
      } catch (e) {
        console.error('Error creating message:', e)
        ack?.({ ok: false, error: 'Cannot send message' })
      }
    })

    socket.on('typing:start', (data: { channelId: number, user: any }) => {
      socket.to(`channel:${data.channelId}`).emit('typing:start', data.user)
    })

    socket.on('typing:stop', (data: { channelId: number, userId: number }) => {
      socket.to(`channel:${data.channelId}`).emit('typing:stop', data)
    })

    socket.on('disconnect', (reason) => {
      console.log('WS disconnected:', socket.id, reason)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  console.log('Socket.IO initialized (ws.ts)')
}

export function getIo() {
  return io
}
