import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import Message from '#models/message'
import Channel from '#models/channel'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nickname: string

  @column()
  declare firstname: string

  @column()
  declare surname: string

  @column()
  declare email: string

  @column({ columnName: 'profile_picture' })
  declare profilePicture: string | null

  @column()
  declare status: string

  @column({ columnName: 'notify_on_mention_only' })
  declare notifyOnMentionOnly: boolean

  @column()
  declare password: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
  })
  declare updatedAt: DateTime

  // === vzťahy ===

  @hasMany(() => Message, {
    foreignKey: 'senderId',
  })
  declare messages: HasMany<typeof Message>

  @hasMany(() => Channel, {
    foreignKey: 'creatorId',
  })
  declare createdChannels: HasMany<typeof Channel>

  @manyToMany(() => Channel, {
    pivotTable: 'channel_members',
    pivotColumns: ['status', 'joined_at'],
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'channel_id',
  })
  declare channels: ManyToMany<typeof Channel>
}
