import router from '@adonisjs/core/services/router'
import User from '#models/user'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'

/**
 * POST /login
 */
router.post('/login', async ({ request, response }) => {
  const { username, password } = request.only(['username', 'password'])

  const user = await User.query().where('nickname', username).orWhere('email', username).first()

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

  if (!firstName || firstName.length < 3 || firstName.length > 12) {
    return response.badRequest({ message: 'Meno musí mať 3 až 12 znakov.' })
  }

  if (!lastName || lastName.length < 3 || lastName.length > 12) {
    return response.badRequest({ message: 'Priezvisko musí mať 3 až 12 znakov.' })
  }

  if (!nickname || nickname.length < 3 || nickname.length > 12) {
    return response.badRequest({ message: 'Nickname musí mať 3 až 12 znakov.' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return response.badRequest({ message: 'Zadajte platný e-mail.' })
  }

  if (!password || password.length < 8) {
    return response.badRequest({ message: 'Heslo musí mať aspoň 8 znakov.' })
  }

  if (!/[A-Z]/.test(password)) {
    return response.badRequest({ message: 'Heslo musí obsahovať aspoň jedno veľké písmeno.' })
  }

  if (!/[0-9]/.test(password)) {
    return response.badRequest({ message: 'Heslo musí obsahovať aspoň jedno číslo.' })
  }

  const user = await User.create({
    nickname,
    firstname: firstName,
    surname: lastName,
    email,
    profilePicture: null,
    status: 'normal',
    connection: 'online',
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
      })
    )
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
 * POST /auth/change-password
 */
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
