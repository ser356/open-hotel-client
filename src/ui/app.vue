<template>
  <div id="app">
    <px-window-manager>
      <transition name="fade">
        <keep-alive include="GameView">
          <router-view @splash-ready="loaded = true" />
        </keep-alive>
      </transition>
      <transition name="slide-y">
        <oh-toolbar
          v-if="loaded && authenticated"
          @toggle-window="toggleWindow($event)"
        />
      </transition>

      <template v-if="loaded && authenticated">
        <oh-notifications class="notifications" />

        <px-window v-bind.sync="window.browser">
          <oh-browser />
        </px-window>
      </template>

      <section v-if="loaded && !authenticated" class="hotel-login" aria-labelledby="hotel-login-title">
        <form class="hotel-login__card" @submit.prevent="login">
          <h1 id="hotel-login-title">Pies Libres Hotel</h1>
          <p>Elige tu nombre para entrar.</p>
          <label for="hotel-nickname">Nombre</label>
          <input
            id="hotel-nickname"
            v-model.trim="nickname"
            autocomplete="nickname"
            maxlength="16"
            minlength="3"
            pattern="[A-Za-z0-9_]{3,16}"
            required
          />
          <p v-if="loginError" class="hotel-login__error" role="alert">{{ loginError }}</p>
          <button type="submit" :disabled="connecting">{{ connecting ? 'Entrando…' : 'Entrar' }}</button>
        </form>
      </section>

      <section v-if="loaded && authenticated" class="hotel-chat" aria-label="Chat de la sala">
        <div class="hotel-chat__status" :class="{ 'hotel-chat__status--online': connected }">
          <span>{{ connected ? (joinedRoom ? `Conectado como ${user.name}` : 'Elige una sala en el navegador') : 'Reconectando…' }}</span>
          <button type="button" @click="logout">Salir</button>
        </div>
        <div class="hotel-chat__messages" aria-live="polite">
          <p v-for="message in messages" :key="message.id"><strong>{{ message.name }}:</strong> {{ message.text }}</p>
        </div>
        <form @submit.prevent="sendChat">
          <input v-model="chatText" maxlength="160" :disabled="!joinedRoom || !connected" placeholder="Escribe un mensaje…" aria-label="Mensaje" />
          <button type="submit" :disabled="!chatText.trim() || !joinedRoom || !connected">Enviar</button>
        </form>
      </section>
    </px-window-manager>
  </div>
</template>
<script>
import OhBrowser from './browser/browser.vue'
import { hotelNetwork } from '../network/NetworkClient'

export default {
  components: {
    OhBrowser,
  },
  data() {
    return {
      loaded: false,
      authenticated: false,
      connecting: false,
      connected: false,
      joinedRoom: false,
      nickname: '',
      loginError: '',
      chatText: '',
      messages: [],
      user: null,
      unsubscribes: [],
      window: {
        browser: {
          title: 'Salas',
          visible: true,
          width: Math.min(480, window.innerWidth - 24),
          height: Math.min(300, window.innerHeight - 80),
          x: 12,
          y: 12,
        },
      },
    }
  },
  created() {
    this.unsubscribes = [
      hotelNetwork.on('connection', ({ connected }) => { this.connected = connected }),
      hotelNetwork.on('session:ready', ({ user }) => {
        this.user = user
        this.authenticated = true
      }),
      hotelNetwork.on('session:expired', () => {
        this.authenticated = false
        this.connected = false
        this.joinedRoom = false
        this.user = null
      }),
      hotelNetwork.on('room:state', ({ room }) => {
        this.joinedRoom = true
        this.messages = [{ id: `room-${Date.now()}`, name: 'Hotel', text: `Has entrado en ${room.name}.` }]
      }),
      hotelNetwork.on('user:speak', message => {
        this.messages.push({ id: `${message.userId}-${message.timestamp}`, ...message })
        this.messages = this.messages.slice(-50)
      }),
      hotelNetwork.on('error', ({ code }) => {
        if (code === 'rate_limited') this.messages.push({ id: `error-${Date.now()}`, name: 'Hotel', text: 'Vas demasiado rápido.' })
      }),
    ]
    hotelNetwork.restoreGuest()
      .then(user => {
        if (!user) return
        this.user = user
        this.authenticated = true
      })
      .catch(() => { this.loginError = 'No se pudo conectar con el hotel.' })
  },
  beforeDestroy() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
  },
  methods: {
    toggleWindow(name) {
      this.window[name].focused = this.window[name].visible = !this.window[name].visible;
    },
    async login() {
      this.connecting = true
      this.loginError = ''
      try {
        this.user = await hotelNetwork.createGuest(this.nickname)
        this.authenticated = true
      } catch (error) {
        this.loginError = error.message === 'nickname_in_use'
          ? 'Ese nombre ya está conectado.'
          : error.message === 'invalid_nickname'
            ? 'Usa entre 3 y 16 letras, números o guiones bajos.'
            : 'No se pudo conectar con el hotel.'
      } finally {
        this.connecting = false
      }
    },
    sendChat() {
      const text = this.chatText.trim()
      if (!text) return
      hotelNetwork.speak(text)
      this.chatText = ''
    },
    async logout() {
      try {
        await hotelNetwork.logout()
        this.nickname = ''
        this.messages = []
      } catch {
        this.messages.push({ id: `logout-${Date.now()}`, name: 'Hotel', text: 'No se pudo cerrar la sesión. Inténtalo de nuevo.' })
      }
    }
  }
}
</script>
<style lang="stylus">
@import "./global.styl";

#app {
  background: #000;

  .notifications {
    position: fixed;
    top: 100px;
    right: 8px;
    z-index: 1000;
    width: 200px;
  }
}

.hotel-login {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: linear-gradient(#85c9ef, #dff4ff);

  &__card {
    width: calc(100% - 32px);
    max-width: 360px;
    padding: 28px;
    border: 3px solid #1d4761;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 10px 0 rgba(29, 71, 97, 0.35);
    color: #18394d;
  }

  h1, p, label { margin-bottom: 12px; }
  label { display: block; font-weight: bold; }
  input, button { width: 100%; min-height: 42px; border-radius: 7px; font: inherit; }
  input { border: 2px solid #7ca5ba; padding: 0 12px; }
  button { margin-top: 14px; border: 0; background: #3f8f3d; color: #fff; font-weight: bold; cursor: pointer; }
  button:disabled { cursor: wait; opacity: 0.65; }

  &__error { color: #a12626; }
}

.hotel-chat {
  position: fixed;
  right: 12px;
  bottom: 58px;
  z-index: 1200;
  width: calc(100% - 24px);
  max-width: 380px;
  overflow: hidden;
  border: 2px solid #222;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: #111;

  &__status { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 10px; background: #8c2d2d; color: #fff; font-size: 13px; }
  &__status--online { background: #357a38; }
  &__status button { border: 0; padding: 2px 8px; background: transparent; color: inherit; font: inherit; font-weight: bold; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
  &__messages { max-height: 130px; overflow-y: auto; padding: 8px 10px; }
  &__messages p { margin: 0 0 4px; overflow-wrap: anywhere; }
  form { display: flex; border-top: 1px solid #aaa; }
  input { min-width: 0; flex: 1; border: 0; padding: 10px; font: inherit; }
  button { border: 0; padding: 0 14px; background: #3a7392; color: #fff; font-weight: bold; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s;
}

.fade-leave-active {
  position: absolute;
}

/* set opacity to 0 at element's entrance and exit */
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.fade-x {
  &-move {
    transition: all 1s;
  }

  &-leave-active {
    position: absolute;
  }

  &-enter-active, &-leave-active {
    transition: all 1s;
  }

  &-enter, &-leave-to {
    opacity: 0;
    transform: translate(100%, 0);
  }
}

.slide-y {
  &-enter-active, &-leave-active {
    transition: all 0.5s ease;
  }

  &-enter-active {
    transition-delay: 0.5s;
  }

  &-enter, &-leave-to {
    transform: translate(0, 100%);
  }
}
</style>
