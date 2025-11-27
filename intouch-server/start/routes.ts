// start/routes.ts
import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import path from 'node:path'

import Mention from '#models/mention'
import Channel from '#models/channel'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import ChannelInvite from '#models/channel_invite'
import Message from '#models/message'
import KickVote from '#models/kick_vote'
import { getIO } from './socket.js'

/**
 * Root – test
 */
router.get('/', async () => {
  return { hello: 'world' }
})

router.get('/channels/:id/members', async ({ params }) => {
  const channel = await Channel.query()
    .where('id', params.id)
    .preload('members', (query) => {
      query.pivotColumns(['status', 'joined_at'])
      // Vrátime členov, LEN ak ich status v kanáli NIE JE 'banned'
      query.wherePivot('status', '!=', 'banned')
    })
    .firstOrFail()

  return channel.members.map((u) => ({
    id: u.id,
    name:
      u.nickname ||
      `${u.firstname ?? ''} ${u.surname ?? ''}`.trim() ||
      u.email,
    status: u.status || 'offline',
    channelRole: u.$extras.pivot_status
  }))
})


/**
 * GET /channels
 */
router.get('/channels', async ({ request }) => {
  const userId = request.input('userId') as number | null

  if (!userId) {
    return []
  }

  // Vráť len public kanály, kde je používateľ členom + private kanály, kde má access
  const channels = await Channel.query()
    .where((query) => {
      query
        .where('availability', 'public')
        .whereIn('id', (sub) => {
          sub
            .from('channel_members')
            .select('channel_id')
            .where('user_id', userId)
            .where('status', '!=', 'banned')
        })
    })
    .orWhereIn('id', (sub) => {
      sub
        .from('access')
        .select('channel_id')
        .where('user_id', userId)
        .whereNull('deleted_at')
    })
    .orderBy('title')

  return channels
})

/**
 * GET /channels/search
 * Vyhľadá public kanály, do ktorých používateľ nie je členom
 */
router.get('/channels/search', async ({ request, response }) => {
  const userId = Number(request.input('userId'))
  const query = request.input('q') as string | null

  if (!userId) {
    return response.badRequest({ message: 'userId je povinný.' })
  }

  // Získaj ID kanálov, kde je používateľ už členom
  const userChannelIds = await ChannelMember.query()
    .where('user_id', userId)
    .select('channel_id')

  const channelIds = userChannelIds.map(cm => cm.channelId)

  // Vyhľadaj public kanály, do ktorých používateľ nie je členom
  let channelsQuery = Channel.query()
    .where('availability', 'public')
    .whereNotIn('id', channelIds.length > 0 ? channelIds : [-1]) // -1 zabezpečí, že ak je zoznam prázdny, vráti všetky public kanály

  if (query && query.trim().length > 0) {
    channelsQuery = channelsQuery.where('title', 'ilike', `%${query.trim()}%`)
  }

  const channels = await channelsQuery.orderBy('title').limit(20)

  return channels.map(ch => ({
    id: ch.id,
    title: ch.title,
    availability: ch.availability,
    creatorId: ch.creatorId,
    createdAt: ch.createdAt.toISO()
  }))
})

/**
 * POST /channels/:id/join
 * Pripojí používateľa k public kanálu
 */
router.post('/channels/:id/join', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const userIdInput = request.input('userId')
  const userId = typeof userIdInput === 'number' ? userIdInput : Number(userIdInput)

  if (Number.isNaN(channelId) || Number.isNaN(userId) || !userId) {
    return response.badRequest({ message: 'Neplatné ID kanála alebo userId.' })
  }

  // Skontroluj, či používateľ existuje
  const user = await User.find(userId)
  if (!user) {
    console.error(`❌ User ${userId} not found when trying to join channel ${channelId}`)
    return response.notFound({ message: `Používateľ s ID ${userId} neexistuje.` })
  }

  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  if (channel.availability !== 'public') {
    return response.forbidden({ message: 'Tento kanál nie je verejný.' })
  }

  // Skontroluj, či už nie je členom
  const existingMember = await ChannelMember.query()
    .where('user_id', userId)
    .where('channel_id', channelId)
    .first()

  if (existingMember) {
    if (existingMember.status === 'banned') {
      return response.forbidden({ message: 'Máš ban v tomto kanáli.' })
    }
    return response.conflict({ message: 'Už si členom tohto kanála.' })
  }

  // Pridaj používateľa ako člena
  await ChannelMember.create({
    userId: userId,
    channelId: channelId,
    status: 'member'
  })

  // Pošli WebSocket event o pripojení (kanál sa pridá do zoznamu)
  const io = getIO()
  if (io) {
    io.emit('channel:joined', {
      channelId: channel.id,
      userId: userId,
      channel: {
        id: channel.id,
        title: channel.title,
        availability: channel.availability,
        creatorId: channel.creatorId,
        createdAt: channel.createdAt.toISO()
      }
    })
    console.log(`📢 Sent channel:joined event for user ${userId}, channel ${channel.id}`)
  }

  return {
    message: `Pripojený do kanála #${channel.title}`,
    channel: {
      id: channel.id,
      title: channel.title,
      availability: channel.availability,
      creatorId: channel.creatorId,
      createdAt: channel.createdAt.toISO()
    }
  }
})

/**
 * GET /invites
 */
router.get('/invites', async ({ request }) => {
  const userId = Number(request.input('userId'))
  if (!userId) return []

  const invites = await ChannelInvite
    .query()
    .where('user_id', userId)
    .where('status', 'pending')
    .preload('channel')

  return invites.map((inv) => ({
    id: inv.id,
    channelId: inv.channelId,
    title: inv.channel.title,
    availability: inv.channel.availability,
    createdAt: inv.createdAt.toISO(),
  }))
})

/**
 * POST /invites/:id/accept
 */
router.post('/invites/:id/accept', async ({ params, response }) => {
  const invite = await ChannelInvite.find(params.id)

  if (!invite || invite.status !== 'pending') {
    return response.badRequest({
      message: 'Pozvánka neexistuje alebo nie je pending.',
    })
  }

  invite.status = 'accepted'
  await invite.save()

  await Access.firstOrCreate({
    userId: invite.userId,
    channelId: invite.channelId,
  })

  await ChannelMember.firstOrCreate(
    { userId: invite.userId, channelId: invite.channelId },
    { status: 'member' },
  )

  // Načítaj informácie o používateľovi a kanáli pre WebSocket event
  const user = await User.find(invite.userId)
  const channel = await Channel.find(invite.channelId)

  if (user && channel) {
    const userName = user.nickname || 
      `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || 
      user.email

    // Pošli WebSocket event do room pre daný kanál
    const io = getIO()
    if (io) {
      const room = `channel:${channel.id}`
      io.to(room).emit('member:joined', {
        channelId: channel.id,
        userId: user.id,
        userName: userName,
        status: user.status || 'offline'
      })
      console.log(`📢 Sent member:joined event for user ${user.id} (${userName}) to channel ${channel.id} room`)
    }
  }

  return { ok: true }
})

/**
 * POST /invites/:id/reject
 */
router.post('/invites/:id/reject', async ({ params, response }) => {
  const invite = await ChannelInvite.find(params.id)

  if (!invite || invite.status !== 'pending') {
    return response.badRequest({
      message: 'Pozvánka neexistuje alebo nie je pending.',
    })
  }

  invite.status = 'rejected'
  await invite.save()

  return { ok: true }
})

/**
 * POST /login
 */
router.post('/login', async ({ request, response }) => {
  const { username, password } = request.only(['username', 'password'])

  const user = await User.query()
    .where('nickname', username)
    .orWhere('email', username)
    .first()

  if (!user || user.password !== password) {
    return response.unauthorized({ message: 'Nesprávne meno alebo heslo.' })
  }

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    firstname: user.firstname,
    surname: user.surname,
    status: user.status,
  }
})

/**
 * POST /register
 */
router.post('/register', async ({ request, response }) => {
  const { firstName, lastName, email, nickname, password } = request.only([
    'firstName',
    'lastName',
    'email',
    'nickname',
    'password',
  ])

  const existingEmail = await User.query().where('email', email).first()
  if (existingEmail) {
    return response.conflict({ message: 'Tento e-mail sa už používa.' })
  }

  const existingNick = await User.query().where('nickname', nickname).first()
  if (existingNick) {
    return response.conflict({ message: 'Tento nickname sa už používa.' })
  }

  const user = await User.create({
    nickname,
    firstname: firstName,
    surname: lastName,
    email,
    profilePicture: null,
    status: 'online',
    notifyOnMentionOnly: false,
    password,
  })

  const publicChannels = await Channel.query().where('availability', 'public')

  await Promise.all(
    publicChannels.map((ch) =>
      ChannelMember.create({
        userId: user.id,
        channelId: ch.id,
        status: 'member',
      }),
    ),
  )

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    firstname: user.firstname,
    surname: user.surname,
    status: user.status,
  }
})

router.post('/auth/change-password', async ({ request, response }) => {
  const { userId, currentPassword, newPassword } = request.only([
    'userId',
    'currentPassword',
    'newPassword',
  ])

  if (!userId || !currentPassword || !newPassword) {
    return response.badRequest({ message: 'Chýbajú údaje.' })
  }

  const user = await User.find(userId)
  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  if (user.password !== currentPassword) {
    return response.unauthorized({ message: 'Aktuálne heslo je nesprávne.' })
  }

  if (newPassword.length < 6) {
    return response.badRequest({
      message: 'Nové heslo musí mať aspoň 6 znakov.',
    })
  }

  user.password = newPassword
  await user.save()

  return {
    message: 'Heslo bolo úspešne zmenené.',
  }
})


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

  // Ak sa zmenil status, pošli WebSocket event do všetkých kanálov, kde je používateľ členom
  if (payload.status && payload.status !== oldStatus) {
    const io = getIO()
    if (io) {
      // Získaj všetky kanály, kde je používateľ členom
      const channelMembers = await ChannelMember.query()
        .where('user_id', user.id)
        .where('status', '!=', 'banned')

      // Pošli event do každého kanálu
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

// GET /channels/:id/messages
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
      sender: m.sender ? {
        id: m.sender.id,
        nickname: m.sender.nickname,
        firstname: m.sender.firstname,
        surname: m.sender.surname,
        email: m.sender.email,
        profilePicture: m.sender.profilePicture,
      } : null
    }
  })
})

// POST /channels/:id/messages
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

  // 1. Vytvorenie správy
  const message = await Message.create({
    channelId,
    senderId,
    content: content.trim(),
  })

  // === 2. LOGIKA PRE MENTIONS (Zmienky) ===
  const mentionMatches = content.match(/\B@([\p{L}\p{N}_-]+)/gu)

  if (mentionMatches && mentionMatches.length > 0) {
    // 1. Odstránime duplicity cez Set a PREDTÝM TO PRETYPUJEME NA string[]
    const uniqueMatches = [...new Set(mentionMatches)] as string[]

    // 2. Odstránime zavináč (substring)
    const nicknames = uniqueMatches.map((m) => m.substring(1))

    // 3. Nájdeme userov
    const mentionedUsers = await User.query().whereIn('nickname', nicknames)

    // 4. Uložíme do DB
    if (mentionedUsers.length > 0) {
      const mentionsToCreate = mentionedUsers.map((u) => ({
        messageId: message.id,
        userId: u.id,
      }))

      await Mention.createMany(mentionsToCreate)
    }
  }
  // =========================================

  await message.load('sender')

  const serialized = message.serialize()
  const responseMessage = {
    ...serialized,
    timestamp: message.timestamp.toISO(),
    sender: message.sender ? {
      id: message.sender.id,
      nickname: message.sender.nickname,
      firstname: message.sender.firstname,
      surname: message.sender.surname,
      email: message.sender.email,
      profilePicture: message.sender.profilePicture,
    } : null
  }

  // broadcast cez socket.io
  const { getIO } = await import('#start/socket')
  const io = getIO()
  if (io) {
    const messageToBroadcast = {
      ...responseMessage,
      channelId: channelId,
      channel_id: channelId
    }
    const room = `channel:${channelId}`
    io.to(room).emit('chat:message', messageToBroadcast)
    io.emit('chat:message', messageToBroadcast)
  }

  return responseMessage
})

// POST /channels
router.post('/channels', async ({ request, response }) => {
  const { title, availability, creatorId } = request.only([
    'title',
    'availability',
    'creatorId',
  ])

  if (!title || !creatorId) {
    return response.badRequest({ message: 'title a creatorId sú povinné.' })
  }

  const user = await User.find(creatorId)
  if (!user) {
    return response.badRequest({ message: 'Používateľ (creatorId) neexistuje.' })
  }

  // Skontroluj, či kanál s týmto názvom už existuje (case-insensitive)
  const existingChannel = await Channel.query()
    .whereRaw('LOWER(title) = LOWER(?)', [title.trim()])
    .first()

  if (existingChannel) {
    return response.conflict({ message: 'Kanál s týmto názvom už existuje.' })
  }

  const safeAvailability =
    availability === 'private' ? 'private' : 'public'

  const channel = await Channel.create({
    title: title.trim(),
    availability: safeAvailability,
    creatorId: user.id,
  })

  if (safeAvailability === 'private') {
    await Access.firstOrCreate({
      userId: user.id,
      channelId: channel.id,
    })
  }

  await ChannelMember.create({
    userId: user.id,
    channelId: channel.id,
    status: 'owner',
  })

  // Pošli WebSocket event o vytvorení kanála - len tvorcovi (pre public aj private)
  const io = getIO()
  if (io) {
    io.emit('channel:created', {
      id: channel.id,
      title: channel.title,
      availability: channel.availability,
      creatorId: channel.creatorId,
      createdAt: channel.createdAt.toISO(),
      userId: user.id // Len pre tvorcu - kanál sa zobrazí len tvorcovi, ostatní ho uvidia až keď sa pripoja
    })
    console.log(`📢 Sent channel:created event for channel ${channel.id} to creator ${user.id}`)
  }

  return channel
})


router.delete('/channels/:id', async ({ params, response }) => {
  const channelId = Number(params.id)

  if (Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné ID kanála.' })
  }

  // 1. Skontrolujeme, či kanál existuje
  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  // 2. Vymažeme všetky správy
  await Message.query().where('channelId', channelId).delete()

  // 3. Vymažeme všetkých členov kanála
  await ChannelMember.query().where('channelId', channelId).delete()

  // 4. Vymažeme všetky access záznamy
  await Access.query().where('channelId', channelId).delete()

  // 5. Vymažeme všetky pozvánky
  await ChannelInvite.query().where('channelId', channelId).delete()

  // 6. Nakoniec vymažeme samotný kanál
  await channel.delete()

  // 7. Pošli WebSocket event o vymazaní kanála
  const io = getIO()
  if (io) {
    const room = `channel:${channelId}`
    // Pošli event do roomu kanála (pre používateľov, ktorí sú v tom kanáli)
    io.to(room).emit('channel:deleted', {
      channelId: channelId,
      title: channel.title
    })
    // Pošli event globálne, aby všetci používatelia vedeli, že kanál bol vymazaný
    io.emit('channel:deleted', {
      channelId: channelId,
      title: channel.title
    })
    console.log(`📢 Sent channel:deleted event for channel ${channelId} (${channel.title})`)
  }

  return { message: 'Kanál bol úspešne vymazaný.' }
})

router.post('/channels/:id/leave', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const userId = Number(request.input('userId'))

  if (!userId || Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné dáta.' })
  }

  // Skontrolujeme, či kanál existuje
  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  // Nájdeme záznam v ChannelMember
  const member = await ChannelMember
    .query()
    .where('channelId', channelId)
    .where('userId', userId)
    .first()

  if (!member) {
    return response.badRequest({ message: 'Nie si členom tohto kanála.' })
  }

  // Ak je používateľ OWNER → nesmie opustiť
  if (member.status === 'owner') {
    return response.forbidden({
      message: 'Owner nemôže opustiť kanál. Môže ho iba vymazať.'
    })
  }

  // Vymažeme ho z ChannelMember
  await member.delete()

  // Vymažeme aj access záznam
  await Access.query().where('userId', userId).where('channelId', channelId).delete()

  return {
    message: 'Opustil si kanál.',
    channelId
  }
})



/**
 * POST /channels/:id/invites
 */
router.post('/channels/:id/invites', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const { userId, inviterId } = request.only(['userId', 'inviterId'])

  if (Number.isNaN(channelId)) return response.badRequest({ message: 'Neplatné ID kanála.' })
  if (!userId || !inviterId) return response.badRequest({ message: 'userId a inviterId sú povinné.' })

  const channel = await Channel.find(channelId)
  if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

  const user = await User.find(userId)
  if (!user) return response.notFound({ message: 'Používateľ neexistuje.' })

  if (userId === inviterId) return response.badRequest({ message: 'Nemôžeš pozvať sám seba.' })

  if (channel.availability === 'private') {
    const inviterMember = await ChannelMember.query()
      .where('userId', inviterId)
      .where('channelId', channelId)
      .first()

    if (!inviterMember || inviterMember.status !== 'owner') {
      return response.forbidden({
        message: 'Len vlastník súkromného kanála môže pozývať používateľov.'
      })
    }
  }

  const existingMember = await ChannelMember.query()
    .where('userId', userId)
    .where('channelId', channelId)
    .first()

  if (existingMember) return response.conflict({ message: 'Používateľ už je členom tohto kanála.' })

  const existingInvite = await ChannelInvite.query()
    .where('userId', userId)
    .where('channelId', channelId)
    .where('status', 'pending')
    .first()

  if (existingInvite) return response.conflict({ message: 'Používateľ už má pending pozvánku.' })

  const anyInvite = await ChannelInvite.query()
    .where('userId', userId)
    .where('channelId', channelId)
    .first()

  if (anyInvite) {
    if (anyInvite.status === 'rejected') {
      await anyInvite.delete()
    } else if (anyInvite.status === 'accepted') {
      return response.conflict({ message: 'Používateľ už má pozvánku.' })
    }
  }

  try {
    const invite = await ChannelInvite.create({
      channelId,
      userId,
      inviterId,
      status: 'pending',
    })

    // Načítaj channel pre WebSocket event
    await invite.load('channel')

    // Pošli WebSocket event konkrétnemu používateľovi
    const io = getIO()
    if (io) {
      // Bezpečne získaj createdAt - ak nie je nastavený, použij aktuálny čas
      const createdAt = invite.createdAt?.toISO() || new Date().toISOString()
      
      io.emit('invite:created', {
        id: invite.id,
        channelId: invite.channelId,
        title: invite.channel.title,
        availability: invite.channel.availability,
        createdAt: createdAt,
        userId: invite.userId
      })
      console.log(`📢 Sent invite:created event for user ${invite.userId}, channel ${invite.channelId}`)
    }

    return invite
  } catch (error) {
    const dbError = error as { code?: string; message?: string }
    if (dbError.code === '23505') {
      return response.conflict({ message: 'Pozvánka pre tohto používateľa už existuje.' })
    }
    throw error
  }
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

  return { message: 'Foto uložené.', profilePicture: publicPath }
})

/**
 * GET /avatars/:filename
 */
router.get('/avatars/:filename', async ({ params, response }) => {
  const filePath = app.publicPath(`avatars/${params.filename}`)
  return response.download(filePath)
})


/* ==========================================================================
   COMMAND LINE ROUTES
   ========================================================================== */

router.group(() => {

  // /join
  router.post('/join', async ({ request, response }) => {
    const { userId, channelName, type } = request.all()
    const safeTitle = channelName?.trim()
    if (!userId || !safeTitle) return response.badRequest({ message: 'Chýbajú údaje.' })

    const user = await User.find(userId)
    if (!user) return response.notFound({ message: 'User nenájdený.' })

    const existingChannel = await Channel.findBy('title', safeTitle)

    if (existingChannel) {
      if (existingChannel.availability === 'private') {
        const hasAccess = await Access.query().where('user_id', userId).where('channel_id', existingChannel.id).first()
        if (!hasAccess) return response.forbidden({ message: `Kanál '${safeTitle}' je súkromný. Musíš byť pozvaný.` })
      }
      const existingMember = await ChannelMember.query().where('user_id', userId).where('channel_id', existingChannel.id).first()
      if (existingMember && existingMember.status === 'banned') return response.forbidden({ message: 'Máš ban v tomto kanáli.' })

      await ChannelMember.firstOrCreate({ userId: user.id, channelId: existingChannel.id }, { status: 'member' })
      return { message: `Pripojený do kanála #${safeTitle}`, channel: existingChannel }
    } else {
      // Ak kanál neexistuje, vytvor ho ako public (ak nie je explicitne zadané 'private')
      const availability = (type === 'private') ? 'private' : 'public'
      const channel = await Channel.create({ title: safeTitle, availability: availability, creatorId: user.id })
      
      // Pre private kanály vytvor access záznam
      if (availability === 'private') {
        await Access.create({ userId: user.id, channelId: channel.id })
      }
      
      await ChannelMember.create({ userId: user.id, channelId: channel.id, status: 'owner' })

      // Pošli WebSocket event o vytvorení kanála - len tvorcovi (pre public aj private)
      const io = getIO()
      if (io) {
        io.emit('channel:created', {
          id: channel.id,
          title: channel.title,
          availability: channel.availability,
          creatorId: channel.creatorId,
          createdAt: channel.createdAt.toISO(),
          userId: user.id // Len pre tvorcu - kanál sa zobrazí len tvorcovi, ostatní ho uvidia až keď sa pripoja
        })
        console.log(`📢 Sent channel:created event (via /join) for channel ${channel.id} to creator ${user.id}`)
      }

      return { message: `Kanál #${safeTitle} (${availability}) bol vytvorený.`, channel }
    }
  })

  // /invite
  router.post('/invite', async ({ request, response }) => {
    const { userId, channelId, targetNick } = request.all()
    const channel = await Channel.find(channelId)
    const targetUser = await User.findBy('nickname', targetNick)
    const requesterMember = await ChannelMember.query().where('user_id', userId).where('channel_id', channelId).first()

    if (!channel || !targetUser || !requesterMember) return response.badRequest({ message: 'Kanál alebo používateľ neexistuje.' })

    if (channel.availability === 'private') {
      if (requesterMember.status !== 'owner') return response.forbidden({ message: 'Do súkromného kanála môže pozývať len správca.' })
      await Access.firstOrCreate({ userId: targetUser.id, channelId: channel.id })
      await ChannelMember.updateOrCreate({ userId: targetUser.id, channelId: channel.id }, { status: 'member' })

      // Ak bol ban, zmažeme staré hlasy
      await KickVote.query().where('channel_id', channel.id).where('target_user_id', targetUser.id).delete()

      return { message: `Používateľ ${targetNick} bol pridaný do súkromného kanála.` }
    }

    // Public logic
    const targetMember = await ChannelMember.query().where('user_id', targetUser.id).where('channel_id', channelId).first()
    if (targetMember && targetMember.status === 'banned') {
      if (requesterMember.status === 'owner') {
        targetMember.status = 'member'
        await targetMember.save()
        // Admin zrušil ban -> vymažeme hlasy z DB
        await KickVote.query().where('channel_id', channel.id).where('target_user_id', targetUser.id).delete()

        return { message: `Ban pre ${targetNick} bol zrušený správcom.` }
      } else {
        return response.forbidden({ message: 'Tento používateľ má ban. Len správca ho môže obnoviť.' })
      }
    }
    if (!targetMember) {
      await ChannelInvite.create({ channelId: channel.id, userId: targetUser.id, inviterId: userId, status: 'pending' })
      return { message: `Pozvánka pre ${targetNick} bola odoslaná.` }
    }
    return { message: `${targetNick} už je členom kanála.` }
  })

  // /revoke
  router.post('/revoke', async ({ request, response }) => {
    const { userId, channelId, targetNick } = request.all()
    const channel = await Channel.find(channelId)
    const requesterMember = await ChannelMember.query().where('user_id', userId).where('channel_id', channelId).first()

    if (channel?.availability !== 'private') return response.badRequest({ message: 'Príkaz /revoke funguje len v súkromných kanáloch.' })
    if (requesterMember?.status !== 'owner') return response.forbidden({ message: 'Len správca môže odoberať prístup.' })

    const targetUser = await User.findBy('nickname', targetNick)
    if (!targetUser) return response.notFound({ message: 'Používateľ nenájdený.' })

    await Access.query().where('user_id', targetUser.id).where('channel_id', channelId).delete()
    await ChannelMember.query().where('user_id', targetUser.id).where('channel_id', channelId).delete()
    return { message: `Prístup pre ${targetNick} bol odobratý.` }
  })

  /**
   * /kick [nickName]
   */
  router.post('/kick', async ({ request, response }) => {
    const { userId, channelId, targetNick } = request.all()

    if (!targetNick) return response.badRequest({ message: 'Musíš zadať meno (nick).' })

    const channel = await Channel.find(channelId)
    if (!channel) return response.badRequest({ message: 'Chyba: Kanál sa nenašiel.' })

    const targetUser = await User.findBy('nickname', targetNick)
    if (!targetUser) return response.badRequest({ message: `Chyba: Používateľ '${targetNick}' neexistuje.` })

    const requester = await ChannelMember.query().where('user_id', userId).where('channel_id', channelId).first()
    if (!requester) return response.badRequest({ message: 'Chyba: Ty nie si členom tohto kanála.' })

    if (targetUser.id === userId) {
      return response.badRequest({ message: 'Nemôžeš vyhodiť sám seba. Použi /cancel.' })
    }

    const targetMember = await ChannelMember.query().where('user_id', targetUser.id).where('channel_id', channelId).first()
    if (!targetMember) {
      return response.badRequest({ message: `Chyba: Používateľ '${targetNick}' nie je v tomto kanáli.` })
    }

    // Ochrana správcu
    if (targetMember.status === 'owner') {
      return response.forbidden({ message: 'Nemôžeš vyhodiť správcu kanála!' })
    }

    // ADMIN LOGIKA (Instant Ban)
    if (requester.status === 'owner') {
      targetMember.status = 'banned'
      await targetMember.save()

      if (channel.availability === 'private') {
        await Access.query().where('user_id', targetUser.id).where('channel_id', channelId).delete()
      }

      await KickVote.query().where('channel_id', channelId).where('target_user_id', targetUser.id).delete()

      return { message: `Správca udelil BAN používateľovi ${targetNick}.` }
    }

    // MEMBER LOGIKA (Hlasovanie)
    const existingVote = await KickVote.query()
      .where('channel_id', channelId)
      .where('target_user_id', targetUser.id)
      .where('voter_user_id', userId)
      .first()

    if (existingVote) {
      return response.conflict({ message: 'Už si hlasoval za vyhodenie tohto člena.' })
    }

    await KickVote.create({
      channelId: channelId,
      targetUserId: targetUser.id,
      voterUserId: userId
    })

    const votesCountResult = await KickVote.query()
      .where('channel_id', channelId)
      .where('target_user_id', targetUser.id)
      .count('* as total')

    const totalVotes = Number(votesCountResult[0].$extras.total)

    if (totalVotes >= 3) {
      targetMember.status = 'banned'
      await targetMember.save()

      if (channel.availability === 'private') {
        await Access.query().where('user_id', targetUser.id).where('channel_id', channelId).delete()
      }

      await KickVote.query().where('channel_id', channelId).where('target_user_id', targetUser.id).delete()

      return { message: `Používateľ ${targetNick} bol zabanovaný na základe hlasovania (${totalVotes} hlasov).` }
    }

    return { message: `Hlasoval si za kick ${targetNick}. Aktuálne hlasy: ${totalVotes}/3.` }
  })

  // /quit
  router.post('/quit', async ({ request, response }) => {
    const { userId, channelId } = request.all()
    const channel = await Channel.find(channelId)
    if (!channel) return response.notFound()
    if (channel.creatorId !== userId) return response.forbidden({ message: 'Len správca môže zrušiť kanál.' })

    await KickVote.query().where('channel_id', channelId).delete()
    await channel.delete()
    return { message: 'Kanál bol úspešne zrušený.' }
  })

  // /cancel
  router.post('/cancel', async ({ request, response }) => {
    const { userId, channelId } = request.all()
    const channel = await Channel.find(channelId)
    if (!channel) return response.notFound()

    if (channel.creatorId === userId) {
      await channel.delete()
      return { message: 'Opustil si kanál ako vlastník. Kanál bol zrušený.', action: 'deleted' }
    }

    await ChannelMember.query().where('user_id', userId).where('channel_id', channelId).delete()

    await KickVote.query().where('channel_id', channelId).where('voter_user_id', userId).delete()
    await KickVote.query().where('channel_id', channelId).where('target_user_id', userId).delete()

    if (channel.availability === 'private') {
      await Access.query().where('user_id', userId).where('channel_id', channelId).delete()
    }
    return { message: 'Opustil si kanál.', action: 'left' }
  })

}).prefix('/cmd')
