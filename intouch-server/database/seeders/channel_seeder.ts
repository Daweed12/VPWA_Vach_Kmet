import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ChannelSeeder extends BaseSeeder {
  public async run () {
    console.log('ChannelSeeder: preskočený (používam MainSeeder).')
    // Dáta do tabuľky channels sa vkladajú v MainSeederi
  }
}
