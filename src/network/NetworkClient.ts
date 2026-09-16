import { IUserModel } from '../game/users/types'

export interface HotelRoom {
  id: string
  name: string
  description: string
  heightmap: string
  usersCount: number
}

export interface RoomStatePayload {
  room: HotelRoom
  selfId: string
  users: IUserModel[]
}

type Handler<T = any> = (data: T) => void

class NetworkClient {
  user: IUserModel = null
  roomId: string = null
  roomState: RoomStatePayload = null
  private socket: WebSocket = null
  private connecting: Promise<void> = null
  private handlers = new Map<string, Set<Handler>>()
  private reconnectTimer: number = null
  private reconnectDelay = 1000
  private reconnect = false

  private get apiBase() {
    return ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? `http://${window.location.hostname}:3000`
      : 'https://habbo-api.pieslibres.org'
  }

  on<T = any>(type: string, handler: Handler<T>) {
    const handlers = this.handlers.get(type) || new Set()
    handlers.add(handler)
    this.handlers.set(type, handlers)
    return () => handlers.delete(handler)
  }

  private emit(type: string, data: any) {
    const handlers = this.handlers.get(type)
    if (handlers) handlers.forEach(handler => handler(data))
  }

  private async request(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) }
    if (init.body) headers['Content-Type'] = 'application/json'
    const response = await fetch(`${this.apiBase}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    })
    const body = response.status === 204 ? null : await response.json()
    if (!response.ok) throw new Error(body?.error || 'request_failed')
    return body
  }

  async createGuest(nickname: string) {
    const { user } = await this.request('/sessions/guest', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    })
    this.user = user
    await this.connect()
    return user
  }

  async restoreGuest() {
    let body
    try {
      body = await this.request('/sessions/current')
    } catch (error) {
      if (error.message === 'unauthorized') return null
      throw error
    }
    if (!body) return null
    this.user = body.user
    await this.connect()
    return body.user
  }

  async listRooms(): Promise<HotelRoom[]> {
    const { rooms } = await this.request('/rooms')
    return rooms
  }

  async logout() {
    this.reconnect = false
    try {
      await this.request('/sessions/logout', { method: 'POST' })
    } catch (error) {
      this.reconnect = true
      throw error
    }
    window.clearTimeout(this.reconnectTimer)
    this.socket?.close(1000, 'logout')
    this.socket = null
    this.roomId = null
    this.roomState = null
    this.user = null
    this.emit('session:expired', {})
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve()
    if (this.connecting) return this.connecting
    this.reconnect = true
    const url = new URL(this.apiBase)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/game'

    this.connecting = new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url.toString())
      let opened = false
      this.socket = socket
      socket.addEventListener('open', () => {
        opened = true
        this.connecting = null
        this.reconnectDelay = 1000
        this.emit('connection', { connected: true })
        if (this.roomId) this.send('room:join', { roomId: this.roomId })
        resolve()
      })
      socket.addEventListener('message', event => {
        let message
        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }
        if (!message || typeof message.type !== 'string') return
        if (message.type === 'room:state') this.roomState = message.data
        if (message.type === 'session:ready') this.user = message.data.user
        this.emit(message.type, message.data)
      })
      socket.addEventListener('error', () => {
        if (!opened) {
          this.connecting = null
          reject(new Error('connection_failed'))
        }
      })
      socket.addEventListener('close', async () => {
        this.socket = null
        this.connecting = null
        this.emit('connection', { connected: false })
        if (!this.reconnect) return
        if (!opened) {
          try {
            const session = await this.request('/sessions/current')
            if (!session) {
              this.reconnect = false
              this.roomId = null
              this.roomState = null
              this.user = null
              this.emit('session:expired', {})
              return
            }
          } catch (error) {
            this.emit('connection:error', { error })
          }
        }
        window.clearTimeout(this.reconnectTimer)
        this.reconnectTimer = window.setTimeout(() => {
          this.connect().catch(() => undefined)
        }, this.reconnectDelay)
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 5000)
      })
    })
    return this.connecting
  }

  joinRoom(roomId: string) {
    this.roomId = roomId
    this.send('room:join', { roomId })
  }

  walk(x: number, y: number) {
    this.send('user:walk', { x, y })
  }

  speak(text: string) {
    this.send('user:speak', { text })
  }

  private send(type: string, data: object) {
    if (this.socket?.readyState !== WebSocket.OPEN) throw new Error('not_connected')
    this.socket.send(JSON.stringify({ type, data }))
  }
}

export const hotelNetwork = new NetworkClient()