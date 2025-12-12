import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import User from '#models/user'
import Message from '#models/message'
import ChannelInvite from '#models/channel_invite'
import { DateTime } from 'luxon'
import { getIO } from '../socket.js'

/**
 * GET /channels/:id/members
 */
router.get('/channels/:id/members', async ({ params }) => {
  const channel = await Channel.query()
    .where('id', params.id)
    .preload('members', (query) => {
      query.pivotColumns(['status', 'joined_at'])
      query.wherePivot('status', '!=', 'banned')
    })
    .firstOrFail()

  return channel.members.map((u) => ({
    id: u.id,
    name: u.nickname || `${u.firstname ?? ''} ${u.surname ?? ''}`.trim() || u.email,
    nickname: u.nickname || null,
    status: u.status || 'normal',
    connection: u.connection || 'online',
    channelRole: u.$extras.pivot_status,
    profilePicture: u.profilePicture || null,
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

  // Vrátiť len kanály, kde je používateľ členom (nie je banned)
  const channels = await Channel.query()
    .whereIn('id', (sub) => {
      sub
        .from('channel_members')
        .select('channel_id')
        .where('user_id', userId)
        .where('status', '!=', 'banned')
    })
    .orderBy('title')
    .preload('members', (query) => {
      query.pivotColumns(['status', 'joined_at'])
    })

  return channels.map((ch) => ({
    id: ch.id,
    title: ch.title,
    availability: ch.availability,
    creatorId: ch.creatorId,
    createdAt: ch.createdAt?.toISO(),
    lastMessageAt: ch.lastMessageAt?.toISO() || null,
    logo: ch.imagePath || null,
  }))
})

/**
 * GET /channels/search
 */
router.get('/channels/search', async ({ request, response }) => {
  const userId = Number(request.input('userId'))
  const query = request.input('q') as string | null

  if (!userId) {
    return response.badRequest({ message: 'userId je povinný.' })
  }

  const userChannelIds = await ChannelMember.query().where('user_id', userId).select('channel_id')

  const channelIds = userChannelIds.map((cm) => cm.channelId)

  let channelsQuery = Channel.query()
    .where('availability', 'public')
    .whereNotIn('id', channelIds.length > 0 ? channelIds : [-1])

  if (query && query.trim().length > 0) {
    channelsQuery = channelsQuery.where('title', 'ilike', `%${query.trim()}%`)
  }

  const channels = await channelsQuery.orderBy('title').limit(20)

  return channels.map((ch) => ({
    id: ch.id,
    title: ch.title,
    availability: ch.availability,
    creatorId: ch.creatorId,
    createdAt: ch.createdAt.toISO(),
  }))
})

/**
 * POST /channels/:id/join
 */
router.post('/channels/:id/join', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const userIdInput = request.input('userId')
  const userId = typeof userIdInput === 'number' ? userIdInput : Number(userIdInput)

  if (Number.isNaN(channelId) || Number.isNaN(userId) || !userId) {
    return response.badRequest({ message: 'Neplatné ID kanála alebo userId.' })
  }

  const user = await User.find(userId)
  if (!user) {
    console.error(`User ${userId} not found when trying to join channel ${channelId}`)
    return response.notFound({ message: `Používateľ s ID ${userId} neexistuje.` })
  }

  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  if (channel.availability !== 'public') {
    return response.forbidden({ message: 'Tento kanál nie je verejný.' })
  }

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

  await ChannelMember.create({
    userId: userId,
    channelId: channelId,
    status: 'member',
  })

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
        createdAt: channel.createdAt.toISO(),
      },
    })
    console.log(`Sent channel:joined event for user ${userId}, channel ${channel.id}`)
  }

  return {
    message: `Pripojený do kanála #${channel.title}`,
    channel: {
      id: channel.id,
      title: channel.title,
      availability: channel.availability,
      creatorId: channel.creatorId,
      createdAt: channel.createdAt.toISO(),
    },
  }
})

/**
 * POST /channels
 */
router.post('/channels', async ({ request, response }) => {
  const { title, availability, creatorId } = request.only(['title', 'availability', 'creatorId'])

  if (!title || !creatorId) {
    return response.badRequest({ message: 'title a creatorId sú povinné.' })
  }

  const user = await User.find(creatorId)
  if (!user) {
    return response.badRequest({ message: 'Používateľ (creatorId) neexistuje.' })
  }

  const existingChannel = await Channel.query()
    .whereRaw('LOWER(title) = LOWER(?)', [title.trim()])
    .first()

  if (existingChannel) {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 })
    const lastMessageDate = existingChannel.lastMessageAt || existingChannel.createdAt
    const isInactive = lastMessageDate < thirtyDaysAgo

    if (!isInactive) {
      return response.conflict({ message: 'Kanál s týmto názvom už existuje.' })
    }

    await existingChannel.delete()
  }

  const safeAvailability = availability === 'private' ? 'private' : 'public'

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

  const io = getIO()
  if (io) {
    io.emit('channel:created', {
      id: channel.id,
      title: channel.title,
      availability: channel.availability,
      creatorId: channel.creatorId,
      createdAt: channel.createdAt.toISO(),
      userId: user.id,
    })
    console.log(`Sent channel:created event for channel ${channel.id} to creator ${user.id}`)
  }

  return channel
})

/**
 * DELETE /channels/:id
 */
router.delete('/channels/:id', async ({ params, response }) => {
  const channelId = Number(params.id)

  if (Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné ID kanála.' })
  }

  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  await Message.query().where('channelId', channelId).delete()
  await ChannelMember.query().where('channelId', channelId).delete()
  await Access.query().where('channelId', channelId).delete()
  await ChannelInvite.query().where('channelId', channelId).delete()
  await channel.delete()

  const io = getIO()
  if (io) {
    const room = `channel:${channelId}`
    io.to(room).emit('channel:deleted', {
      channelId: channelId,
      title: channel.title,
    })
    io.emit('channel:deleted', {
      channelId: channelId,
      title: channel.title,
    })
    console.log(`Sent channel:deleted event for channel ${channelId} (${channel.title})`)
  }

  return { message: 'Kanál bol úspešne vymazaný.' }
})

/**
 * POST /channels/:id/leave
 */
router.post('/channels/:id/leave', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const userId = Number(request.input('userId'))

  if (!userId || Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné dáta.' })
  }

  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  const member = await ChannelMember.query()
    .where('channelId', channelId)
    .where('userId', userId)
    .first()

  if (!member) {
    return response.badRequest({ message: 'Nie si členom tohto kanála.' })
  }

  if (member.status === 'owner') {
    return response.forbidden({
      message: 'Owner nemôže opustiť kanál. Môže ho iba vymazať.',
    })
  }

  const user = await User.find(userId)
  const userName = user
    ? user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email
    : 'Unknown'

  await member.delete()
  await Access.query().where('userId', userId).where('channelId', channelId).delete()

  const systemMessage = await Message.create({
    channelId,
    senderId: userId,
    content: `${userName} opustil kanál`,
  })

  channel.lastMessageAt = systemMessage.timestamp
  await channel.save()

  await systemMessage.load('sender')

  const serialized = systemMessage.serialize()
  const responseMessage = {
    ...serialized,
    sender: {
      id: user.id,
      nickname: user.nickname,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
      profilePicture: user.profilePicture,
    },
    channelId,
  }

  const io = getIO()
  if (io) {
    io.to(`channel:${channelId}`).emit('member:left', {
      channelId,
      userId,
      userName,
    })
    io.to(`channel:${channelId}`).emit('chat:message', responseMessage)
    io.to(`user:${userId}`).emit('channel:left', {
      channelId,
      title: channel.title,
    })
    console.log(`Sent member:left and channel:left events for user ${userId} from channel ${channelId}`)
  }

  return {
    message: 'Opustil si kanál.',
    channelId,
  }
})

export async function cleanupInactiveChannels() {
  const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

  const inactiveChannels = await Channel.query()
    .where((query) => {
      query
        .whereNull('lastmessage_at')
        .orWhere('lastmessage_at', '<', thirtyDaysAgo.toJSDate())
    })
    .where('created_at', '<', thirtyDaysAgo.toJSDate())

  const deletedCount = inactiveChannels.length

  for (const channel of inactiveChannels) {
    await channel.delete()
  }

  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} inactive channels (30+ days without messages)`)
  }

  return deletedCount
}

/**
 * POST /channels/cleanup-inactive
 * Mazanie neaktívnych kanálov (30+ dní bez správy)
 */
router.post('/channels/cleanup-inactive', async ({ response }) => {
  const deletedCount = await cleanupInactiveChannels()

  return {
    message: `Bolo vymazaných ${deletedCount} neaktívnych kanálov.`,
    deletedCount,
  }
})
