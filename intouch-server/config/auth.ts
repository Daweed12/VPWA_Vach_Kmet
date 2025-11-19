// config/auth.ts
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

const authConfig = defineConfig({
  /**
   * Default guard
   */
  default: 'web',

  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,

      provider: sessionUserProvider({
        // dynamický import User modelu
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig
