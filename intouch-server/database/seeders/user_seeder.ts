import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserSeeder extends BaseSeeder {
  public async run () {
    console.log('UserSeeder: preskočený (používam MainSeeder).')
    // Dáta do tabuľky users sa vkladajú v MainSeederi
  }
}
