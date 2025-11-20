import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import Message from '#models/message'
import Mention from '#models/mention'
import KickVote from '#models/kick_vote'
import ChannelInvite from '#models/channel_invite'

export default class MainSeeder extends BaseSeeder {
  public async run () {
    // 1) USERS
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
        nickname: 'kristof',
        firstname: 'Kristof',
        surname: 'Kmet',
        email: 'kristof@example.com',
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
      kristof,
      lucia,
      anna,
      martin,
      peter,
      jana,
      tomas,
      zuzana,
      filip,
    ] = users

    // 2) CHANNELS – všetky public okrem VPWA a 3 extra private
    const [
      vpwa,
      design,
      random,
      product,
      it,
      secretAlpha,
      secretBeta,
      secretGamma,
    ] = await Channel.createMany([
      {
        title: 'VPWA - projekt',
        availability: 'private',
        creatorId: david.id,
      },
      {
        title: 'WTECH - projekt',
        availability: 'public',
        creatorId: kristof.id,
      },
      {
        title: 'Design',
        availability: 'public',
        creatorId: anna.id,
      },
      {
        title: 'Marketing',
        availability: 'public',
        creatorId: zuzana.id,
      },
      {
        title: 'Sales',
        availability: 'public',
        creatorId: peter.id,
      },
      {
        title: 'Support',
        availability: 'public',
        creatorId: jana.id,
      },
      {
        title: 'Random',
        availability: 'public',
        creatorId: filip.id,
      },
      {
        title: 'CEOs',
        availability: 'public',
        creatorId: zuzana.id,
      },
      {
        title: 'HR',
        availability: 'public',
        creatorId: zuzana.id,
      },
      {
        title: 'Finance',
        availability: 'public',
        creatorId: martin.id,
      },
      {
        title: 'Operations',
        availability: 'public',
        creatorId: tomas.id,
      },
      {
        title: 'Product',
        availability: 'public',
        creatorId: martin.id,
      },
      {
        title: 'Customer Success',
        availability: 'public',
        creatorId: lucia.id,
      },
      {
        title: 'IT',
        availability: 'public',
        creatorId: tomas.id,
      },
      {
        title: 'Legal',
        availability: 'public',
        creatorId: anna.id,
      },
      // nové private kanály pre pozvánky
      {
        title: 'Alpha Squad',
        availability: 'private',
        creatorId: zuzana.id,
      },
      {
        title: 'Beta Experiments',
        availability: 'private',
        creatorId: anna.id,
      },
      {
        title: 'Gamma Secret Ops',
        availability: 'private',
        creatorId: tomas.id,
      },
    ])

    // 3) ACCESS – David + Kristof majú access do VPWA (reálny private channel)
    await Access.createMany([
      { userId: david.id, channelId: vpwa.id },
      { userId: kristof.id, channelId: vpwa.id },
    ])

    // 4) CHANNEL MEMBERS – členovia kanálov
    await ChannelMember.createMany([
      // VPWA (private) – len David + Kristof
      { userId: david.id, channelId: vpwa.id, status: 'owner' },
      { userId: kristof.id, channelId: vpwa.id, status: 'member' },

      // pár ukážkových členstiev do public kanálov
      { userId: david.id, channelId: it.id, status: 'member' },
      { userId: david.id, channelId: product.id, status: 'member' },
      { userId: lucia.id, channelId: design.id, status: 'member' },
      { userId: anna.id, channelId: design.id, status: 'member' },
    ])

    // 5) CHANNEL INVITES
    // user 1 (David) – pending do všetkých troch nových private kanálov
    // user 2 (Kristof) – pending iba do Alpha Squad, iné pending nemá
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

    // 6) MESSAGES – demo správy
    const [m2, m3] = await Message.createMany([
      {
        senderId: david.id,
        channelId: vpwa.id,
        content: 'Vitajte v kanáli VPWA - projekt 👋',
      },
      {
        senderId: kristof.id,
        channelId: vpwa.id,
        content: '@david skontroluj prosím posledný commit.',
      },
      {
        senderId: lucia.id,
        channelId: design.id,
        content: 'Mám nový prototyp v Figma, mrknite.',
      },
      {
        senderId: martin.id,
        channelId: it.id,
        content: 'Nasadil som novú verziu backendu ✅',
      },
      {
        senderId: filip.id,
        channelId: random.id,
        content: 'Kto ide na kávu? ☕',
      },
    ])

    // 7) MENTIONS
    await Mention.createMany([
      { messageId: m2.id, userId: kristof.id },
      { messageId: m3.id, userId: david.id },
    ])

    // 8) KICK VOTES – len príklad
    await KickVote.createMany([
      {
        channelId: random.id,
        targetUserId: filip.id,
        voterUserId: david.id,
      },
      {
        channelId: random.id,
        targetUserId: filip.id,
        voterUserId: kristof.id,
      },
    ])

    console.log('✅ MainSeeder finished – users, channels, access, invites, members, messages.')
  }
}
