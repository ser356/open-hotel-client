import { Provider, Inject, CURRENT_MODULE, ModuleRef } from 'injets'
import { Viewport, BounceOptions } from 'pixi-viewport'
import { ApplicationProvider } from '../pixi/application.provider'
import { GameModule } from '../game.module'
import { RoomEngine } from './Room.engine'
import { RoomModel } from './types/room.model'
import { Container } from 'pixi.js'
import { RoomModule } from './room.module'
import { IUserModel } from '../users/types'

@Provider()
export class RoomProvider {
  constructor(
    @Inject(CURRENT_MODULE)
    private readonly gameModule: ModuleRef<RoomModule>,
    private readonly appProvider: ApplicationProvider,
  ) {}

  private currentRoomContainer: Container
  private currentRoom: RoomEngine

  private removeCurrentRoom () {
    if (!this.currentRoomContainer) {
      return
    }
    this.appProvider.culling.removeList(this.currentRoomContainer.children)
    this.appProvider.camera.removeChild(this.currentRoomContainer)
    this.currentRoom.destroy()
    this.currentRoom = null
    this.currentRoomContainer = null
  }

  async create (roomModel: RoomModel) {
    this.removeCurrentRoom()
    const roomEngine = this.gameModule.get<RoomEngine>(RoomEngine)
    const initialization = roomEngine.init(roomModel)
    this.currentRoom = roomEngine
    this.currentRoomContainer = roomEngine.container
    await initialization
    if (this.currentRoom !== roomEngine) return

    this.appProvider.camera.addChild(roomEngine.container)
    roomEngine.container.position.set(
      this.appProvider.app.screen.width / 2,
      Math.max(120, this.appProvider.app.screen.height / 4),
    )
    this.appProvider.culling.addList(roomEngine.container.children)
  }

  putUser(userId: string, user: IUserModel) {
    return this.currentRoom?.putUser(userId, user)
  }

  moveUser(userId: string, user: IUserModel) {
    this.currentRoom?.moveUser(userId, user)
  }

  removeUser(userId: string) {
    this.currentRoom?.removeUser(userId)
  }

  dispose() {}
}
