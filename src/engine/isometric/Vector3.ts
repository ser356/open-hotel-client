import * as PIXI from 'pixi.js'
import { IsometricUtils } from './IsometricUtils'
import { Vector3Interface } from './IVector3'

export interface IsoPointObject {
  x: number
  y: number
  z: number
}
export type IsoPointLike = Vector3 | IsoPointObject | [number, number, number]

export class Vector3 implements Vector3Interface {
  declare x: number
  declare y: number
  declare z: number
  protected _x: number
  protected _y: number
  protected _z: number

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    Object.defineProperties(this, {
      _x: { configurable: true, writable: true, value: x },
      _y: { configurable: true, writable: true, value: y },
      _z: { configurable: true, writable: true, value: z },
      x: {
        configurable: true,
        enumerable: true,
        get: () => this._x,
        set: (value: number) => { this._x = value },
      },
      y: {
        configurable: true,
        enumerable: true,
        get: () => this._y,
        set: (value: number) => { this._y = value },
      },
      z: {
        configurable: true,
        enumerable: true,
        get: () => this._z,
        set: (value: number) => { this._z = value },
      },
    })
  }

  static from(point: IsoPointLike | PIXI.Point, copy = true): Vector3 {
    if (point instanceof Vector3) return copy ? point.clone() : point
    if (Array.isArray(point)) return new Vector3(point[0], point[1], point[2])
  }

  add(point: Vector3Interface): Vector3 {
    return new Vector3(this.x + point.x, this.y + point.y, this.z + point.z)
  }
  scale(point: Vector3Interface): Vector3 {
    return new Vector3(this.x * point.x, this.y * point.y, this.z * point.z)
  }

  set(x: number, y: number, z: number): Vector3 {
    this.x = x
    this.y = y
    this.z = z

    return this
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z)
  }

  copyTo(point: Vector3Interface): Vector3Interface {
    return point.set(this.x, this.y, this.z)
  }

  toVector2(): PIXI.Point {
    return IsometricUtils.cartToIso(this.x, this.y, this.z)
  }

  equal(point: Vector3Interface): boolean {
    return this.x === point.x && this.y === point.y && this.z === point.z
  }
}
