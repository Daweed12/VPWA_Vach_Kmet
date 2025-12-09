// database/migrations/xxxx_mentions.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Mentions extends BaseSchema {
  protected tableName = 'mentions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('message_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.primary(['message_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
