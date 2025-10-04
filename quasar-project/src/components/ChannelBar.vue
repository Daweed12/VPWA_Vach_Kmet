<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: "Channel"
})
</script>

<template>
  <q-item class="channel-item bg-orange-1">
    <q-item-section class="text-black text-weight-bold">
      channel
    </q-item-section>
    <q-item-section side>
      <div class="row items-center">
        <q-btn flat round dense icon="person_add" color="orange-8" size="md" />
        <q-btn flat round dense icon="close" color="red-8" size="md" />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.channel-item {
  border-radius: 15px; /* Zaoblené rohy */
  min-height: 50px; /* Aby bolo dostatočne vysoké ako na obrázku */
  padding: 0 15px; /* Horizontálny padding */
  display: flex; /* Použijeme flexbox pre zarovnanie obsahu */
  align-items: center; /* Vertikálne centrovanie obsahu */
  justify-content: space-between; /* Rozloženie obsahu na kraje */
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); /* Jemný tieň, ak chceš */
  margin-bottom: 10px; /* Ak bude viac takýchto channelov */
}

/* Štýl pre text channelu */
.channel-item .q-item__section--main {
  font-size: 1.1em; /* Väčšia veľkosť písma */
}

/* Ak chceš presnejšie zarovnať ikony, toto je miesto, kde to môžeš ladiť */
.channel-item .q-item__section--side {
  padding-left: 10px; /* Malá medzera medzi textom a ikonami */
}
</style>
