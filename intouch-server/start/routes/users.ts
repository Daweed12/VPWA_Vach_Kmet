import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import path from 'node:path'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import OfflineMessage from '#models/offline_message'
import Message from '#models/message'
import Mention from '#models/mention'
import { getIO } from '../socket.js'

/**
 * GET /users/search
 */
router.get('/users/search', async ({ request, response }) => {
  try {
    const query = request.input('q') as string | null

    if (!query || query.trim().length < 2) {
      return []
    }

    const searchTerm = query.trim().toLowerCase()

    const users = await User.query()
      .where((builder) => {
        builder
          .whereRaw('LOWER(nickname) LIKE ?', [`%${searchTerm}%`])
          .orWhereRaw('LOWER(email) LIKE ?', [`%${searchTerm}%`])
          .orWhere((subBuilder) => {
            subBuilder
              .whereRaw('LOWER(firstname) LIKE ?', [`%${searchTerm}%`])
              .orWhereRaw('LOWER(surname) LIKE ?', [`%${searchTerm}%`])
          })
      })
      .limit(10)

    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      email: u.email,
      firstname: u.firstname,
      surname: u.surname,
      name: u.nickname || `${u.firstname ?? ''} ${u.surname ?? ''}`.trim() || u.email,
      status: u.status,
    }))
  } catch (error) {
    console.error('Error in /users/search:', error)
    return response.internalServerError({
      message: 'Chyba pri vyhľadávaní používateľov.',
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

/**
 * GET /users/:id
 */
router.get('/users/:id', async ({ params, response }) => {
  const user = await User.find(params.id)

  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  return user
})

/**
 * PUT /users/:id
 */
router.put('/users/:id', async ({ params, request, response }) => {
  const user = await User.find(params.id)

  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  const payload = request.only([
    'firstname',
    'surname',
    'nickname',
    'email',
    'status',
    'connection',
    'notifyOnMentionOnly',
  ])

  const oldConnection = user.connection
  const oldNickname = user.nickname
  const oldFirstname = user.firstname
  const oldSurname = user.surname
  const oldEmail = user.email
  const oldStatus = user.status
  user.merge(payload)
  await user.save()

  const io = getIO()
  if (io) {
    const channelMembers = await ChannelMember.query()
      .where('user_id', user.id)
      .where('status', '!=', 'banned')

    // If connection changed from offline to online, load and send offline messages
    if (payload.connection && payload.connection === 'online' && oldConnection === 'offline') {
      // Načítať offline správy, ktoré používateľ poslal keď bol offline
      const offlineMessages = await OfflineMessage.query()
        .where('sender_id', user.id)
        .preload('sender')
        .preload('channel')
        .orderBy('created_at', 'asc')

      // Odoslať každú offline správu cez WebSocket
      for (const offlineMsg of offlineMessages) {
        const message = await Message.create({
          channelId: offlineMsg.channelId,
          senderId: offlineMsg.senderId,
          content: offlineMsg.content,
        })

        // Handle mentions
        const mentionMatches = offlineMsg.content.match(/\B@([\p{L}\p{N}_-]+)/gu)

        if (mentionMatches && mentionMatches.length > 0) {
          const uniqueMatches = [...new Set(mentionMatches)] as string[]
          const nicknames = uniqueMatches.map((m) => m.substring(1))
          const mentionedUsers = await User.query().whereIn('nickname', nicknames)

          if (mentionedUsers.length > 0) {
            const mentionsToCreate = mentionedUsers.map((u) => ({
              messageId: message.id,
              userId: u.id,
            }))

            await Mention.createMany(mentionsToCreate)
          }
        }

        await message.load('sender')

        const serialized = message.serialize()
        const responseMessage = {
          ...serialized,
          timestamp: message.timestamp.toISO(),
          sender: message.sender
            ? {
                id: message.sender.id,
                nickname: message.sender.nickname,
                firstname: message.sender.firstname,
                surname: message.sender.surname,
                email: message.sender.email,
                profilePicture: message.sender.profilePicture,
              }
            : null,
        }

        const messageToBroadcast = {
          ...responseMessage,
          channelId: offlineMsg.channelId,
          channel_id: offlineMsg.channelId,
        }

        const room = `channel:${offlineMsg.channelId}`
        io.to(room).emit('chat:message', messageToBroadcast)
        io.emit('chat:message', messageToBroadcast)

        // Vymazať offline správu
        await offlineMsg.delete()
      }

      console.log(`📢 Sent ${offlineMessages.length} offline messages for user ${user.id}`)
    }

    // If nickname or name fields changed, broadcast update
    const nicknameChanged =
      (payload.nickname && payload.nickname !== oldNickname) ||
      (payload.firstname && payload.firstname !== oldFirstname) ||
      (payload.surname && payload.surname !== oldSurname) ||
      (payload.email && payload.email !== oldEmail)

    if (nicknameChanged) {
      for (const member of channelMembers) {
        const room = `channel:${member.channelId}`
        io.to(room).emit('user:nickname:changed', {
          userId: user.id,
          nickname: user.nickname,
          firstname: user.firstname,
          surname: user.surname,
          email: user.email,
          name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email,
        })
        console.log(`📢 Sent nickname change event for user ${user.id} to room ${room}`)
      }
      // Also broadcast globally for other listeners (optional)
      io.emit('user:nickname:changed', {
        userId: user.id,
        nickname: user.nickname,
        firstname: user.firstname,
        surname: user.surname,
        email: user.email,
        name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email,
      })
    }

    // If status or connection changed, send WebSocket event to all channels where user is a member
    if ((payload.status && payload.status !== oldStatus) || (payload.connection && payload.connection !== oldConnection)) {
      for (const member of channelMembers) {
        const room = `channel:${member.channelId}`
        io.to(room).emit('user:status:changed', {
          userId: user.id,
          status: user.status,
          connection: user.connection,
          name:
            user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email,
        })
        console.log(`📢 Sent status change event for user ${user.id} to room ${room}`)
      }

      // Pošli aj konkrétnemu používateľovi event o zmene connection (pre odpojenie WebSocketu)
      if (payload.connection && payload.connection !== oldConnection) {
        io.to(`user:${user.id}`).emit('user:connection:changed', {
          userId: user.id,
          connection: user.connection,
        })
      }
    }
  }

  return user
})

/**
 * PUT /users/:id/photo
 */
router.put('/users/:id/photo', async ({ params, request, response }) => {
  const user = await User.find(params.id)
  if (!user) return response.notFound({ message: 'Používateľ neexistuje.' })

  const imageData = request.input('image') as string | null
  if (!imageData) return response.badRequest({ message: 'Chýba obrázok.' })

  const match = imageData.match(/^data:(.+);base64,(.+)$/)
  if (!match) return response.badRequest({ message: 'Neplatný formát obrázka.' })

  const mimeType = match[1]
  const base64 = match[2]

  let ext = 'png'
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg'
  if (mimeType === 'image/webp') ext = 'webp'
  if (mimeType === 'image/gif') ext = 'gif'

  const buffer = Buffer.from(base64, 'base64')
  const uploadDir = app.publicPath('avatars')

  await fs.mkdir(uploadDir, { recursive: true })

  const safeNickname = user.nickname.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `${user.id}_${safeNickname}.${ext}`
  const filePath = path.join(uploadDir, fileName)

  await fs.writeFile(filePath, buffer)

  const publicPath = `avatars/${fileName}`

  user.profilePicture = publicPath
  await user.save()

  // Send WebSocket event to all channels where user is a member
  const io = getIO()
  if (io) {
    const channelMembers = await ChannelMember.query()
      .where('user_id', user.id)
      .where('status', '!=', 'banned')

    for (const member of channelMembers) {
      const room = `channel:${member.channelId}`
      io.to(room).emit('user:avatar:changed', {
        userId: user.id,
        profilePicture: publicPath,
        name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email,
      })
      console.log(`📢 Sent avatar change event for user ${user.id} to room ${room}`)
    }

    io.emit('user:avatar:changed', {
      userId: user.id,
      profilePicture: publicPath,
      name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email,
    })
  }

  return { message: 'Foto uložené.', profilePicture: publicPath }
})

/**
 * GET /avatars/:filename
 */
router.get('/avatars/:filename', async ({ params, response }) => {
  const filePath = app.publicPath(`avatars/${params.filename}`)
  return response.download(filePath)
})
