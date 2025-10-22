<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: "ChannelBar"
})
</script>

<template>
  <q-item class="channel-item bg-orange-8 text-white">
    <q-item-section class="text-weight-bold">
      channel
    </q-item-section>
    <q-item-section side>
      <div class="row items-center">
        <q-btn flat round dense icon="done" color="white" size="md" />
        <q-btn flat round dense icon="clear" color="white" size="md" />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.channel-item {
  border-radius: 15px; /* Zaoblené rohy */
  min-height: 50px; /* Aby bolo dostatočne vysoké */
  padding: 0 15px; /* Horizontálny padding */
  display: flex; /* Flexbox pre zarovnanie obsahu */
  align-items: center; /* Vertikálne centrovanie obsahu */
  justify-content: space-between; /* Rozloženie obsahu na kraje */
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); /* Jemný tieň */
  margin-bottom: 10px; /* Ak bude viac takýchto channelov */
}

/* Štýl pre text channelu */
.channel-item .q-item__section--main {
  font-size: 1.1em; /* Väčšia veľkosť písma */
}

/* Ikony sú už biele vďaka "color='white'" na q-btn a zdedenému "text-white" na q-item,
   takže nie je potrebné nič meniť v style pre ne. */
</style>
