import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import User from '#models/user'
import Message from '#models/message'
import Mention from '#models/mention'
import OfflineMessage from '#models/offline_message'
import { getIO } from '../socket.js'

/**
 * GET /channels/:id/messages
 */
router.get('/channels/:id/messages', async ({ params, response }) => {
  const channelId = Number(params.id)

  if (Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné ID kanála.' })
  }

  const messages = await Message.query()
    .where('channelId', channelId)
    .preload('sender')
    .orderBy('timestamp', 'asc')

  return messages.map((m) => {
    const serialized = m.serialize()
    return {
      ...serialized,
      timestamp: m.timestamp.toISO(),
      sender: m.sender
        ? {
            id: m.sender.id,
            nickname: m.sender.nickname,
            firstname: m.sender.firstname,
            surname: m.sender.surname,
            email: m.sender.email,
            profilePicture: m.sender.profilePicture,
          }
        : null,
    }
  })
})

/**
 * POST /channels/:id/messages
 */
router.post('/channels/:id/messages', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const { content, senderId } = request.only(['content', 'senderId'])

  if (Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné ID kanála.' })
  }

  if (!content || !content.trim()) {
    return response.badRequest({ message: 'Obsah správy je povinný.' })
  }

  if (!senderId) {
    return response.badRequest({ message: 'senderId je povinný.' })
  }

  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  const user = await User.find(senderId)
  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  // Ak je používateľ offline, uložiť správu do queue
  if (user.connection === 'offline') {
    const offlineMessage = await OfflineMessage.create({
      channelId,
      senderId,
      content: content.trim(),
    })

    return {
      message: 'Správa bola uložená a bude odoslaná keď sa pripojíš.',
      offline: true,
      id: offlineMessage.id,
    }
  }

  // Ak je online, vytvoriť normálnu správu
  const message = await Message.create({
    channelId,
    senderId,
    content: content.trim(),
  })

  // Handle mentions
  const mentionMatches = content.match(/\B@([\p{L}\p{N}_-]+)/gu)

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

  // Broadcast via socket.io
  const io = getIO()
  if (io) {
    const messageToBroadcast = {
      ...responseMessage,
      channelId: channelId,
      channel_id: channelId,
    }
    const room = `channel:${channelId}`
    io.to(room).emit('chat:message', messageToBroadcast)
    io.emit('chat:message', messageToBroadcast)
  }

  return responseMessage
})
