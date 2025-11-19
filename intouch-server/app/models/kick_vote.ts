import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class KickVote extends BaseModel {
  public static table = 'kick_votes'
  public static primaryKey = 'channel_id'

  @column({ columnName: 'channel_id', isPrimary: true })
  declare channelId: number

  @column({ columnName: 'target_user_id' })
  declare targetUserId: number

  @column({ columnName: 'voter_user_id' })
  declare voterUserId: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
