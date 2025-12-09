import { BaseSeeder } from '@adonisjs/lucid/seeders'

import UserSeeder from '#database/seeders/user_seeder'
import ChannelSeeder from '#database/seeders/channel_seeder'
import AccessSeeder from '#database/seeders/access_seeder'
import ChannelMemberSeeder from '#database/seeders/channel_member_seeder'
import ChannelInviteSeeder from '#database/seeders/channel_invite_seeder'
import MessageSeeder from '#database/seeders/message_seeder'
import KickVoteSeeder from '#database/seeders/kick_vote_seeder'

export default class MainSeeder extends BaseSeeder {
  public async run() {
    await new UserSeeder(this.client).run()
    await new ChannelSeeder(this.client).run()
    await new AccessSeeder(this.client).run()
    await new ChannelMemberSeeder(this.client).run()
    await new ChannelInviteSeeder(this.client).run()
    await new MessageSeeder(this.client).run()
    await new KickVoteSeeder(this.client).run()
    console.log('✅ MainSeeder finished – all sub-seeders executed.')
  }
}
