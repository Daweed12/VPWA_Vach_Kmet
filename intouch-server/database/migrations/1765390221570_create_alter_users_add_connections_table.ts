import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Prázdna migrácia - zmeny už boli vrátené
    // Táto migrácia je len pre rollback kompatibilitu
  }

  async down() {
    // Prázdna migrácia - nič sa nerobí
  }
}

