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

router.post('/auth/change-password', async ({ request, response }) => {
  const { userId, currentPassword, newPassword } = request.only([
    'userId',
    'currentPassword',
    'newPassword',
  ])

  if (!userId || !currentPassword || !newPassword) {
    return response.badRequest({ message: 'Chýbajú údaje.' })
  }

  // nájdi používateľa
  const user = await User.find(userId)
  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  // over aktuálne heslo (momentálne máš heslá v plain texte)
  if (user.password !== currentPassword) {
    return response.unauthorized({ message: 'Aktuálne heslo je nesprávne.' })
  }

  if (newPassword.length < 6) {
    return response.badRequest({
      message: 'Nové heslo musí mať aspoň 6 znakov.',
    })
  }

  // ulož nové heslo
  user.password = newPassword
  await user.save()

  return {
    message: 'Heslo bolo úspešne zmenené.',
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

// POST /channels/:id/messages – vytvorí správu v kanáli
router.post('/channels/:id/messages', async ({ params, request, response }) => {
  const channelId = Number(params.id)
  const { content, senderId } = request.only(['content', 'senderId'])

  if (!content || !senderId) {
    return response.badRequest({ message: 'Neplatné dáta.' })
  }

  // 1) Nájdeme všetky mentions v texte: @nickname
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const mentions: string[] = []
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  // 2) Typovo správne pole mentionedUsers
  const mentionedUsers: { id: number; nickname: string }[] = []

  if (mentions.length > 0) {
    const users = await User
      .query()
      .whereIn('nickname', mentions)
      .select(['id', 'nickname'])

    mentionedUsers.push(...users.map(u => ({
      id: u.id,
      nickname: u.nickname
    })))
  }

  // 3) Uložíme správu
  const message = await Message.create({
    channelId,
    senderId,
    content,
  })

  await message.load('sender') // načítanie autora správy

  // 4) Výstup pre frontend
  const responseMessage = {
    ...message.serialize(),
    timestamp: message.timestamp.toISO(),
    sender: message.sender,
    mentions: mentionedUsers
  }

  // 5) Broadcast cez socket.io
  const { getIO } = await import('#start/socket')
  const io = getIO()

  if (io) {
    io.to(`channel:${channelId}`).emit('chat:message', responseMessage)
    io.emit('chat:message', responseMessage)
  }

  return responseMessage
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

  // kontrola, či je kanál private a či je inviter owner
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

router.put('/users/:id/photo', async ({ params, request, response }) => {
  const user = await User.find(params.id)

  if (!user) {
    return response.notFound({ message: 'Používateľ neexistuje.' })
  }

  const imageData = request.input('image') as string | null

  if (!imageData) {
    return response.badRequest({ message: 'Chýba obrázok.' })
  }

  // 1. Spracovanie Base64 obrázka
  const match = imageData.match(/^data:(.+);base64,(.+)$/)
  if (!match) {
    return response.badRequest({ message: 'Neplatný formát obrázka.' })
  }

  const mimeType = match[1]
  const base64 = match[2]

  // 2. Zistenie prípony
  let ext = 'png'
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg'
  if (mimeType === 'image/webp') ext = 'webp'

  const buffer = Buffer.from(base64, 'base64')

  // 3. Cesta k priečinku public/avatars
  const uploadDir = app.publicPath('avatars')

  // Vytvoríme priečinok, ak neexistuje
  await fs.mkdir(uploadDir, { recursive: true })

  // 4. Vytvorenie názvu súboru: ID_NICKNAME.pripona
  // (Nickname prečistíme od divných znakov, aby to bol platný názov súboru)
  const safeNickname = user.nickname.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `${user.id}_${safeNickname}.${ext}`

  const filePath = path.join(uploadDir, fileName)

  // 5. Uloženie súboru na disk (prepíše starý ak existuje)
  await fs.writeFile(filePath, buffer)

  // 6. Uloženie cesty do databázy
  const publicPath = `avatars/${fileName}` // Relatívna cesta pre frontend

  user.profilePicture = publicPath
  await user.save()

  return {
    message: 'Foto uložené.',
    profilePicture: publicPath,
  }
})

/**
 * GET /avatars/:filename
 * Toto slúži na zobrazovanie nahraných profiloviek.
 */
router.get('/avatars/:filename', async ({ params, response }) => {
  const filePath = app.publicPath(`avatars/${params.filename}`)
  return response.download(filePath)
})
