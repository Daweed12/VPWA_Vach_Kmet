import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Channel from '#models/channel'

export default class OfflineMessage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'sender_id' })
  declare senderId: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>
}
