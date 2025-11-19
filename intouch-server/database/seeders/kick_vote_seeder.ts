import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class KickVoteSeeder extends BaseSeeder {
  public async run () {
    console.log('KickVoteSeeder: preskočený (používam MainSeeder).')
    // Dáta do kick_votes sa vkladajú v MainSeederi
  }
}
