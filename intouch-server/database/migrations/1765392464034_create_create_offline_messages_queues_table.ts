import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'offline_messages'

  async up() {
    // Skontrolovať, či tabuľka už existuje
    const tableExists = await this.db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${this.tableName}'
      );
    `)
    
    if (!tableExists.rows[0].exists) {
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
        table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

        table.index(['sender_id', 'created_at'])
      })
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
