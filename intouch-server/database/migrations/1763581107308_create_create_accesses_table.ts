import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // ak chceš presne názov z ERD, necháme "access"
  protected tableName = 'access'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

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

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()

      // jeden user nemá mať duplicitný access do rovnakého kanála
      table.unique(['user_id', 'channel_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
