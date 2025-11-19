import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Mention extends BaseModel {
  public static table = 'mentions'
  public static primaryKey = 'message_id'

  @column({ columnName: 'message_id', isPrimary: true })
  declare messageId: number

  @column({ columnName: 'user_id' })
  declare userId: number
}
