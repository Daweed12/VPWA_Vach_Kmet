import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ChannelMember extends BaseModel {
  public static table = 'channel_members'
  public static primaryKey = 'user_id' // len aby mal Lucid PK

  @column({ columnName: 'user_id', isPrimary: true })
  declare userId: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true, columnName: 'joined_at' })
  declare joinedAt: DateTime
}
