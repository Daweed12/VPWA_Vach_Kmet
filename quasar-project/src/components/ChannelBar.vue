<script lang="ts">
import { defineComponent, ref} from 'vue'

export default defineComponent({
  name: 'ChannelBar',
  props: {
    name: {
      type: String,
      required: true
    },
    /**
     * Prepne komponent do režimu "pozvánka"
     */
    isInvite: {
      type: Boolean,
      default: false
    }
  },
  // Definujeme, aké udalosti môže komponent vysielať
  emits: ['accept', 'reject'],

  setup (props, { emit }) {
    // Tieto hodnoty nastavujeme, len ak to NIE JE pozvánka
    const badgeColor = ref('green')
    const badgeText = ref('public')

    if (!props.isInvite) {
      // Náhodne určíme, či je kanál private alebo public
      const isPrivate = Math.random() < 0.5
      badgeColor.value = isPrivate ? 'red' : 'green'
      badgeText.value = isPrivate ? 'private' : 'public'
    }

    // Metódy pre obsluhu pozvánky
    const acceptInvite = () => {
      emit('accept')
    }

    const rejectInvite = () => {
      // Pošleme udalosť rodičovi
      emit('reject')
    }

    return {
      badgeColor,
      badgeText,
      acceptInvite,
      rejectInvite
    }
  }
})
</script>

<template>
  <q-item
    :class="isInvite ? 'invite-item bg-orange-8' : 'channel-item bg-orange-1'"
    clickable
    v-ripple
  >
    <q-item-section :class="isInvite ? 'text-white text-weight-bold' : 'text-black text-weight-bold'">
      {{ name }}
    </q-item-section>

    <q-badge v-if="!isInvite" :color="badgeColor" class="q-ml-sm text-white text-uppercase" align="middle">
      {{ badgeText }}
    </q-badge>

    <q-item-section v-if="!isInvite" side>
      <div class="row items-center">
        <q-btn flat round dense icon="person_add" color="orange-8" size="md" />
        <q-btn flat round dense icon="close" color="red-8" size="md" />
      </div>
    </q-item-section>

    <q-item-section v-else side>
      <div class="row items-center">
        <q-btn flat round dense icon="check" color="white" size="md" @click="acceptInvite" />
        <q-btn flat round dense icon="close" color="white" size="md" @click="rejectInvite" />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
/* Spoločné štýly pre oba varianty */
.channel-item, .invite-item {
  border-radius: 15px;
  min-height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  transition: background-color 0.2s ease;
}

/* :hover pre normálny kanál (svetlo oranžový) */
.channel-item:hover {
  background-color: #ffcc80 !important; /* !important je potrebný na prebitie Quasar bg- triedy */
}

/* :hover pre invite (tmavo oranžový) */
.invite-item:hover {
  background-color: #ef6c00 !important; /* tmavšia oranžová (orange-9) */
}

/* Spoločné štýly pre sekcie */
.channel-item .q-item__section--main,
.invite-item .q-item__section--main {
  font-size: 1.1em;
}

.channel-item .q-item__section--side,
.invite-item .q-item__section--side {
  padding-left: 10px;
}
</style>
