import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Channel from '#models/channel'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'sender_id' })
  declare senderId: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true, columnName: 'timestamp' })
  declare timestamp: DateTime

  // === vzťahy ===

  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  @manyToMany(() => User, {
    pivotTable: 'mentions',
    localKey: 'id',
    pivotForeignKey: 'message_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare mentionedUsers: ManyToMany<typeof User>
}
