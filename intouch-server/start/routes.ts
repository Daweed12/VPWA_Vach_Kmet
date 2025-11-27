// start/routes.ts
import router from '@adonisjs/core/services/router'

/**
 * Root – test
 */
router.get('/', async () => {
  return { hello: 'world' }
})

// Import all route modules
import './routes/channels.js'
import './routes/messages.js'
import './routes/users.js'
import './routes/invites.js'
import './routes/auth.js'
import './routes/cmd.js'
