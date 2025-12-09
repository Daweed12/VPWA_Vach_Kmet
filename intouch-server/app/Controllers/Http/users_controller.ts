import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
// 1. PRIDAJ TENTO IMPORT (Cesta môže byť '#models/user' alebo 'App/Models/User' podľa nastavenia)
import User from '#models/user'

export default class UsersController {
  public async uploadAvatar({ request, auth, response }: HttpContext) {
    const avatarImage = request.file('avatar', {
      size: '2mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp'],
    })

    if (!avatarImage) {
      return response.badRequest({ message: 'Prosím, nahrajte obrázok.' })
    }

    if (avatarImage.hasErrors) {
      return response.badRequest(avatarImage.errors)
    }

    // 2. OPRAVA: Pretypuj auth.user na User
    // TypeScript teraz bude vedieť, že 'user' má 'id', 'nickname' atď.
    const user = auth.user as User

    if (!user) {
      return response.unauthorized({ message: 'Nie ste prihlásený.' })
    }

    // Teraz už chyby zmiznú
    const safeNickname = user.nickname.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const fileName = `${user.id}_${safeNickname}.${avatarImage.extname}`

    await avatarImage.move(app.publicPath('avatars'), {
      name: fileName,
      overwrite: true,
    })

    const filePath = `/avatars/${fileName}`

    user.profilePicture = filePath
    await user.save()

    return user
  }
}
