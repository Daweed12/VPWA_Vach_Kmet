// app/models/channel.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type {
  BelongsTo,
  HasMany,
  ManyToMany,
} from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Message from '#models/message'
import Access from '#models/access'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare availability: string // 'public' | 'private'

  @column({ columnName: 'creator_id' })
  declare creatorId: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'lastmessage_at' })
  declare lastMessageAt: DateTime | null

  @column({ columnName: 'image_path' })
  declare imagePath: string | null

  // === vzťahy ===

  @belongsTo(() => User, {
    foreignKey: 'creatorId',
  })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Message, {
    foreignKey: 'channelId',
  })
  declare messages: HasMany<typeof Message>

  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotColumns: ['status', 'joined_at'],
    localKey: 'id',
    pivotForeignKey: 'channel_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare members: ManyToMany<typeof User>

  // access – kto má prístup do private kanálov
  @hasMany(() => Access, {
    foreignKey: 'channelId',
  })
  declare accesses: HasMany<typeof Access>
}
