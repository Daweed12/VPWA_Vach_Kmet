import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import ChannelInvite from '#models/channel_invite'
import { getIO } from '../socket.js'

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

  const user = await User.find(invite.userId)
  const channel = await Channel.find(invite.channelId)

  if (user && channel) {
    const userName = user.nickname || 
      `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || 
      user.email

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

    await invite.load('channel')

    const io = getIO()
    if (io) {
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

