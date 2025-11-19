import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import User from '#models/user'

router.get('/', async () => {
  return { hello: 'world' }
})

router.get('/channels', async () => {
  const channels = await Channel.all()
  return channels
})

// LOGIN – používateľ z databázy podľa username (nickname alebo email)
router.post('/login', async ({ request, response }) => {
  const { username, password } = request.only(['username', 'password'])

  const user = await User
    .query()
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
    status: user.status,
  }
})
