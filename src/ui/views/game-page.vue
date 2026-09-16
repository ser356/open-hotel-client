<template>
  <canvas id="game"></canvas>
</template>
<script lang="ts">
import { Component, Provide, Vue } from 'vue-property-decorator'
import { Application } from '../../engine/Application'
import { ApplicationProvider } from '../../game/pixi/application.provider'
import { RoomProvider } from '../../game/room/room.provider'
import { Matrix } from '../../engine/lib/util/Matrix'
import { Loader } from '../../engine/loader'
import { gameRef } from '../../game'
import { hotelNetwork, RoomStatePayload } from '../../network/NetworkClient'
import { IUserModel } from '../../game/users/types'

@Component({
  name: 'GameView'
})
export default class GameView extends Vue {
  @Provide() app : ApplicationProvider = gameRef.get(ApplicationProvider)
  @Provide() game = gameRef
  @Provide() room: RoomProvider = gameRef.get(RoomProvider)
  @Provide() loader: Loader = gameRef.get(Loader)

  isLoaded = false
  isMounted = false
  unsubscribe: Array<() => void> = []

  $el: HTMLCanvasElement

  async activated() {
    if (!this.isMounted) {
      this.app.createApp({ view: this.$el })
      this.isMounted = true
      if (!this.isLoaded) return this.$router.replace('/splash')
      return
    }

    if (hotelNetwork.roomState) this.renderRoom(hotelNetwork.roomState)
  }

  created() {
    this.unsubscribe.push(
      hotelNetwork.on<RoomStatePayload>('room:state', state => this.renderRoom(state)),
      hotelNetwork.on<{ user: IUserModel }>('room:join', ({ user }) => this.room.putUser(user.id, user)),
      hotelNetwork.on<{ user: IUserModel }>('user:walk', ({ user }) => this.room.moveUser(user.id, user)),
      hotelNetwork.on<{ userId: string }>('user:leave', ({ userId }) => this.room.removeUser(userId)),
    )
  }

  beforeDestroy() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  async renderRoom(state: RoomStatePayload) {
    const roomUserDictionary = state.users.reduce((users, user) => {
      users[user.id] = user
      return users
    }, {} as Record<string, IUserModel>)
    await this.room.create({
      currentUserId: state.selfId,
      heightmap: Matrix.fromLegacyString(state.room.heightmap),
      onWalk: (x, y) => hotelNetwork.walk(x, y),
      roomUserDictionary,
    })
  }
}
</script>

<style lang="stylus">
#game {
  position: absolute;
  background: #000;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
