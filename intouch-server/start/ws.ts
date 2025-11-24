// start/ws.ts
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Env from '#start/env'
import Message from '#models/message'  // uprav podľa tvojho modelu
import ChannelMember from '#models/channel_member' // ak chceš validovať členstvo

let io: Server

server.booted(() => {
  io = new Server(server.getNodeServer(), {
    path: '/ws',
    cors: {
      origin: Env.get('FRONTEND_ORIGIN', 'http://localhost:9000'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // (voliteľné) jednoduchý auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      // ak máš auth tokeny, tu si ich vieš overiť
      // napr. cez auth.verify(token)
      // zatiaľ pustíme každého
      next()
    } catch (e) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    console.log('WS connected', socket.id)

    socket.on('channel:join', async (channelId: number) => {
      const room = `channel:${channelId}`
      socket.join(room)
      console.log(`socket ${socket.id} joined ${room}`)
    })

    socket.on('channel:leave', (channelId: number) => {
      const room = `channel:${channelId}`
      socket.leave(room)
    })

    socket.on('chat:message', async (payload: {
      channelId: number
      userId: number
      text: string
    }, ack?: (res: any) => void) => {
      try {
        const { channelId, userId, text } = payload

        // (voliteľné) over, že user je člen kanála
        // await ChannelMember.query()
        //  .where('channel_id', channelId)
        //  .where('user_id', userId)
        //  .firstOrFail()

        const msg = await Message.create({
          channelId,
          userId,
          text,
        })

        const serialized = {
          id: msg.id,
          channelId: msg.channelId,
          userId: msg.userId,
          text: msg.text,
          createdAt: msg.createdAt,
        }

        io.to(`channel:${channelId}`).emit('chat:message', serialized)
        ack?.({ ok: true, message: serialized })
      } catch (e) {
        console.error(e)
        ack?.({ ok: false, error: 'Cannot send message' })
      }
    })

    socket.on('typing:start', (data: { channelId: number, user: any }) => {
      socket.to(`channel:${data.channelId}`).emit('typing:start', data.user)
    })

    socket.on('typing:stop', (data: { channelId: number, userId: number }) => {
      socket.to(`channel:${data.channelId}`).emit('typing:stop', data)
    })

    socket.on('disconnect', () => {
      console.log('WS disconnected', socket.id)
    })
  })
})

export function getIo() {
  return io
}
