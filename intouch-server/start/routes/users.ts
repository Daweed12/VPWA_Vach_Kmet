import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import path from 'node:path'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
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
      error: error instanceof Error ? error.message : String(error)
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
    'notifyOnMentionOnly',
  ])

  const oldStatus = user.status
  user.merge(payload)
  await user.save()

  // If status changed, send WebSocket event to all channels where user is a member
  if (payload.status && payload.status !== oldStatus) {
    const io = getIO()
    if (io) {
      const channelMembers = await ChannelMember.query()
        .where('user_id', user.id)
        .where('status', '!=', 'banned')

      for (const member of channelMembers) {
        const room = `channel:${member.channelId}`
        io.to(room).emit('user:status:changed', {
          userId: user.id,
          status: user.status,
          name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email
        })
        console.log(`📢 Sent status change event for user ${user.id} to room ${room}`)
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
        name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email
      })
      console.log(`📢 Sent avatar change event for user ${user.id} to room ${room}`)
    }
    
    io.emit('user:avatar:changed', {
      userId: user.id,
      profilePicture: publicPath,
      name: user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email
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

