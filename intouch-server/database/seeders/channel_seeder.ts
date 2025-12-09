import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'

export default class ChannelSeeder extends BaseSeeder {
  public async run() {
    const david = await User.findByOrFail('email', 'david@example.com')
    const kristof = await User.findByOrFail('email', 'kristof@example.com')
    //const lucia = await User.findByOrFail('nickname', 'lucia')
    const anna = await User.findByOrFail('nickname', 'anna')
    const martin = await User.findByOrFail('nickname', 'martin')
    const peter = await User.findByOrFail('nickname', 'peter')
    const jana = await User.findByOrFail('nickname', 'jana')
    const tomas = await User.findByOrFail('nickname', 'tomas')
    const zuzana = await User.findByOrFail('nickname', 'zuzana')

    await Channel.createMany([
      {
        title: 'VPWA - projekt',
        availability: 'private',
        creatorId: david.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'CEOs',
        availability: 'public',
        creatorId: peter.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'Customer Success',
        availability: 'public',
        creatorId: kristof.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'Design',
        availability: 'public',
        creatorId: anna.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'Finance',
        availability: 'public',
        creatorId: martin.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'HR',
        availability: 'public',
        creatorId: jana.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'Alpha Squad',
        availability: 'private',
        creatorId: zuzana.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'Beta Experiments',
        availability: 'private',
        creatorId: anna.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
      {
        title: 'Gamma Secret Ops',
        availability: 'private',
        creatorId: tomas.id,
        imagePath: '../public/channels/default_channel_logo.png',
      },
    ])

    console.log('✅ ChannelSeeder finished')
  }
}
