const fs = require('fs')

for (const file of ['pixel.common.js', 'pixel.umd.js', 'pixel.umd.min.js']) {
  const path = `node_modules/@open-hotel/pixel/dist/${file}`
  const source = fs.readFileSync(path, 'utf8')
  const patched = source.replace(/\.path\.some/g, '.composedPath().some')
  if (source === patched && !source.includes('.composedPath().some')) throw new Error(`Pixel patch failed: ${file}`)
  fs.writeFileSync(path, patched)
}