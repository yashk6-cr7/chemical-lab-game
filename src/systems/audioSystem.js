let ctx = null
let masterGain = null
let effectsGain = null
let ambientGain = null

export function initAudio() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  
  effectsGain = ctx.createGain()
  effectsGain.connect(masterGain)
  
  ambientGain = ctx.createGain()
  ambientGain.connect(masterGain)
}

export function setVolumes({ master, effects, ambient }) {
  if (!ctx) return
  masterGain.gain.setTargetAtTime(master, ctx.currentTime, 0.05)
  effectsGain.gain.setTargetAtTime(effects, ctx.currentTime, 0.05)
  ambientGain.gain.setTargetAtTime(ambient, ctx.currentTime, 0.05)
}

export function resumeAudio() {
  if (ctx?.state === 'suspended') {
    ctx.resume()
  }
}

// ---------------------------------------------------------
// Ambient Sounds
// ---------------------------------------------------------
let ambientStarted = false

export function startAmbient() {
  if (!ctx || ambientStarted) return
  ambientStarted = true

  // HVAC hum: 60Hz fundamental + harmonics
  const frequencies = [60, 120, 180, 240]
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.value = 0.015 / (i + 1) // harmonics fade
    osc.connect(gain)
    gain.connect(ambientGain)
    osc.start()
  })

  // Distant clock tick every 1 second
  const tick = () => {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.value = 1200
    g.gain.setValueAtTime(0.03, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    osc.connect(g)
    g.connect(ambientGain)
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }
  setInterval(tick, 1000)
}

// ---------------------------------------------------------
// Effect Sounds
// ---------------------------------------------------------

export function playBubbling(intensity = 5) {
  if (!ctx) return
  const count = Math.floor(intensity * 1.5)
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(300 + Math.random() * 400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600 + Math.random() * 300, ctx.currentTime + 0.08)

      filter.type = 'bandpass'
      filter.frequency.value = 800
      filter.Q.value = 2

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(effectsGain)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    }, i * (120 - intensity * 8))
  }
}

let fireNode = null
let fireGain = null

export function startFire(intensity = 5) {
  if (!ctx || fireNode) return
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3
  }
  fireNode = ctx.createBufferSource()
  fireNode.buffer = buffer
  fireNode.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 200 + intensity * 30
  filter.Q.value = 0.8

  fireGain = ctx.createGain()
  fireGain.gain.setValueAtTime(0, ctx.currentTime)
  fireGain.gain.linearRampToValueAtTime(0.15 + intensity * 0.02, ctx.currentTime + 0.5)

  fireNode.connect(filter)
  filter.connect(fireGain)
  fireGain.connect(effectsGain)
  fireNode.start()
}

export function stopFire() {
  if (!fireGain || !fireNode) return
  fireGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0)
  const fn = fireNode
  const fg = fireGain
  setTimeout(() => { 
    try { fn?.stop() } catch(e){} 
    fn?.disconnect()
    fg?.disconnect()
  }, 1100)
  fireNode = null
  fireGain = null
}

export function setFireIntensity(intensity) {
  if (!fireGain) return
  fireGain.gain.setTargetAtTime(0.15 + intensity * 0.02, ctx.currentTime, 0.3)
}

export function playGlassClink() {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3)
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
  osc.connect(gain)
  gain.connect(effectsGain)
  osc.start()
  osc.stop(ctx.currentTime + 0.45)
}

export function playPour(volume = 5) {
  if (!ctx) return
  const bufferSize = ctx.sampleRate * 0.5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15
  const src = ctx.createBufferSource()
  src.buffer = buffer
  
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 400 + volume * 40
  
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45)
  
  src.connect(filter)
  filter.connect(gain)
  gain.connect(effectsGain)
  src.start()
}

export function playHiss(duration = 2.0) {
  if (!ctx) return
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 3000
  filter.Q.value = 1.5
  
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.2)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  
  src.connect(filter)
  filter.connect(gain)
  gain.connect(effectsGain)
  src.start()
  src.stop(ctx.currentTime + duration + 0.1)
}

export function playSizzle() {
  if (!ctx) return
  const bufferSize = ctx.sampleRate * 1.2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3)) * 0.4
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 2000
  
  const gain = ctx.createGain()
  gain.gain.value = 0.2
  
  src.connect(filter)
  filter.connect(gain)
  gain.connect(effectsGain)
  src.start()
}

let alarmNode = null
let alarmGain = null

export function startSmokeAlarm() {
  if (!ctx || alarmNode) return
  alarmNode = ctx.createOscillator()
  alarmGain = ctx.createGain()
  alarmNode.type = 'square'
  
  // Alternating 880/1100 Hz every 0.5s
  const beep = () => {
    if (!alarmNode) return
    alarmNode.frequency.setValueAtTime(880, ctx.currentTime)
    alarmNode.frequency.setValueAtTime(1100, ctx.currentTime + 0.5)
  }
  beep()
  const interval = setInterval(beep, 1000)
  alarmNode._interval = interval
  
  alarmGain.gain.value = 0.15
  alarmNode.connect(alarmGain)
  alarmGain.connect(effectsGain)
  alarmNode.start()
}

export function stopSmokeAlarm() {
  if (!alarmNode) return
  clearInterval(alarmNode._interval)
  try { alarmNode.stop() } catch(e){}
  alarmNode.disconnect()
  alarmGain?.disconnect()
  alarmNode = null
  alarmGain = null
}
