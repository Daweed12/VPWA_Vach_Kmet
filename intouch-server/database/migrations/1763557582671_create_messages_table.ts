// database/migrations/xxxx_messages.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Messages extends BaseSchema {
  protected tableName = 'messages'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('sender_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table.text('content').notNullable()
      table.timestamp('timestamp', { useTz: true }).defaultTo(this.now())

      table.index(['channel_id', 'timestamp'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
