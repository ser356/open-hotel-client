<template>
  <div style="flex: 1;">
    <px-scrollview>
      <ul class="room-list">
        <li class="room-list-category">
          <div class="room-list-header">Salas populares</div>
          <ul class="room-list">
            <li
              v-for="(room, i) in popularRooms"
              :key="room.id"
              class="room-list-item"
              @click="selectRoom(room)"
            >
              <div class="count-users text-center">{{ room.usersCount }}</div>
              <p class="room-list-item-title">
                {{ room.name }}
              </p>
            </li>
          </ul>
        </li>
        <li v-if="loading" class="room-list-status">Cargando salas…</li>
        <li v-else-if="error" class="room-list-status">
          No se pudieron cargar las salas.
          <button type="button" @click="loadRooms">Reintentar</button>
        </li>
        <li v-else-if="!popularRooms.length" class="room-list-status">Todavía no hay salas.</li>
      </ul>
    </px-scrollview>
  </div>
</template>

<script>
import { hotelNetwork } from '../../network/NetworkClient'

export default {
  data () {
    return {
      popularRooms: [],
      loading: true,
      error: false,
      unsubscribes: [],
    }
  },
  created () {
    this.loadRooms()
    this.unsubscribes = [
      hotelNetwork.on('room:state', this.loadRooms),
      hotelNetwork.on('room:join', this.loadRooms),
      hotelNetwork.on('user:leave', this.loadRooms),
    ]
  },
  beforeDestroy () {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
  },
  methods: {
    async loadRooms () {
      this.loading = true
      this.error = false
      try {
        this.popularRooms = await hotelNetwork.listRooms()
      } catch {
        this.error = true
      } finally {
        this.loading = false
      }
    },
    selectRoom (room) {
      hotelNetwork.joinRoom(room.id)
    }
  }
}
</script>

<style lang="stylus">
.room-list {
  margin-right: 0.25em;

  &-header {
    color: #3A7392;
    font-size: 16px;
    padding: 0.5em 0;
    position: sticky;
    top: 0;
    background: #FFF;
  }

  &-item {
    display: flex;
    align-items: center;
    padding: 2px;
    color: #000;
    cursor: pointer;

    &-title {
      flex: 1;
    }

    &:hover {
      background-color: #F0F0F0;
    }

    &:nth-child(2n+1) {
      background-color: #D5EDFF;
      &:hover {
        background-color: #C5DDEF;
      }
    }
  }

  .count-users {
    flex: 0 auto;
    padding: 0.128em 0.809em;
    border-radius: 4px;
    background: #5FAB5E;
    color: #FFF;
    font-weight: bold;
    margin-right: 0.5em;
    width: 43.42px;
  }

  &-status {
    color: #3A7392;
    padding: 1em 0;

    button {
      margin-left: 0.5em;
      border: 1px solid #3A7392;
      border-radius: 4px;
      padding: 0.25em 0.5em;
      background: #FFF;
      color: #234D64;
      cursor: pointer;
    }
  }
}
</style>
