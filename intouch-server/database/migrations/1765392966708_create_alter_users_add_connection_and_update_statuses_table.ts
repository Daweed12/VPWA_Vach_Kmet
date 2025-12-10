import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Pridaj stĺpec connection pomocou rawQuery
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      ADD COLUMN IF NOT EXISTS connection VARCHAR(20) NOT NULL DEFAULT 'online'
    `)

    // Aktualizuj existujúce dáta - nastav všetkým connection = 'online' a status = 'normal'
    await this.db.rawQuery(`
      UPDATE ${this.tableName}
      SET 
        connection = 'online',
        status = 'normal'
    `)

    // Odstráň starý constraint ak existuje
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      DROP CONSTRAINT IF EXISTS check_status_values
    `)

    // Pridaj nový constraint pre status (len away, dnd, normal)
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT check_status_values
      CHECK (status IN ('away', 'dnd', 'normal'))
    `)

    // Pridaj constraint pre connection (len online, offline)
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT check_connection_values
      CHECK (connection IN ('online', 'offline'))
    `)
  }

  async down() {
    // Odstráň constrainty
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      DROP CONSTRAINT IF EXISTS check_status_values
    `)

    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      DROP CONSTRAINT IF EXISTS check_connection_values
    `)

    // Odstráň stĺpec connection
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('connection')
    })
  }
}
