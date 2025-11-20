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
        surname: 'Finance',
        email: 'martin@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: false,
        password: 'password123',
      },
      {
        nickname: 'peter',
        firstname: 'Peter',
        surname: 'CEO',
        email: 'peter@example.com',
        profilePicture: null,
        status: 'online',
        notifyOnMentionOnly: true,
        password: 'password123',
      },
      {
        nickname: 'jana',
        firstname: 'Jana',
        surname: 'HR',
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

    // 2) CHANNELS
    //  - 1 private projektový (VPWA)
    //  - 5 public kanálov s plnou konverzáciou
    //  - 3 private secret kanály pre invites
    const [
      vpwa,
      ceos,
      customerSuccess,
      design,
      finance,
      hr,
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
        title: 'CEOs',
        availability: 'public',
        creatorId: peter.id,
      },
      {
        title: 'Customer Success',
        availability: 'public',
        creatorId: kristof.id,
      },
      {
        title: 'Design',
        availability: 'public',
        creatorId: anna.id,
      },
      {
        title: 'Finance',
        availability: 'public',
        creatorId: martin.id,
      },
      {
        title: 'HR',
        availability: 'public',
        creatorId: jana.id,
      },
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

    // 3) ACCESS – David + Kristof majú access do VPWA (private)
    await Access.createMany([
      { userId: david.id, channelId: vpwa.id },
      { userId: kristof.id, channelId: vpwa.id },
    ])

    // 4) CHANNEL MEMBERS – členovia kanálov
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

      // HR
      { userId: jana.id, channelId: hr.id, status: 'owner' },
      { userId: martin.id, channelId: hr.id, status: 'member' },
      { userId: tomas.id, channelId: hr.id, status: 'member' },
    ])

    // 5) CHANNEL INVITES – 3 private kanály
    // David: pending do všetkých troch
    // Kristof: pending iba do Alpha Squad
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

    // 6) MESSAGES – plnohodnotné konverzácie v 5 kanáloch

    // 6) MESSAGES – plnohodnotné konverzácie vo všetkých kanáloch (min. 30 správ)

    const buildMessages = (
      channel: { id: number },
      senders: { id: number }[],
      baseTexts: string[],
      label: string
    ) => {
      const out: { senderId: number; channelId: number; content: string }[] = []
      const total = 30

      for (let i = 0; i < total; i++) {
        const baseText =
          baseTexts[i] ?? `${label} – seed správa ${i + 1}.`
        const sender = senders[i % senders.length]

        out.push({
          senderId: sender.id,
          channelId: channel.id,
          content: baseText,
        })
      }

      return out
    }

    const ceosMessages = buildMessages(
      ceos,
      [peter, zuzana, david, kristof],
      [
        'Dobré ráno, dnes o 10:00 máme CEOs standup.',
        '@david priprav prosím krátky update k VPWA.',
        'Jasné, mám hotový prototyp a základ backendu.',
        'Super, chcem vidieť demo ešte tento týždeň.',
        'Za mňa dobré, vieme ukázať aj reálne správy v kanáloch. 😉',
        'Cieľ: nech sa tím cíti ako v Slacku, ale je to naše riešenie.',
        'Perfektné, ďakujem všetkým. 💡',
        'Pripravím aj krátku prezentáciu architektúry.',
      ],
      '#CEOs'
    )

    const customerSuccessMessages = buildMessages(
      customerSuccess,
      [kristof, jana, zuzana, david],
      [
        'Máme nový ticket od klienta ohľadom notifikácií na @mention.',
        'Klient chce dostávať e-mail len pri označení v správe.',
        'Implementujem prepínač „notifyOnMentionOnly“ do profilu.',
        'Super, odpíšem klientovi, že feature bude nasadená zajtra.',
        'Backend to už podporuje, stačí uložiť flag pre usera.',
        'Ďakujem, tím CS ❤️ vývoj.',
      ],
      '#Customer Success'
    )

    const designMessages = buildMessages(
      design,
      [lucia, anna, david, kristof],
      [
        'Pridala som nový layout pre sidebar podľa Figma návrhu.',
        'Animácie pri hoveri by mali byť jemnejšie.',
        'Skúsme zjednotiť oranžové odtiene naprieč aplikáciou.',
        'Do kanála #VPWA som dala exportované PNGčka.',
        'Za mňa je UI ready na prvý usability test.',
      ],
      '#Design'
    )

    const financeMessages = buildMessages(
      finance,
      [martin, david, peter],
      [
        'Potrebujem odhad času na dokončenie VPWA pre budget.',
        'Náklady na hosting budú približne rovnaké ako pri Slacksandboxe.',
        'Ak stihneme MVP do konca mesiaca, vieme to ukázať vedeniu.',
        'Pripravil som jednoduchý report pre projekt VPWA.',
      ],
      '#Finance'
    )

    const hrMessages = buildMessages(
      hr,
      [jana, kristof, david],
      [
        'Pripomínam, že zajtra máme teambuilding.',
        'Rozmýšľame, že VPWA použijeme aj na internú komunikáciu.',
        'Prosím, doplňte si fotky do profilov, nech to vyzerá živo.',
      ],
      '#HR'
    )

    const vpwaMessages = buildMessages(
      vpwa,
      [david, kristof, lucia, anna, tomas, filip],
      [
        'Stiahol som posledné zmeny z GitHubu, idem mergeovať.',
        'Potrebujeme ešte prepojiť Adonis a Quasar pre messages.',
        'Seedery už obsahujú reálne konverzácie pre každý kanál.',
        'Zajtra mám stretnutie so školiteľom, ukážem mu VPWA.',
      ],
      '#VPWA - projekt'
    )

    const alphaMessages = buildMessages(
      secretAlpha,
      [david, kristof, zuzana],
      [
        'Tento kanál je len pre Alpha Squad.',
        'Testujeme tu experimentálne features pred nasadením.',
      ],
      '#Alpha Squad'
    )

    const betaMessages = buildMessages(
      secretBeta,
      [anna, tomas, filip],
      [
        'Tu riešime všetky Beta Experiments.',
        'Ak niečo spadne, prosím logy do tohto kanála.',
      ],
      '#Beta Experiments'
    )

    const gammaMessages = buildMessages(
      secretGamma,
      [tomas, martin, david],
      [
        'Gamma Secret Ops je len pre infra veci.',
        'Dnes nasadzujeme novú verziu backendu.',
      ],
      '#Gamma Secret Ops'
    )

    const createdMessages = await Message.createMany([
      ...ceosMessages,
      ...customerSuccessMessages,
      ...designMessages,
      ...financeMessages,
      ...hrMessages,
      ...vpwaMessages,
      ...alphaMessages,
      ...betaMessages,
      ...gammaMessages,
    ])

    // 7) MENTIONS – pár príkladov
    const [
      mCeos2,
      mCs1,

      mDesign4,

      mHr1,

    ] = createdMessages

    await Mention.createMany([
      // CEOs
      { messageId: mCeos2.id, userId: david.id },
      // Customer Success
      { messageId: mCs1.id, userId: david.id },
      // Design
      { messageId: mDesign4.id, userId: lucia.id },
      // HR
      { messageId: mHr1.id, userId: filip.id },
    ])

    // 8) KICK VOTES – príklad hlasovania
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

    console.log('✅ MainSeeder finished – users, channels, access, invites, members, messages.')
  }
}
