import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_invites'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('inviter_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table
        .enum('status', ['pending', 'accepted', 'rejected'])
        .notNullable()
        .defaultTo('pending')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('responded_at', { useTz: true }).nullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()

      table.unique(['channel_id', 'user_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
