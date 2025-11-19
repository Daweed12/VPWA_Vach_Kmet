// start/routes.ts
import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import User from '#models/user'
import ChannelMember from '#models/channel_member'

/**
 * Root – test
 */
router.get('/', async () => {
  return { hello: 'world' }
})

/**
 * GET /channels
 * - bez userId: všetky PUBLIC
 * - s userId: PUBLIC + PRIVATE, kde má user záznam v access
 */
router.get('/channels', async ({ request }) => {
  const userId = request.input('userId') as number | null

  // 1) ak nie je userId → len PUBLIC
  if (!userId) {
    return await Channel.query()
      .where('availability', 'public')
      .orderBy('title')
  }

  // 2) prihlásený user:
  //    public kanály + private, kde existuje access pre userId
  const channels = await Channel.query()
    .where('availability', 'public')
    .orWhereIn('id', (sub) => {
      sub
        .from('access')              // názov tabuľky
        .select('channel_id')
        .where('user_id', userId)
        .whereNull('deleted_at')
    })
    .orderBy('title')

  return channels
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
