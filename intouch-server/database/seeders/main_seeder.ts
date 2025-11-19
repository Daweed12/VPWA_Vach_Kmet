import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Message from '#models/message'
import Mention from '#models/mention'
import KickVote from '#models/kick_vote'

export default class MainSeeder extends BaseSeeder {
  public async run () {
    // 1) USERS – 10 používateľov
    const users = await User.createMany([
      {
        nickname: 'david',
        firstname: 'David',
        surname: 'Vach',
        email: 'david@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
      {
        nickname: 'kmet',
        firstname: 'Kmet',
        surname: 'Kolega',
        email: 'kmet@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: true,
        password: 'password123',
      },
      {
        nickname: 'lucia',
        firstname: 'Lucia',
        surname: 'Testerka',
        email: 'lucia@example.com',
        profilePicture: null,
        status: 'away',
        notifyOnMentionOnly: true,
        password: 'password123',
      },
      {
        nickname: 'anna',
        firstname: 'Anna',
        surname: 'Designer',
        email: 'anna@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
      {
        nickname: 'martin',
        firstname: 'Martin',
        surname: 'Backend',
        email: 'martin@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
      {
        nickname: 'peter',
        firstname: 'Peter',
        surname: 'Frontend',
        email: 'peter@example.com',
        profilePicture: null,
        status: 'offline',
        notifyOnMentionOnly: true,
        password: 'password123',
      },
      {
        nickname: 'jana',
        firstname: 'Jana',
        surname: 'QA',
        email: 'jana@example.com',
        profilePicture: null,
        status: 'away',
        notifyOnMentionOnly: true,
        password: 'password123',
      },
      {
        nickname: 'tomas',
        firstname: 'Tomáš',
        surname: 'DevOps',
        email: 'tomas@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
      {
        nickname: 'zuzana',
        firstname: 'Zuzana',
        surname: 'PM',
        email: 'zuzana@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
      {
        nickname: 'filip',
        firstname: 'Filip',
        surname: 'Intern',
        email: 'filip@example.com',
        profilePicture: null,
        status: 'offline',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
    ])

    const [
      david,
      kmet,
      lucia,
      anna,
      martin,
      peter,
      jana,
      tomas,
      zuzana,
      filip,
    ] = users

    // 2) CHANNELS – 15 kanálov
    const [
      vpwaProjekt,
      wtechProjekt,
      design,
      marketing,
      sales,
      support,
      random,
      ceos,
      hr,
      finance,
      operations,
      product,
      customerSuccess,
      it,
      legal,
    ] = await Channel.createMany([
      {
        title: 'VPWA - projekt',
        availability: 'private', // jediný private
        creatorId: david.id,
      },
      {
        title: 'WTECH - projekt',
        availability: 'public',
        creatorId: kmet.id,
      },
      {
        title: 'Design',
        availability: 'public',
        creatorId: lucia.id,
      },
      {
        title: 'Marketing',
        availability: 'public',
        creatorId: zuzana.id,
      },
      {
        title: 'Sales',
        availability: 'public',
        creatorId: kmet.id,
      },
      {
        title: 'Support',
        availability: 'public',
        creatorId: anna.id,
      },
      {
        title: 'Random',
        availability: 'public',
        creatorId: david.id,
      },
      {
        title: 'CEOs',
        availability: 'public',
        creatorId: zuzana.id,
      },
      {
        title: 'HR',
        availability: 'public',
        creatorId: jana.id,
      },
      {
        title: 'Finance',
        availability: 'public',
        creatorId: tomas.id,
      },
      {
        title: 'Operations',
        availability: 'public',
        creatorId: martin.id,
      },
      {
        title: 'Product',
        availability: 'public',
        creatorId: david.id,
      },
      {
        title: 'Customer Success',
        availability: 'public',
        creatorId: kmet.id,
      },
      {
        title: 'IT',
        availability: 'public',
        creatorId: martin.id,
      },
      {
        title: 'Legal',
        availability: 'public',
        creatorId: peter.id,
      },
    ])

    // 3) CHANNEL MEMBERS
    await ChannelMember.createMany([
      // VPWA - projekt (private)
      { userId: david.id, channelId: vpwaProjekt.id, status: 'owner' },
      { userId: kmet.id, channelId: vpwaProjekt.id, status: 'member' },
      { userId: lucia.id, channelId: vpwaProjekt.id, status: 'member' },
      { userId: anna.id, channelId: vpwaProjekt.id, status: 'member' },

      // WTECH - projekt
      { userId: kmet.id, channelId: wtechProjekt.id, status: 'owner' },
      { userId: david.id, channelId: wtechProjekt.id, status: 'member' },
      { userId: filip.id, channelId: wtechProjekt.id, status: 'member' },

      // Design
      { userId: lucia.id, channelId: design.id, status: 'owner' },
      { userId: anna.id, channelId: design.id, status: 'member' },
      { userId: zuzana.id, channelId: design.id, status: 'member' },

      // Marketing
      { userId: zuzana.id, channelId: marketing.id, status: 'owner' },
      { userId: david.id, channelId: marketing.id, status: 'member' },
      { userId: peter.id, channelId: marketing.id, status: 'member' },

      // Sales
      { userId: kmet.id, channelId: sales.id, status: 'owner' },
      { userId: filip.id, channelId: sales.id, status: 'member' },

      // Support
      { userId: anna.id, channelId: support.id, status: 'owner' },
      { userId: jana.id, channelId: support.id, status: 'member' },

      // Random
      { userId: david.id, channelId: random.id, status: 'owner' },
      { userId: kmet.id, channelId: random.id, status: 'member' },
      { userId: filip.id, channelId: random.id, status: 'member' },

      // CEOs
      { userId: zuzana.id, channelId: ceos.id, status: 'owner' },
      { userId: david.id, channelId: ceos.id, status: 'member' },

      // HR
      { userId: jana.id, channelId: hr.id, status: 'owner' },
      { userId: lucia.id, channelId: hr.id, status: 'member' },

      // Finance
      { userId: tomas.id, channelId: finance.id, status: 'owner' },
      { userId: martin.id, channelId: finance.id, status: 'member' },

      // Operations
      { userId: martin.id, channelId: operations.id, status: 'owner' },
      { userId: tomas.id, channelId: operations.id, status: 'member' },

      // Product
      { userId: david.id, channelId: product.id, status: 'owner' },
      { userId: zuzana.id, channelId: product.id, status: 'member' },

      // Customer Success
      { userId: kmet.id, channelId: customerSuccess.id, status: 'owner' },
      { userId: jana.id, channelId: customerSuccess.id, status: 'member' },

      // IT
      { userId: martin.id, channelId: it.id, status: 'owner' },
      { userId: peter.id, channelId: it.id, status: 'member' },

      // Legal
      { userId: peter.id, channelId: legal.id, status: 'owner' },
      { userId: zuzana.id, channelId: legal.id, status: 'member' },
    ])

    // 4) MESSAGES – pár ukážkových
    const [m2, m3] = await Message.createMany([
      {
        senderId: david.id,
        channelId: vpwaProjekt.id,
        content: 'Vitajte v kanáli "VPWA - projekt" 👋',
      },
      {
        senderId: kmet.id,
        channelId: wtechProjekt.id,
        content: 'WTECH tím, dnes o 17:00 sync call?',
      },
      {
        senderId: lucia.id,
        channelId: design.id,
        content: '@anna prosím pozri nový prototyp vo Figme.',
      },
      {
        senderId: martin.id,
        channelId: it.id,
        content: 'Deploy novej API verzie prebehol OK ✅',
      },
      {
        senderId: filip.id,
        channelId: random.id,
        content: 'Kto ide na kávu? ☕',
      },
    ])

    // 5) MENTIONS
    await Mention.createMany([
      { messageId: m2.id, userId: zuzana.id },
      { messageId: m3.id, userId: anna.id },
    ])

    // 6) KICK VOTES – príklad (Random kanál, chcú vyhodiť Filipa)
    await KickVote.createMany([
      {
        channelId: random.id,
        targetUserId: filip.id,
        voterUserId: david.id,
      },
      {
        channelId: random.id,
        targetUserId: filip.id,
        voterUserId: kmet.id,
      },
    ])

    console.log('✅ MainSeeder finished – 10 users & 15 channels inserted.')
  }
}
