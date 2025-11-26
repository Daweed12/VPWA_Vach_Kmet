import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import KickVote from '#models/kick_vote'

export default class KickVoteSeeder extends BaseSeeder {
  public async run () {
    const david = await User.findByOrFail('email', 'david@example.com')
    const kristof = await User.findByOrFail('email', 'kristof@example.com')
    const filip = await User.findByOrFail('nickname', 'filip')

    const ceos = await Channel.findByOrFail('title', 'CEOs')

    await KickVote.createMany([
      {
        channelId: ceos.id,
        targetUserId: filip.id,
        voterUserId: david.id,
      },
      {
        channelId: ceos.id,
        targetUserId: filip.id,
        voterUserId: kristof.id,
      },
    ])

    console.log('✅ KickVoteSeeder finished')
  }
}
