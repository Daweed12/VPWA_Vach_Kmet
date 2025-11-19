<template>
  <q-page class="flex flex-center bg-orange-6">
    <div class="column items-center q-gutter-md">

      <q-img
        :src="logoUrl"
        contain
        style="max-width: 320px; max-height: 120px"
        alt="inTouch logo"
      />

      <q-card class="q-pa-xl q-pt-lg" style="width: 420px; max-width: 90vw;">
        <q-form v-if="!showRegister" @submit.prevent="handleLogin">
          <q-input
            v-model="loginForm.username"
            label="Meno"
            outlined
            class="q-mb-md"
            :rules="[v => !!v || 'Zadaj meno']"
          />
          <q-input
            v-model="loginForm.password"
            label="Heslo"
            type="password"
            outlined
            class="q-mb-md"
            :rules="[v => !!v || 'Zadaj heslo']"
          />
          <div class="row q-gutter-sm">
            <q-btn label="Prihlásiť" type="submit" color="primary" class="col" />
            <q-btn
              label="Registrovať"
              flat
              color="secondary"
              class="col"
              @click="showRegister = true"
            />
          </div>
        </q-form>

        <q-form v-else @submit.prevent="handleRegister">
          <q-input
            v-model="registerForm.firstName"
            label="Meno"
            outlined
            class="q-mb-md"
            :rules="[req]"
          />
          <q-input
            v-model="registerForm.lastName"
            label="Priezvisko"
            outlined
            class="q-mb-md"
            :rules="[req]"
          />
          <q-input
            v-model="registerForm.email"
            label="Mail"
            type="email"
            outlined
            class="q-mb-md"
            :rules="[req]"
          />
          <q-input
            v-model="registerForm.nickname"
            label="Nickname"
            outlined
            class="q-mb-md"
            :rules="[req]"
          />
          <q-input
            v-model="registerForm.password"
            label="Heslo"
            type="password"
            outlined
            class="q-mb-md"
            :rules="[req]"
          />
          <div class="row q-gutter-sm">
            <q-btn label="Vytvoriť účet" type="submit" color="primary" class="col" />
            <q-btn
              label="Späť na prihlásenie"
              flat
              color="secondary"
              class="col"
              @click="showRegister = false"
            />
          </div>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import logoUrl from 'src/assets/intouch-logo-name.svg'
import { api } from 'boot/api'
import axios from 'axios'

export default defineComponent({
  setup () {
    const router = useRouter()
    const $q = useQuasar()

    const showRegister = ref(false)

    const loginForm = reactive({
      username: '',
      password: '',
    })

    const registerForm = reactive({
      firstName: '',
      lastName: '',
      email: '',
      nickname: '',
      password: '',
    })

    const req = (v: string) => !!v || 'Povinné pole'

    const goToApp = async () => {
      await router.push('/app')
    }

    // LOGIN – iba používatelia z DB
    const handleLogin = async () => {
      if (!loginForm.username || !loginForm.password) {
        $q.notify({
          type: 'negative',
          message: 'Zadaj meno aj heslo.',
          position: 'bottom',
          timeout: 2500,
          actions: [{ label: 'OK', color: 'white' }],
        })
        return
      }

      try {
        const { data } = await api.post('/login', {
          username: loginForm.username,
          password: loginForm.password,
        })

        localStorage.setItem('currentUser', JSON.stringify(data))
        await goToApp()
      } catch (error: unknown) {
        let message = 'Nesprávne meno alebo heslo.'

        if (axios.isAxiosError(error)) {
          const serverData = error.response?.data
          if (
            serverData &&
            typeof serverData === 'object' &&
            'message' in serverData
          ) {
            message = (serverData as { message: string }).message
          }
        }

        $q.notify({
          type: 'negative',
          message,
          position: 'bottom',
          timeout: 2500,
          actions: [{ label: 'OK', color: 'white' }],
        })
      }
    }

    // REGISTER – zatiaľ len info, nič sa reálne neuloží
    const handleRegister = () => {
      $q.notify({
        type: 'info',
        message: 'Registrácia zatiaľ nie je dostupná.',
        position: 'bottom',
        timeout: 2500,
        actions: [{ label: 'OK', color: 'white' }],
      })
    }

    return {
      logoUrl,
      showRegister,
      loginForm,
      registerForm,
      req,
      handleLogin,
      handleRegister,
    }
  },
})
</script>
