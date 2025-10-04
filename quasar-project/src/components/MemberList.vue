<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LeftChannelDrawer',
  props: {
    // Používame "modelValue" pre kompatibilitu s Quasar v-model
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'], // Emitujeme udalosť pre v-model
});
</script>

<template>
  <q-drawer
    show-if-above
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    side="left"
    class="bg-orange-5 column"
  >
    <div style="margin: 20px;">
      <img src="../assets/intouch-logo-name.svg" alt="logo" style="width: 100%; height: auto;" />
    </div>

    <div class="col q-pa-md bg-orange-2 channel-list-wrapper" style="margin: 0 20px 20px 20px; overflow-y: auto;">

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

      <q-item class="channel-item bg-orange-1">
        <q-item-section class="text-black text-weight-bold">
          General
        </q-item-section>
        <q-item-section side>
          <div class="row items-center">
            <q-btn flat round dense icon="person_add" color="orange-8" size="md" />
            <q-btn flat round dense icon="close" color="red-8" size="md" />
          </div>
        </q-item-section>
      </q-item>
    </div>

    <div class="q-pa-sm bg-orange-2" style="margin: 0 20px 20px 20px; border-radius: 20px;">
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-avatar size="50px" color="blue" text-color="white">
            S
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>Meno Používateľa</q-item-label>
          <q-item-label caption>Online</q-item-label>
        </q-item-section>
      </q-item>
    </div>
  </q-drawer>
</template>

<style scoped>
  /* --- Pre pravý drawer: Statusové bodky --- */

  /* Všeobecný štýl pre bodku */
  .status-dot {
    position: absolute;
    /* Umiestnenie v pravom hornom rohu (ako na obrázku) */
    top: 5px;
    right: 5px;
    /* Veľkosť bodky */
    width: 15px;
    height: 15px;
    border-radius: 50%; /* Aby bola dokonale okrúhla */
    /* Biely okraj pre vizuálny efekt ako na obrázku */
    border: 2px solid #FEE7D7; /* Použi farbu pozadia vnútorného kontajnera */
    z-index: 10;
  }

  /* Farby pre rôzne statusy */
  .status-dot.online {
    background-color: #4CAF50; /* Zelená */
  }

  .status-dot.offline {
    background-color: #F44336; /* Červená */
  }

  .status-dot.away {
    background-color: #9E9E9E; /* Šedá */
  }
</style>
