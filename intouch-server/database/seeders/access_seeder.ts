import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import Access from '#models/access'

export default class AccessSeeder extends BaseSeeder {
  public async run() {
    const david = await User.findByOrFail('nickname', 'razdvach')
    const kristof = await User.findByOrFail('nickname', 'Franta')
    const vpwa = await Channel.findByOrFail('title', 'VPWA - projekt')

    await Access.createMany([
      { userId: david.id, channelId: vpwa.id },
      { userId: kristof.id, channelId: vpwa.id },
    ])

    console.log('✅ AccessSeeder finished')
  }
}
