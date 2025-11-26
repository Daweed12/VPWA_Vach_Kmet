import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'

export default class ChannelMemberSeeder extends BaseSeeder {
  public async run () {
    // pôvodní používatelia
    const david = await User.findByOrFail('email', 'david@example.com')
    const kristof = await User.findByOrFail('email', 'kristof@example.com')
    const lucia = await User.findByOrFail('nickname', 'lucia')
    const anna = await User.findByOrFail('nickname', 'anna')
    const martin = await User.findByOrFail('nickname', 'martin')
    const peter = await User.findByOrFail('nickname', 'peter')
    const jana = await User.findByOrFail('nickname', 'jana')
    const tomas = await User.findByOrFail('nickname', 'tomas')
    const zuzana = await User.findByOrFail('nickname', 'zuzana')
    const filip = await User.findByOrFail('nickname', 'filip')

    // NOVÍ používatelia z UserSeederu
    const vera = await User.findByOrFail('nickname', 'vera')
    const igor = await User.findByOrFail('nickname', 'igor')
    const maria = await User.findByOrFail('nickname', 'maria')
    const pavol = await User.findByOrFail('nickname', 'pavol')
    const andrej = await User.findByOrFail('nickname', 'andrej')
    const lenka = await User.findByOrFail('nickname', 'lenka')
    const roman = await User.findByOrFail('nickname', 'roman')
    const katka = await User.findByOrFail('nickname', 'katka')
    const juraj = await User.findByOrFail('nickname', 'juraj')
    const barbora = await User.findByOrFail('nickname', 'barbora')
    const dusan = await User.findByOrFail('nickname', 'dusan')
    const sofia = await User.findByOrFail('nickname', 'sofia')
    const lukas = await User.findByOrFail('nickname', 'lukas')
    const monika = await User.findByOrFail('nickname', 'monika')
    const tibor = await User.findByOrFail('nickname', 'tibor')
    const silvia = await User.findByOrFail('nickname', 'silvia')
    const michal = await User.findByOrFail('nickname', 'michal')
    const natasa = await User.findByOrFail('nickname', 'natasa')
    const stefan = await User.findByOrFail('nickname', 'stefan')
    const renata = await User.findByOrFail('nickname', 'renata')
    const ondrej = await User.findByOrFail('nickname', 'ondrej')
    const eva = await User.findByOrFail('nickname', 'eva')
    const patrik = await User.findByOrFail('nickname', 'patrik')

    const vpwa = await Channel.findByOrFail('title', 'VPWA - projekt')
    const ceos = await Channel.findByOrFail('title', 'CEOs')
    const customerSuccess = await Channel.findByOrFail('title', 'Customer Success')
    const design = await Channel.findByOrFail('title', 'Design')
    const finance = await Channel.findByOrFail('title', 'Finance')
    const hr = await Channel.findByOrFail('title', 'HR')

    await ChannelMember.createMany([
      // VPWA
      { userId: david.id, channelId: vpwa.id, status: 'owner' },
      { userId: kristof.id, channelId: vpwa.id, status: 'member' },

      // CEOs – top vedenie
      { userId: peter.id, channelId: ceos.id, status: 'owner' },
      { userId: zuzana.id, channelId: ceos.id, status: 'member' },
      { userId: david.id, channelId: ceos.id, status: 'member' },

      // Customer Success
      { userId: kristof.id, channelId: customerSuccess.id, status: 'owner' },
      { userId: jana.id, channelId: customerSuccess.id, status: 'member' },
      { userId: filip.id, channelId: customerSuccess.id, status: 'member' },

      // Design
      { userId: anna.id, channelId: design.id, status: 'owner' },
      { userId: lucia.id, channelId: design.id, status: 'member' },
      { userId: david.id, channelId: design.id, status: 'member' },

      // Finance
      { userId: martin.id, channelId: finance.id, status: 'owner' },
      { userId: zuzana.id, channelId: finance.id, status: 'member' },
      { userId: david.id, channelId: finance.id, status: 'member' },

      // HR – pôvodné
      { userId: jana.id, channelId: hr.id, status: 'owner' },
      { userId: martin.id, channelId: hr.id, status: 'member' },
      { userId: tomas.id, channelId: hr.id, status: 'member' },

      // HR – všetci ostatní users ako "member"
      { userId: david.id, channelId: hr.id, status: 'member' },
      { userId: kristof.id, channelId: hr.id, status: 'member' },
      { userId: lucia.id, channelId: hr.id, status: 'member' },
      { userId: anna.id, channelId: hr.id, status: 'member' },
      { userId: peter.id, channelId: hr.id, status: 'member' },
      { userId: zuzana.id, channelId: hr.id, status: 'member' },
      { userId: filip.id, channelId: hr.id, status: 'member' },

      { userId: vera.id, channelId: hr.id, status: 'member' },
      { userId: igor.id, channelId: hr.id, status: 'member' },
      { userId: maria.id, channelId: hr.id, status: 'member' },
      { userId: pavol.id, channelId: hr.id, status: 'member' },
      { userId: andrej.id, channelId: hr.id, status: 'member' },
      { userId: lenka.id, channelId: hr.id, status: 'member' },
      { userId: roman.id, channelId: hr.id, status: 'member' },
      { userId: katka.id, channelId: hr.id, status: 'member' },
      { userId: juraj.id, channelId: hr.id, status: 'member' },
      { userId: barbora.id, channelId: hr.id, status: 'member' },
      { userId: dusan.id, channelId: hr.id, status: 'member' },
      { userId: sofia.id, channelId: hr.id, status: 'member' },
      { userId: lukas.id, channelId: hr.id, status: 'member' },
      { userId: monika.id, channelId: hr.id, status: 'member' },
      { userId: tibor.id, channelId: hr.id, status: 'member' },
      { userId: silvia.id, channelId: hr.id, status: 'member' },
      { userId: michal.id, channelId: hr.id, status: 'member' },
      { userId: natasa.id, channelId: hr.id, status: 'member' },
      { userId: stefan.id, channelId: hr.id, status: 'member' },
      { userId: renata.id, channelId: hr.id, status: 'member' },
      { userId: ondrej.id, channelId: hr.id, status: 'member' },
      { userId: eva.id, channelId: hr.id, status: 'member' },
      { userId: patrik.id, channelId: hr.id, status: 'member' },
    ])

    console.log('✅ ChannelMemberSeeder finished')
  }
}
