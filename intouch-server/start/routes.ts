// start/routes.ts
import router from '@adonisjs/core/services/router'

import Channel from '#models/channel'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import ChannelInvite from '#models/channel_invite'
import Message from '#models/message'

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
    })
    .firstOrFail()

  return channel.members.map((u) => ({
    id: u.id,
    name:
      u.nickname ||
      `${u.firstname ?? ''} ${u.surname ?? ''}`.trim() ||
      u.email,
    status: u.status || 'offline'
  }))
})


/**
 * GET /channels
 * - bez userId: všetky PUBLIC
 * - s userId: PUBLIC + PRIVATE, kde má user záznam v access
 */
router.get('/channels', async ({ request }) => {
  const userId = request.input('userId') as number | null

  // neprihlásený → len public
  if (!userId) {
    return await Channel.query()
      .where('availability', 'public')
      .orderBy('title')
  }

  // prihlásený → public + private s accessom
  const channels = await Channel.query()
    .where('availability', 'public')
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
 * GET /invites?userId=1
 * Vracia pending pozvánky daného používateľa
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
 * - označí invite ako accepted
 * - vytvorí Access + ChannelMember
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

  return { ok: true }
})

/**
 * POST /invites/:id/reject
 * - označí invite ako rejected
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
 * POST /login – podľa nickname alebo emailu
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
 * POST /register – vytvorí usera + pridá ho do všetkých PUBLIC kanálov
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

/**
 * GET /users/search?q=... – vyhľadá používateľov podľa nickname alebo emailu
 * MUST be defined BEFORE /users/:id to avoid route conflicts
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
 * GET /users/:id – detail pre SettingsPage
 */
router.get('/users/:id', async ({ params, response }) => {
  const user = await User.find(params.id)

  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  return user
})

/**
 * PUT /users/:id – update profilu zo SettingsPage
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

  user.merge(payload)
  await user.save()

  return user
})

// GET /channels/:id/messages – správy v kanáli
router.get('/channels/:id/messages', async ({ params, response }) => {
  const channelId = Number(params.id)

  if (Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné ID kanála.' })
  }

  // načítaj správy pre kanál + autora správy
  const messages = await Message.query()
    .where('channelId', channelId)
    .preload('sender')
    .orderBy('timestamp', 'asc')

  // frontend očakáva: { id, content, timestamp, senderId, sender: { ... } }
  return messages.map((m) => m.serialize())
})


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

  const safeAvailability =
    availability === 'private' ? 'private' : 'public'

  // 1) vytvoríme kanál
  const channel = await Channel.create({
    title,
    availability: safeAvailability,
    creatorId: user.id,
  })

  // 2) ak je private, rovno mu dáme Access
  if (safeAvailability === 'private') {
    await Access.firstOrCreate({
      userId: user.id,
      channelId: channel.id,
    })
  }

  // 3) a nech je owner v ChannelMember
  await ChannelMember.create({
    userId: user.id,
    channelId: channel.id,
    status: 'owner',
  })

  return channel
})

/**
 * POST /channels/:id/invites – vytvorí pozvánku pre používateľa do kanála
 */
router.post('/channels/:id/invites', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const { userId, inviterId } = request.only(['userId', 'inviterId'])

  if (Number.isNaN(channelId)) {
    return response.badRequest({ message: 'Neplatné ID kanála.' })
  }

  if (!userId || !inviterId) {
    return response.badRequest({ message: 'userId a inviterId sú povinné.' })
  }

  const channel = await Channel.find(channelId)
  if (!channel) {
    return response.notFound({ message: 'Kanál neexistuje.' })
  }

  const user = await User.find(userId)
  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  // kontrola, či sa používateľ nesnaží pozvať sám seba
  if (userId === inviterId) {
    return response.badRequest({ message: 'Nemôžeš pozvať sám seba.' })
  }

  // kontrola, či už nie je členom
  const existingMember = await ChannelMember.query()
    .where('userId', userId)
    .where('channelId', channelId)
    .first()

  if (existingMember) {
    return response.conflict({ message: 'Používateľ už je členom tohto kanála.' })
  }

  // kontrola, či už nemá pending pozvánku
  const existingInvite = await ChannelInvite.query()
    .where('userId', userId)
    .where('channelId', channelId)
    .where('status', 'pending')
    .first()

  if (existingInvite) {
    return response.conflict({ message: 'Používateľ už má pending pozvánku do tohto kanála.' })
  }

  // kontrola, či už existuje akákoľvek pozvánka (aj accepted/rejected) - kvôli unique constraintu
  const anyInvite = await ChannelInvite.query()
    .where('userId', userId)
    .where('channelId', channelId)
    .first()

  if (anyInvite) {
    // ak je accepted, používateľ by už mal byť členom
    // ak je rejected, môžeme vytvoriť novú pozvánku, ale musíme najprv vymazať starú
    if (anyInvite.status === 'rejected') {
      await anyInvite.delete()
    } else if (anyInvite.status === 'accepted') {
      return response.conflict({ message: 'Používateľ už má pozvánku do tohto kanála.' })
    }
  }

  try {
    const invite = await ChannelInvite.create({
      channelId,
      userId,
      inviterId,
      status: 'pending',
    })

    return invite
  } catch (error) {
    // catch database constraint violations
    const dbError = error as { code?: string; message?: string }
    if (dbError.code === '23505') { // PostgreSQL unique violation
      return response.conflict({ message: 'Pozvánka pre tohto používateľa už existuje.' })
    }
    throw error
  }
})



