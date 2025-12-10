import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Odstráň constraint, ktorý zostal z predchádzajúcej migrácie
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName} 
      DROP CONSTRAINT IF EXISTS check_status_values
    `)
  }

  async down() {
    // V prípade rollbacku, constraint sa neobnoví (nechceme ho)
  }
}

