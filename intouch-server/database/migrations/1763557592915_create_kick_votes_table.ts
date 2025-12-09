// database/migrations/xxxx_kick_votes.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class KickVotes extends BaseSchema {
  protected tableName = 'kick_votes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      // user, ktorého chceme vykopnúť
      table
        .integer('target_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // user, ktorý hlasuje
      table
        .integer('voter_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table.primary(['channel_id', 'target_user_id', 'voter_user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
