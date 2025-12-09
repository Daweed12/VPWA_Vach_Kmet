// database/migrations/xxxx_channels.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Channels extends BaseSchema {
  protected tableName = 'channels'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title', 120).notNullable()
      table.string('availability', 20).notNullable().defaultTo('public')

      // creator – user, ktorý kanal vytvoril
      table.integer('creator_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('lastmessage_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
