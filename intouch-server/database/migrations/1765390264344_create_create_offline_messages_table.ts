import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'offline_messages'

  async up() {
    // Prázdna migrácia - tabuľka už neexistuje alebo bola vymazaná
    // Táto migrácia je len pre rollback kompatibilitu
  }

  async down() {
    // Prázdna migrácia - nič sa nerobí
  }
}


