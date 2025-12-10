import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('nickname', 80).notNullable().unique()
      table.string('firstname', 80).notNullable()
      table.string('surname', 80).notNullable()
      table.string('email', 255).notNullable().unique()
      table.string('profile_picture', 255).nullable()
      table.string('status', 50).notNullable().defaultTo('offline')
      table.boolean('notify_on_mention_only').notNullable().defaultTo(false)
      table.string('password', 180).notNullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    // Použiť CASCADE na odstránenie všetkých závislostí
    await this.db.rawQuery(`DROP TABLE IF EXISTS ${this.tableName} CASCADE`)
  }
}
