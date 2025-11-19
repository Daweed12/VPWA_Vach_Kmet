// database/migrations/xxxx_channel_members.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ChannelMembers extends BaseSchema {
  protected tableName = 'channel_members'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('user_id')
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

      table.string('status', 30).notNullable().defaultTo('member')
      table.timestamp('joined_at', { useTz: true }).defaultTo(this.now())

      table.primary(['user_id', 'channel_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
