import * as PIXI from 'pixi.js'
import { install } from '@pixi/unsafe-eval'

install(PIXI)
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
window.PIXI = PIXI