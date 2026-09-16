import { Container } from 'pixi.js'
import { Provider } from 'injets'
import { Matrix } from '../../engine/lib/util/Matrix'
import { RoomImager } from '../imager/room.imager'
import { IsoPoint, IsoPointObject } from '../../engine/lib/IsoPoint'
import { RoomModel } from './types/room.model'
import { AvatarImager } from '../imager/avatar/human-imager'
import { RoomUser } from './users/RoomUser'
import { PRIORITY } from './room.constants'
import { FloorRenderer } from './floor/FloorRenderer'
import { WallRenderer } from './wall/WallRenderer'
import { IUserModel } from '../users/types'
import { ApplicationProvider } from '../pixi/application.provider'

@Provider()
export class RoomEngine {
  public container: Container
  public heightmap: Matrix<number>
  public floorRenderer: FloorRenderer
  public wallRenderer: WallRenderer
  private users = new Map<string, RoomUser>()
  private currentUserId: string
  private onWalk: (x: number, y: number) => void

  constructor(
    public readonly appProvider: ApplicationProvider,
    public readonly roomImager: RoomImager,
    public readonly avatarImager: AvatarImager
  ) {
    this.appProvider.app.ticker.add((delta) => this.tick(delta))
  }

  get currentUser () {
    return this.users.get(this.currentUserId)
  }

  calcZIndex({ x, y, z }: IsoPointObject, priority = 1) {
    return (x + y + z) * priority
  }

  destroy () {
    this.users.forEach(user => user.destroy())
    this.container.removeChildren()
    this.users.clear()
  }

  /**
   * TODO: Render Furni
   */
  putFurni() { }

  putUsers(userOptionsDictionary: Record<string, IUserModel>) {
    return Object.entries(userOptionsDictionary)
      .map(([userId, userModel]) => this.putUser(userId, userModel))
  }

  async putUser(userId: string, userModel: IUserModel) {
    this.removeUser(userId)
    const roomUser = new RoomUser(userModel, this)
    this.users.set(userId, roomUser)
    await this.addUserSprite(roomUser)
  }

  moveUser(userId: string, userModel: IUserModel) {
    const user = this.users.get(userId)
    if (!user) return
    user.moveTo(new IsoPoint(userModel.x, userModel.y, userModel.z))
  }

  removeUser(userId: string) {
    const user = this.users.get(userId)
    if (!user) return
    user.destroy()
    if (user.container) this.container.removeChild(user.container)
    this.users.delete(userId)
  }

  requestWalk(x: number, y: number) {
    this.onWalk(x, y)
  }

  updateUsersZIndex() {
    this.users.forEach(roomUser => {
      if (!roomUser.container) return;
      roomUser.container.zIndex = this.calcZIndex(roomUser.iso, PRIORITY.USER)
    })
  }

  tick(delta: number) {
    this.updateUsersZIndex()
  }

  private async addUserSprite(roomUser: RoomUser) {
    await roomUser.initSprite()
    if (this.users.get(roomUser.model.id) !== roomUser) {
      roomUser.destroy()
      return
    }
    roomUser.setPosition(roomUser.iso)
    this.container.addChild(roomUser.container)
  }

  private renderWalls(roomModel: RoomModel) {
    this.wallRenderer = new WallRenderer(this)
    this.wallRenderer.spawn = roomModel.door
    this.wallRenderer.renderWalls()
  }

  private renderFloor() {
    this.floorRenderer = new FloorRenderer(this)
    this.floorRenderer.renderFloor()
  }

  async init(roomModel: RoomModel) {
    this.container = new Container()
    this.heightmap = roomModel.heightmap
    this.currentUserId = roomModel.currentUserId
    this.onWalk = roomModel.onWalk
    this.container.sortableChildren = true
    this.renderWalls(roomModel)
    this.renderFloor()

    await Promise.all(this.putUsers(roomModel.roomUserDictionary))

    this.putFurni()
    this.container.sortChildren()
  }
}
