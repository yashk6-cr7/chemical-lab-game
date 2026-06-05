import * as THREE from 'three'

/**
 * textureAtlas.js — builds a single 512x512 canvas texture atlas at startup.
 * All particle systems read UV coordinates from this single atlas.
 * performance.md: single texture bind for all particle effects (massive GPU win)
 */

// Slot dimensions within the 512x512 atlas (4x4 grid of 128px slots)
const SLOT = 128

function slotUV(col, row) {
  // Returns [u0, v0, u1, v1] in 0-1 space
  const s = SLOT / 512
  return [col * s, row * s, (col + 1) * s, (row + 1) * s]
}

function drawSoftCircle(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.addColorStop(0,   color.replace(')', ', 1)').replace('rgb', 'rgba'))
  g.addColorStop(0.5, color.replace(')', ', 0.5)').replace('rgb', 'rgba'))
  g.addColorStop(1,   color.replace(')', ', 0)').replace('rgb', 'rgba'))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawFireSprite(ctx, cx, cy, r, color) {
  // Teardrop shape by combining ellipse + triangle
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.addColorStop(0,   'rgba(255,255,220,1)')
  g.addColorStop(0.4, color.replace(')', ',0.8)').replace('rgb','rgba'))
  g.addColorStop(1,   color.replace(')', ',0)').replace('rgb','rgba'))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy + r * 0.2, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawSoftEllipse(ctx, cx, cy, rx, ry, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
  g.addColorStop(0,   color.replace(')', ',0.8)').replace('rgb','rgba'))
  g.addColorStop(0.6, color.replace(')', ',0.3)').replace('rgb','rgba'))
  g.addColorStop(1,   color.replace(')', ',0)').replace('rgb','rgba'))
  ctx.fillStyle = g
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(rx / ry, 1)
  ctx.beginPath()
  ctx.arc(0, 0, ry, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

let _atlasCache = null

export function buildTextureAtlas() {
  if (_atlasCache) return _atlasCache

  const canvas = document.createElement('canvas')
  canvas.width  = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 512, 512)

  const C = SLOT / 2  // center of each slot

  // Row 0 — common particles
  drawSoftCircle(ctx,  C + 0*SLOT, C + 0*SLOT, 56, 'rgb(255,255,255)')  // bubble / general
  drawSoftEllipse(ctx, C + 1*SLOT, C + 0*SLOT, 38, 58, 'rgb(220,230,255)')  // steam wisp
  drawSoftCircle(ctx,  C + 2*SLOT, C + 0*SLOT, 52, 'rgb(160,160,160)')  // smoke puff
  drawSoftCircle(ctx,  C + 3*SLOT, C + 0*SLOT, 24, 'rgb(200,240,255)')  // small bubble

  // Row 1 — fire
  drawFireSprite(ctx,  C + 0*SLOT, C + 1*SLOT, 42, 'rgb(255,255,180)')  // fire core
  drawFireSprite(ctx,  C + 1*SLOT, C + 1*SLOT, 48, 'rgb(255,100,0)')    // fire mid
  drawFireSprite(ctx,  C + 2*SLOT, C + 1*SLOT, 52, 'rgb(180,30,0)')     // fire outer
  drawSoftCircle(ctx,  C + 3*SLOT, C + 1*SLOT, 14, 'rgb(255,220,50)')   // spark

  // Row 2 — chemical/special
  drawSoftCircle(ctx,  C + 0*SLOT, C + 2*SLOT, 44, 'rgb(100,180,255)')  // water drop
  drawSoftCircle(ctx,  C + 1*SLOT, C + 2*SLOT, 40, 'rgb(180,255,120)')  // foam
  drawSoftEllipse(ctx, C + 2*SLOT, C + 2*SLOT, 30, 50, 'rgb(255,255,255)') // vapor
  drawSoftCircle(ctx,  C + 3*SLOT, C + 2*SLOT, 20, 'rgb(255,80,80)')    // acid drop

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  // UV lookup table — [u0, v0, u1, v1]
  const UVS = {
    bubble:    slotUV(0, 0),
    steam:     slotUV(1, 0),
    smoke:     slotUV(2, 0),
    smallBubble: slotUV(3, 0),
    fireCore:  slotUV(0, 1),
    fireMid:   slotUV(1, 1),
    fireOuter: slotUV(2, 1),
    spark:     slotUV(3, 1),
    waterDrop: slotUV(0, 2),
    foam:      slotUV(1, 2),
    vapor:     slotUV(2, 2),
    acidDrop:  slotUV(3, 2),
  }

  _atlasCache = { texture, UVS }
  return _atlasCache
}

export function disposeAtlas() {
  if (_atlasCache) {
    _atlasCache.texture.dispose()
    _atlasCache = null
  }
}
