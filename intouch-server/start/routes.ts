// start/routes.ts
import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import path from 'node:path'

import Channel from '#models/channel'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import ChannelInvite from '#models/channel_invite'
import Message from '#models/message'
// TOTO TU CHÝBALO:
import KickVote from '#models/kick_vote'

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
 */
router.get('/channels', async ({ request }) => {
  const userId = request.input('userId') as number | null

  if (!userId) {
    return await Channel.query()
      .where('availability', 'public')
      .orderBy('title')
  }

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

  user.merge(payload)
  await user.save()

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

  const message = await Message.create({
    channelId,
    senderId,
    content: content.trim(),
  })

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

  const safeAvailability =
    availability === 'private' ? 'private' : 'public'

  const channel = await Channel.create({
    title,
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
   COMMAND LINE ROUTES (S REALNOU DATABÁZOU A TVOJÍM MODELOM)
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
      const availability = (type === 'private') ? 'private' : 'public'
      const channel = await Channel.create({ title: safeTitle, availability: availability, creatorId: user.id })
      if (availability === 'private') await Access.create({ userId: user.id, channelId: channel.id })
      await ChannelMember.create({ userId: user.id, channelId: channel.id, status: 'owner' })
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

      // Ak bol ban, zmažeme staré hlasy - používame tvoj názov stĺpcov
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
   * /kick [nickName] - S DATABÁZOVÝM HLASOVANÍM A TVOJIMI STĹPCAMI
   */
  router.post('/kick', async ({ request, response }) => {
    const { userId, channelId, targetNick } = request.all()

    // 1. Overenie vstupov
    if (!targetNick) return response.badRequest({ message: 'Musíš zadať meno (nick).' })

    const channel = await Channel.find(channelId)
    if (!channel) return response.badRequest({ message: 'Chyba: Kanál sa nenašiel.' })

    const targetUser = await User.findBy('nickname', targetNick)
    if (!targetUser) return response.badRequest({ message: `Chyba: Používateľ s nickom '${targetNick}' neexistuje.` })

    // requester = ten kto píše príkaz
    const requester = await ChannelMember.query().where('user_id', userId).where('channel_id', channelId).first()
    if (!requester) return response.badRequest({ message: 'Chyba: Ty nie si členom tohto kanála.' })

    if (targetUser.id === userId) {
      return response.badRequest({ message: 'Nemôžeš vyhodiť sám seba. Použi /cancel.' })
    }

    const targetMember = await ChannelMember.query().where('user_id', targetUser.id).where('channel_id', channelId).first()
    if (!targetMember) {
      return response.badRequest({ message: `Chyba: Používateľ '${targetNick}' nie je v tomto kanáli.` })
    }

    // === 1. ADMIN LOGIKA (Instant Ban = "Akože 3 hlasy") ===
    if (requester.status === 'owner') {
      targetMember.status = 'banned'
      await targetMember.save()

      if (channel.availability === 'private') {
        await Access.query().where('user_id', targetUser.id).where('channel_id', channelId).delete()
      }

      // Vyčistíme DB od hlasov (používame 'target_user_id')
      await KickVote.query().where('channel_id', channelId).where('target_user_id', targetUser.id).delete()

      return { message: `Správca udelil ban používateľovi ${targetNick}.` }
    }

    // === 2. PUBLIC MEMBER LOGIKA (Hlasovanie do DB) ===
    if (channel.availability === 'public') {

      // Skontrolujeme, či už hlasoval (používame 'voter_user_id')
      const existingVote = await KickVote.query()
        .where('channel_id', channelId)
        .where('target_user_id', targetUser.id)
        .where('voter_user_id', userId)
        .first()

      if (existingVote) {
        return response.conflict({ message: 'Už si hlasoval za vyhodenie tohto člena.' })
      }

      // Vytvoríme nový hlas v DB (POZOR NA NÁZVY V TVOJOM MODELI)
      await KickVote.create({
        channelId: channelId,
        targetUserId: targetUser.id,
        voterUserId: userId // Toto je kľúčové podľa tvojho modelu
      })

      // Zrátame všetky hlasy pre tohto targetUsera v tomto kanáli
      const votesCountResult = await KickVote.query()
        .where('channel_id', channelId)
        .where('target_user_id', targetUser.id)
        .count('* as total')

      const totalVotes = Number(votesCountResult[0].$extras.total)

      // Kontrola, či máme dosť hlasov
      if (totalVotes >= 3) {
        targetMember.status = 'banned'
        await targetMember.save()

        // Vyčistíme hlasy, lebo už je zabanovaný
        await KickVote.query().where('channel_id', channelId).where('target_user_id', targetUser.id).delete()

        return { message: `Používateľ ${targetNick} dostal trvalý ban na základe hlasovania (${totalVotes} hlasov).` }
      }

      return { message: `Hlasoval si za kick ${targetNick}. Aktuálne hlasy: ${totalVotes}/3.` }
    }

    return response.badRequest({ message: 'V tomto type kanála nemôžeš kickovať.' })
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

    // Zmažeme hlasy, ktoré user dal iným (voter_user_id)
    await KickVote.query().where('channel_id', channelId).where('voter_user_id', userId).delete()

    // Zmažeme hlasy PROTI nemu (target_user_id)
    await KickVote.query().where('channel_id', channelId).where('target_user_id', userId).delete()

    if (channel.availability === 'private') {
      await Access.query().where('user_id', userId).where('channel_id', channelId).delete()
    }
    return { message: 'Opustil si kanál.', action: 'left' }
  })

}).prefix('/cmd')
