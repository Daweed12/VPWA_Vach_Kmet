<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: "ChannelSearchHeader"
})
</script>

<template>
  <div class="search-bar-container q-mb-lg q-pa-md">
    <q-input
      outlined
      dense
      placeholder="Hľadať kanály..."
      class="search-input"
      bg-color="white"
      debounce="300"
     model-value="">
      <template v-slot:prepend>
        <q-icon name="search" color="grey-6" />
      </template>
    </q-input>

    <q-btn
      round
      dense
      icon="add"
      color="orange-8"
      size="lg"
      class="add-channel-btn"
    />
  </div>
</template>

<style scoped>
/* Kontajner pre vyhľadávanie a "+" tlačidlo */
.search-bar-container {
  display: flex;
  align-items: center;
  gap: 10px; /* Medzera medzi inputom a tlačidlom */
  padding-top: 0 !important; /* Odstránime horný padding, ak bol pridaný cez q-pa-md */
  padding-bottom: 0 !important; /* Odstránime spodný padding, ak bol pridaný cez q-pa-md */
  padding-left: 16px; /* Zabezpečíme, že je zarovnaný s ostatným obsahom */
  padding-right: 16px;
}

/* Štýl pre Q-Input */
.search-input {
  flex-grow: 1; /* Zaberie všetok dostupný priestor */
  border-radius: 10px; /* Zaoblené rohy */
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1); /* Jemný tieň */
  height: 48px; /* Zabezpečí, aby bol rovnako vysoký ako q-btn lg */
}

/* Štýl pre Q-Btn Plus */
.add-channel-btn {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
