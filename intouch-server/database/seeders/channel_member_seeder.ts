import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ChannelMemberSeeder extends BaseSeeder {
  public async run () {
    console.log('ChannelMemberSeeder: preskočený (používam MainSeeder).')
    // Dáta do pivot tabuľky channel_members sa vkladajú v MainSeederi
  }
}
