<template>
  <q-layout view="lhh lpR lFr">
    <q-header class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class = "bg-primary"></div>
      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
          Channel name
        </q-toolbar-title>
        <q-btn dense flat round icon="close" />
        <q-btn dense flat round icon="person_add" />
        <q-btn dense flat round icon="group" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <!-- Left drawer -->
    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      class="bg-orange-5 column"
    >
      <div style="margin: 10px 15px 10px 15px;">
        <img src="../assets/intouch-logo-name.svg" alt="logo" style="width: 100%; height: auto; margin-top: 10px" />
      </div>

      <!-- Channels -->
      <div class="col q-pa-md bg-orange-2 drawer-div-wrapper" style="overflow-y: auto;">
        <q-list>
          <channel/>
          <channel/>
          <channel/>
          <channel/>
          <channel/>
          <channel/>
          <channel/>
        </q-list>
      </div>

      <div class="q-pa-none bg-orange-2 drawer-div-wrapper" style="margin-top: 10px; padding: 2px">
        <q-item v-ripple>
          <q-item-section avatar>
            <q-avatar size="50px" color="white" text-color="bg-gray-9">
              <q-badge floating color="red" rounded />S
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Meno Používateľa</q-item-label>
            <q-item-label caption>Status/Rola</q-item-label>
          </q-item-section>
        </q-item>
      </div>
      <div style="height: 10px;" class = "bg-primary"></div>
    </q-drawer>

    <!-- Right drawer -->
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
    </q-drawer>

    <q-page-container class="bg-orange-3">
      <router-view />
    </q-page-container>

    <q-footer class="bg-orange-1 footer-wrapper q-pa-none">
          <text-bar class="full-width full-height"/>
    </q-footer>

  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue'
import textBar from 'src/components/TextBar.vue'
import ChannelBar from 'components/ChannelBar.vue'
export default {
  components : {
    textBar, channel: ChannelBar
  },
  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },

      rightDrawerOpen,
      toggleRightDrawer () {
        rightDrawerOpen.value = !rightDrawerOpen.value
      }
    }
  }
}
</script>

<style>
  .footer-wrapper {
    margin: 0.2cm 0.2cm 0.2cm 0.2cm; /* hore, pravo, dole, lavo */
    border-radius: 20px; /* zaoblené rohy */
    overflow: hidden; /* aby obsah footeru rešpektoval border-radius */
  }
  .full-width {
    width: 100%;
  }

  .full-height {
    height: 100%;
  }

  .drawer-div-wrapper{
    border-radius: 20px;
    margin: 0 10px 0 10px;
  }
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

  /* --- Pre pravý drawer: Statusové bodky --- */

  /* Všeobecný štýl pre bodku */
  .status-dot {
    position: absolute;

    /* --- ZMENA PRE PRAVÝ DOLNÝ ROH --- */
    top: auto;        /* Zruší pôvodné pravidlo (top: 5px) */
    right: 5px;       /* Ponechá odsadenie od pravej strany */
    bottom: 5px;      /* PRILEPÍ bodku 5px od spodného okraja */
    /* ------------------------------------ */

    /* Veľkosť bodky */
    width: 15px;
    height: 15px;
    border-radius: 50%;

    /* Biely okraj (použi farbu pozadia wrapperu) */
    border: 2px solid #FEE7D7;
    z-index: 10;
  }

  /* Farby pre rôzne statusy (zostávajú nezmenené) */
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
