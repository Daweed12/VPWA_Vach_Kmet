import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import Access from '#models/access'
import ChannelInvite from '#models/channel_invite'
import KickVote from '#models/kick_vote'
import Message from '#models/message'
import { DateTime } from 'luxon'
import { getIO } from '../socket.js'

router
  .group(() => {
    /**
     * POST /cmd/join
     */
    router.post('/join', async ({ request, response }) => {
      const { userId, channelName, type } = request.all()
      const safeTitle = channelName?.trim()
      if (!userId || !safeTitle) return response.badRequest({ message: 'Chýbajú údaje.' })

      const user = await User.find(userId)
      if (!user) return response.notFound({ message: 'User nenájdený.' })

      const existingChannel = await Channel.findBy('title', safeTitle)

      if (existingChannel) {
        const thirtyDaysAgo = DateTime.now().minus({ days: 30 })
        const lastMessageDate = existingChannel.lastMessageAt || existingChannel.createdAt
        const isInactive = lastMessageDate < thirtyDaysAgo

        if (isInactive) {
          await existingChannel.delete()
        } else {
          if (existingChannel.availability === 'private') {
            const hasAccess = await Access.query()
              .where('user_id', userId)
              .where('channel_id', existingChannel.id)
              .first()
            if (!hasAccess)
              return response.forbidden({
                message: `Kanál '${safeTitle}' je súkromný. Musíš byť pozvaný.`,
              })
          }
          const existingMember = await ChannelMember.query()
            .where('user_id', userId)
            .where('channel_id', existingChannel.id)
            .first()
          if (existingMember && existingMember.status === 'banned')
            return response.forbidden({ message: 'Máš ban v tomto kanáli.' })

          const member = await ChannelMember.firstOrCreate(
            { userId: user.id, channelId: existingChannel.id },
            { status: 'member' }
          )

          const io = getIO()
          if (io) {
            io.emit('channel:joined', {
              channelId: existingChannel.id,
              userId: user.id,
              channel: {
                id: existingChannel.id,
                title: existingChannel.title,
                availability: existingChannel.availability,
                creatorId: existingChannel.creatorId,
                createdAt: existingChannel.createdAt.toISO(),
              },
            })
            console.log(
              `Sent channel:joined event (via /join) for user ${user.id}, channel ${existingChannel.id}`
            )
          }

          return { message: `Pripojený do kanála #${safeTitle}`, channel: existingChannel }
        }
      }

      {
        const availability = type === 'private' ? 'private' : 'public'
        const channel = await Channel.create({
          title: safeTitle,
          availability: availability,
          creatorId: user.id,
        })

        if (availability === 'private') {
          await Access.create({ userId: user.id, channelId: channel.id })
        }

        await ChannelMember.create({ userId: user.id, channelId: channel.id, status: 'owner' })

        const io = getIO()
        if (io) {
          io.emit('channel:created', {
            id: channel.id,
            title: channel.title,
            availability: channel.availability,
            creatorId: channel.creatorId,
            createdAt: channel.createdAt.toISO(),
            userId: user.id,
          })
          console.log(
            `Sent channel:created event (via /join) for channel ${channel.id} to creator ${user.id}`
          )
        }

        return { message: `Kanál #${safeTitle} (${availability}) bol vytvorený.`, channel }
      }
    })

    /**
     * POST /cmd/invite
     */
    router.post('/invite', async ({ request, response }) => {
      const { userId, channelId, targetNick } = request.all()
      const channel = await Channel.find(channelId)
      const targetUser = await User.findBy('nickname', targetNick)
      const requesterMember = await ChannelMember.query()
        .where('user_id', userId)
        .where('channel_id', channelId)
        .first()

      if (!channel || !targetUser || !requesterMember)
        return response.badRequest({ message: 'Kanál alebo používateľ neexistuje.' })

      // Pre private kanály môže pozývať len owner
      if (channel.availability === 'private') {
        if (requesterMember.status !== 'owner')
          return response.forbidden({ message: 'Do súkromného kanála môže pozývať len správca.' })
      }

      // Skontrolovať, či používateľ už nie je členom
      const targetMember = await ChannelMember.query()
        .where('user_id', targetUser.id)
        .where('channel_id', channelId)
        .first()

      if (targetMember) {
        if (targetMember.status === 'banned') {
          if (requesterMember.status === 'owner') {
            targetMember.status = 'member'
            await targetMember.save()
            await KickVote.query()
              .where('channel_id', channel.id)
              .where('target_user_id', targetUser.id)
              .delete()

            return { message: `Ban pre ${targetNick} bol zrušený správcom.` }
          } else {
            return response.forbidden({
              message: 'Tento používateľ má ban. Len správca ho môže obnoviť.',
            })
          }
        }
        return { message: `${targetNick} už je členom kanála.` }
      }

      // Skontrolovať, či už existuje pending pozvánka
      const existingInvite = await ChannelInvite.query()
        .where('user_id', targetUser.id)
        .where('channel_id', channelId)
        .where('status', 'pending')
        .first()

      if (existingInvite) {
        return response.conflict({ message: 'Používateľ už má pending pozvánku.' })
      }

      // Vytvoriť pozvánku
      const invite = await ChannelInvite.create({
        channelId: channel.id,
        userId: targetUser.id,
        inviterId: userId,
        status: 'pending',
      })

      const io = getIO()
      if (io) {
        io.emit('invite:created', {
          id: invite.id,
          channelId: invite.channelId,
          title: channel.title,
          availability: channel.availability,
          createdAt: invite.createdAt.toISO(),
          userId: invite.userId,
        })
        console.log(
          `Sent invite:created event for user ${invite.userId}, channel ${invite.channelId}`
        )
      }

      return { message: `Pozvánka pre ${targetNick} bola odoslaná.` }
    })

    /**
     * POST /cmd/revoke
     */
    router.post('/revoke', async ({ request, response }) => {
      const { userId, channelId, targetNick } = request.all()
      const channel = await Channel.find(channelId)
      const requesterMember = await ChannelMember.query()
        .where('user_id', userId)
        .where('channel_id', channelId)
        .first()

      if (channel?.availability !== 'private')
        return response.badRequest({ message: 'Príkaz /revoke funguje len v súkromných kanáloch.' })
      if (requesterMember?.status !== 'owner')
        return response.forbidden({ message: 'Len správca môže odoberať prístup.' })

      const targetUser = await User.findBy('nickname', targetNick)
      if (!targetUser) return response.notFound({ message: 'Používateľ nenájdený.' })

      const targetMember = await ChannelMember.query()
        .where('user_id', targetUser.id)
        .where('channel_id', channelId)
        .first()

      if (!targetMember) {
        return response.badRequest({ message: `${targetNick} nie je členom tohto kanála.` })
      }

      if (targetMember.status === 'owner') {
        return response.forbidden({ message: 'Nemôžeš odobrať prístup správcovi kanála.' })
      }

      await Access.query().where('user_id', targetUser.id).where('channel_id', channelId).delete()
      await ChannelMember.query()
        .where('user_id', targetUser.id)
        .where('channel_id', channelId)
        .delete()

      const userName =
        targetUser.nickname ||
        `${targetUser.firstname ?? ''} ${targetUser.surname ?? ''}`.trim() ||
        targetUser.email

      const systemMessage = await Message.create({
        channelId,
        senderId: targetUser.id,
        content: `${userName} bol odobraný z kanála správcom`,
      })

      channel.lastMessageAt = systemMessage.timestamp
      await channel.save()

      await systemMessage.load('sender')

      const serialized = systemMessage.serialize()
      const responseMessage = {
        ...serialized,
        sender: {
          id: targetUser.id,
          nickname: targetUser.nickname,
          firstname: targetUser.firstname,
          surname: targetUser.surname,
          email: targetUser.email,
          profilePicture: targetUser.profilePicture,
        },
        channelId,
      }

      const io = getIO()
      if (io) {
        io.to(`channel:${channelId}`).emit('member:left', {
          channelId,
          userId: targetUser.id,
          userName,
        })
        io.to(`channel:${channelId}`).emit('chat:message', responseMessage)
        io.to(`user:${targetUser.id}`).emit('channel:left', {
          channelId,
          title: channel.title,
        })
        console.log(
          `Sent member:left and channel:left events for revoked user ${targetUser.id} from channel ${channelId}`
        )
      }

      return { message: `Prístup pre ${targetNick} bol odobratý.` }
    })

    /**
     * POST /cmd/kick
     */
    router.post('/kick', async ({ request, response }) => {
      const { userId, channelId, targetNick } = request.all()

      if (!targetNick) return response.badRequest({ message: 'Musíš zadať meno (nick).' })

      const channel = await Channel.find(channelId)
      if (!channel) return response.badRequest({ message: 'Chyba: Kanál sa nenašiel.' })

      const targetUser = await User.findBy('nickname', targetNick)
      if (!targetUser)
        return response.badRequest({ message: `Chyba: Používateľ '${targetNick}' neexistuje.` })

      const requester = await ChannelMember.query()
        .where('user_id', userId)
        .where('channel_id', channelId)
        .first()
      if (!requester)
        return response.badRequest({ message: 'Chyba: Ty nie si členom tohto kanála.' })

      if (targetUser.id === userId) {
        return response.badRequest({ message: 'Nemôžeš vyhodiť sám seba. Použi /cancel.' })
      }

      const targetMember = await ChannelMember.query()
        .where('user_id', targetUser.id)
        .where('channel_id', channelId)
        .first()
      if (!targetMember) {
        return response.badRequest({
          message: `Chyba: Používateľ '${targetNick}' nie je v tomto kanáli.`,
        })
      }

      if (targetMember.status === 'owner') {
        return response.forbidden({ message: 'Nemôžeš vyhodiť správcu kanála!' })
      }

      if (requester.status === 'owner') {
        targetMember.status = 'banned'
        await targetMember.save()

        if (channel.availability === 'private') {
          await Access.query()
            .where('user_id', targetUser.id)
            .where('channel_id', channelId)
            .delete()
        }

        await KickVote.query()
          .where('channel_id', channelId)
          .where('target_user_id', targetUser.id)
          .delete()

        const userName =
          targetUser.nickname ||
          `${targetUser.firstname ?? ''} ${targetUser.surname ?? ''}`.trim() ||
          targetUser.email

        const systemMessage = await Message.create({
          channelId,
          senderId: targetUser.id,
          content: `${userName} opustil kanál`,
        })

        channel.lastMessageAt = systemMessage.timestamp
        await channel.save()

        await systemMessage.load('sender')

        const serialized = systemMessage.serialize()
        const responseMessage = {
          ...serialized,
          sender: {
            id: targetUser.id,
            nickname: targetUser.nickname,
            firstname: targetUser.firstname,
            surname: targetUser.surname,
            email: targetUser.email,
            profilePicture: targetUser.profilePicture,
          },
          channelId,
        }

        const io = getIO()
        if (io) {
          io.to(`channel:${channelId}`).emit('member:left', {
            channelId,
            userId: targetUser.id,
            userName,
          })
          io.to(`channel:${channelId}`).emit('chat:message', responseMessage)
          io.to(`user:${targetUser.id}`).emit('channel:left', {
            channelId,
            title: channel.title,
          })
          console.log(
            `Sent member:left and channel:left events for kicked user ${targetUser.id} from channel ${channelId}`
          )
        }

        return { message: `Správca udelil BAN používateľovi ${targetNick}.` }
      }

      const existingVote = await KickVote.query()
        .where('channel_id', channelId)
        .where('target_user_id', targetUser.id)
        .where('voter_user_id', userId)
        .first()

      if (existingVote) {
        return response.conflict({ message: 'Už si hlasoval za vyhodenie tohto člena.' })
      }

      await KickVote.create({
        channelId: channelId,
        targetUserId: targetUser.id,
        voterUserId: userId,
      })

      const votesCountResult = await KickVote.query()
        .where('channel_id', channelId)
        .where('target_user_id', targetUser.id)
        .count('* as total')

      const totalVotes = Number(votesCountResult[0].$extras.total)

      if (totalVotes >= 3) {
        targetMember.status = 'banned'
        await targetMember.save()

        if (channel.availability === 'private') {
          await Access.query()
            .where('user_id', targetUser.id)
            .where('channel_id', channelId)
            .delete()
        }

        await KickVote.query()
          .where('channel_id', channelId)
          .where('target_user_id', targetUser.id)
          .delete()

        const userName =
          targetUser.nickname ||
          `${targetUser.firstname ?? ''} ${targetUser.surname ?? ''}`.trim() ||
          targetUser.email

        const systemMessage = await Message.create({
          channelId,
          senderId: targetUser.id,
          content: `${userName} opustil kanál`,
        })

        channel.lastMessageAt = systemMessage.timestamp
        await channel.save()

        await systemMessage.load('sender')

        const serialized = systemMessage.serialize()
        const responseMessage = {
          ...serialized,
          sender: {
            id: targetUser.id,
            nickname: targetUser.nickname,
            firstname: targetUser.firstname,
            surname: targetUser.surname,
            email: targetUser.email,
            profilePicture: targetUser.profilePicture,
          },
          channelId,
        }

        const io = getIO()
        if (io) {
          io.to(`channel:${channelId}`).emit('member:left', {
            channelId,
            userId: targetUser.id,
            userName,
          })
          io.to(`channel:${channelId}`).emit('chat:message', responseMessage)
          io.to(`user:${targetUser.id}`).emit('channel:left', {
            channelId,
            title: channel.title,
          })
          console.log(
            `Sent member:left and channel:left events for kicked user ${targetUser.id} from channel ${channelId}`
          )
        }

        return {
          message: `Používateľ ${targetNick} bol zabanovaný na základe hlasovania (${totalVotes} hlasov).`,
        }
      }

      return { message: `Hlasoval si za kick ${targetNick}. Aktuálne hlasy: ${totalVotes}/3.` }
    })

    /**
     * POST /cmd/quit
     */
    router.post('/quit', async ({ request, response }) => {
      const { userId, channelId } = request.all()
      const channel = await Channel.find(channelId)
      if (!channel) return response.notFound()
      if (channel.creatorId !== userId)
        return response.forbidden({ message: 'Len správca môže zrušiť kanál.' })

      const channelTitle = channel.title

      await KickVote.query().where('channel_id', channelId).delete()
      await Message.query().where('channelId', channelId).delete()
      await ChannelMember.query().where('channel_id', channelId).delete()
      await Access.query().where('channel_id', channelId).delete()
      await ChannelInvite.query().where('channel_id', channelId).delete()
      await channel.delete()

      const io = getIO()
      if (io) {
        const room = `channel:${channelId}`
        io.to(room).emit('channel:deleted', {
          channelId: channelId,
          title: channelTitle,
        })
        io.emit('channel:deleted', {
          channelId: channelId,
          title: channelTitle,
        })
        console.log(`Sent channel:deleted event for channel ${channelId} (${channelTitle})`)
      }

      return { message: 'Kanál bol úspešne zrušený.' }
    })

    /**
     * POST /cmd/cancel
     */
    router.post('/cancel', async ({ request, response }) => {
      const { userId, channelId } = request.all()
      const channel = await Channel.find(channelId)
      if (!channel) return response.notFound()

      const user = await User.find(userId)
      const userName = user
        ? user.nickname || `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email
        : 'Unknown'

      if (channel.creatorId === userId) {
        await channel.delete()
        const io = getIO()
        if (io) {
          io.emit('channel:deleted', {
            channelId,
            title: channel.title,
          })
          console.log(`Sent channel:deleted event for channel ${channelId}`)
        }
        return { message: 'Opustil si kanál ako vlastník. Kanál bol zrušený.', action: 'deleted' }
      }

      await ChannelMember.query().where('user_id', userId).where('channel_id', channelId).delete()

      await KickVote.query().where('channel_id', channelId).where('voter_user_id', userId).delete()
      await KickVote.query().where('channel_id', channelId).where('target_user_id', userId).delete()

      if (channel.availability === 'private') {
        await Access.query().where('user_id', userId).where('channel_id', channelId).delete()
      }

        const systemMessage = await Message.create({
          channelId,
          senderId: userId,
          content: `${userName} opustil kanál`,
        })

        channel.lastMessageAt = systemMessage.timestamp
        await channel.save()

        await systemMessage.load('sender')

      const serialized = systemMessage.serialize()
      const responseMessage = {
        ...serialized,
        sender: {
          id: user.id,
          nickname: user.nickname,
          firstname: user.firstname,
          surname: user.surname,
          email: user.email,
          profilePicture: user.profilePicture,
        },
        channelId,
      }

      const io = getIO()
      if (io) {
        io.to(`channel:${channelId}`).emit('member:left', {
          channelId,
          userId,
          userName,
        })
        io.to(`channel:${channelId}`).emit('chat:message', responseMessage)
        io.to(`user:${userId}`).emit('channel:left', {
          channelId,
          title: channel.title,
        })
        console.log(`Sent member:left and channel:left events for user ${userId} from channel ${channelId}`)
      }

      return { message: 'Opustil si kanál.', action: 'left' }
    })
  })
  .prefix('/cmd')
