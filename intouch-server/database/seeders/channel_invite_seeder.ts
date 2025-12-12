import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import ChannelInvite from '#models/channel_invite'

export default class ChannelInviteSeeder extends BaseSeeder {
  public async run() {
    const david = await User.findByOrFail('email', 'david@example.com')
    const kristof = await User.findByOrFail('email', 'kristof@example.com')
    const zuzana = await User.findByOrFail('nickname', 'zuzana')
    const anna = await User.findByOrFail('nickname', 'anna')

    const secretAlpha = await Channel.findByOrFail('title', 'Alpha Squad')
    const secretBeta = await Channel.findByOrFail('title', 'Beta Experiments')
    const secretGamma = await Channel.findByOrFail('title', 'Gamma Secret Ops')

    await ChannelInvite.createMany([
      // David -> všetky 3
      {
        channelId: secretAlpha.id,
        userId: david.id,
        inviterId: kristof.id,
        status: 'pending',
      },
      {
        channelId: secretBeta.id,
        userId: david.id,
        inviterId: zuzana.id,
        status: 'pending',
      },
      {
        channelId: secretGamma.id,
        userId: david.id,
        inviterId: anna.id,
        status: 'pending',
      },
      // Kristof -> len Alpha Squad
      {
        channelId: secretAlpha.id,
        userId: kristof.id,
        inviterId: david.id,
        status: 'pending',
      },
    ])

    console.log('ChannelInviteSeeder finished')
  }
}
