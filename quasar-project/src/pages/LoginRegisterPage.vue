<!-- src/pages/LoginRegisterPage.vue -->
<template>
  <q-page class="flex flex-center bg-orange-6">
    <div class="column items-center q-gutter-md">

      <!-- LOGO NAD BOXM -->
      <q-img
        :src="logoUrl"
        contain
        style="max-width: 320px; max-height: 120px"
        alt="inTouch logo"
      />

      <!-- BOX NA PRIHLÁSENIE/REGISTRÁCIU -->
      <q-card class="q-pa-xl q-pt-lg" style="width: 420px; max-width: 90vw;">
        <!-- ak už máš logo, nadpis môžeš kľudne zmazať -->
        <!-- <div class="text-center text-h5 text-weight-bold q-mb-md">inTouch</div> -->

        <!-- LOGIN -->
        <q-form v-if="!showRegister" @submit.prevent="handleLogin">
          <q-input v-model="loginForm.username" label="Meno" outlined class="q-mb-md"
                   :rules="[v => !!v || 'Zadaj meno']" />
          <q-input v-model="loginForm.password" label="Heslo" type="password" outlined class="q-mb-md"
                   :rules="[v => !!v || 'Zadaj heslo']" />
          <div class="row q-gutter-sm">
            <q-btn label="Prihlásiť" type="submit" color="primary" class="col" />
            <q-btn label="Registrovať" flat color="secondary" class="col" @click="showRegister = true" />
          </div>
        </q-form>

        <!-- REGISTER -->
        <q-form v-else @submit.prevent="handleRegister">
          <q-input v-model="registerForm.firstName" label="Meno" outlined class="q-mb-md" :rules="[req]" />
          <q-input v-model="registerForm.lastName"  label="Priezvisko" outlined class="q-mb-md" :rules="[req]" />
          <q-input v-model="registerForm.email"     label="Mail" type="email" outlined class="q-mb-md" :rules="[req]" />
          <q-input v-model="registerForm.nickname"  label="Nickname" outlined class="q-mb-md" :rules="[req]" />
          <q-input v-model="registerForm.password"  label="Heslo" type="password" outlined class="q-mb-md" :rules="[req]" />
          <div class="row q-gutter-sm">
            <q-btn label="Vytvoriť účet" type="submit" color="primary" class="col" />
            <q-btn label="Späť na prihlásenie" flat color="secondary" class="col" @click="showRegister = false" />
          </div>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import logoUrl from 'src/assets/intouch-logo-name.svg'

const router = useRouter()
const showRegister = ref(false)

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ firstName: '', lastName: '', email: '', nickname: '', password: '' })
const req = (v: string) => !!v || 'Povinné pole'

function goToApp () { void router.push('/app') }
function handleLogin () { goToApp() }
function handleRegister () {
  const allFilled = Object.values(registerForm).every(Boolean)
  if (allFilled) goToApp()
}
</script>
