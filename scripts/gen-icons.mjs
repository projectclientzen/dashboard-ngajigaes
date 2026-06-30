// Script: generate PWA icons (192x192 dan 512x512) sebagai PNG
// Jalankan: node scripts/gen-icons.mjs
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.18 // border radius

  // Background rounded rect #7E997B
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#7E997B'
  ctx.fill()

  // Letter "N" in cream
  ctx.fillStyle = '#FCF8EC'
  ctx.font = `bold ${size * 0.58}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', size / 2, size / 2 + size * 0.03)

  return canvas.toBuffer('image/png')
}

for (const size of [192, 512]) {
  const buf = drawIcon(size)
  const file = join(outDir, `icon-${size}x${size}.png`)
  writeFileSync(file, buf)
  console.log(`✓ ${file}`)
}
console.log('Icons generated!')
