// start/routes.ts
import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'   // <<< normálny (statický) import

/*
|--------------------------------------------------------------------------
| Default route - len na test
|--------------------------------------------------------------------------
*/
router.get('/', async () => {
  return { hello: 'world' }
})

/*
|--------------------------------------------------------------------------
| Zoznam kanálov z DB
|--------------------------------------------------------------------------
*/
router.get('/channels', async () => {
  const channels = await Channel.all()
  return channels          // <<< musíš vrátiť, inak je "unused variable"
})
