// Pet Widget - standalone embeddable script
// Usage: include this script on any page and call PetWidget.init({ color: '#d5a74a' })
(function () {
  if (window.PetWidget) return

  function $(t, attrs = {}, parent) {
    const el = document.createElement(t)
    for (const k in attrs) el.setAttribute(k, attrs[k])
    if (parent) parent.appendChild(el)
    return el
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

  function parseHex(hex, fallback) {
    try {
      const c = hex.replace('#', '')
      if (c.length === 3) return c.split('').map(ch => parseInt(ch + ch, 16))
      if (c.length === 6) return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)]
    } catch (e) {}
    return fallback
  }

  function makeGradient(ctx, x, y, r, color) {
    const cols = parseHex(color, [197,160,74])
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.35, `rgba(${cols.join(',')},0.98)`)
    g.addColorStop(1, `rgba(${Math.max(0,cols[0]-40)},${Math.max(0,cols[1]-30)},${Math.max(0,cols[2]-20)},0.95)`)
    return g
  }

  function extractPageMetadata() {
    const title = document.title || ''
    const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') || document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
    const h1 = Array.from(document.querySelectorAll('h1')).map(n => n.textContent?.trim()).find(Boolean) || ''
    return { title: title.trim(), description: (meta || '').trim(), h1 }
  }

  function renderPet(ctx, x, y, scale, color, state) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    // body
    const r = 36
    ctx.beginPath()
    ctx.ellipse(0, 4, r, r * 0.9, 0, 0, Math.PI * 2)
    ctx.fillStyle = makeGradient(ctx, 0, 4, r, color)
    ctx.fill()

    // subtle rim
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'
    ctx.lineWidth = 2
    ctx.stroke()

    // ears
    ctx.fillStyle = `rgba(255,255,255,0.9)`
    ctx.beginPath(); ctx.ellipse(-22, -26, 14, 18, -0.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(22, -26, 14, 18, 0.4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = makeGradient(ctx, -12, -18, 8, color)
    ctx.beginPath(); ctx.ellipse(-22, -26, 11, 13, -0.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(22, -26, 11, 13, 0.4, 0, Math.PI * 2); ctx.fill()

    // face plate shadow
    ctx.beginPath(); ctx.ellipse(0, -2, 26, 20, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    ctx.fill()

    // eyes
    ctx.fillStyle = '#070707'
    const eyeY = -6
    ctx.beginPath(); ctx.ellipse(-10, eyeY, 6, 8, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(10, eyeY, 6, 8, 0, 0, Math.PI * 2); ctx.fill()
    // eye sparkle
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath(); ctx.ellipse(-8, eyeY-2, 2.2, 2.8, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(12, eyeY-2, 1.8, 2.2, 0, 0, Math.PI * 2); ctx.fill()

    // mouth (changes by state)
    ctx.strokeStyle = 'rgba(40,26,15,0.9)'
    ctx.lineWidth = 3
    ctx.beginPath()
    if (state === 'talk') {
      ctx.arc(0, 6, 9, 0, Math.PI)
    } else if (state === 'sit') {
      ctx.arc(0, 8, 6, 0, Math.PI)
    } else if (state === 'walk') {
      ctx.moveTo(-7, 8); ctx.lineTo(7, 6)
    } else {
      ctx.arc(0, 6, 8, 0, Math.PI)
    }
    ctx.stroke()

    ctx.restore()
  }

  function createSpeechBubble(text, color) {
    const b = document.createElement('div')
    b.className = 'pet-speech-bubble'
    b.style.position = 'fixed'
    b.style.pointerEvents = 'none'
    b.style.maxWidth = '260px'
    b.style.padding = '8px 10px'
    b.style.background = 'rgba(10,10,10,0.86)'
    b.style.color = '#fff'
    b.style.fontSize = '12px'
    b.style.lineHeight = '1.3'
    b.style.borderRadius = '10px'
    b.style.border = `1px solid rgba(255,255,255,0.06)`
    b.style.boxShadow = '0 8px 22px rgba(0,0,0,0.45)'
    b.innerText = text
    document.body.appendChild(b)
    return b
  }

  function setupStyles() {
    if (document.getElementById('pet-widget-styles')) return
    const s = document.createElement('style')
    s.id = 'pet-widget-styles'
    s.textContent = `
.pet-widget-canvas{position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;pointer-events:none}
.pet-speech-bubble{z-index:2147483648}
`;
    document.head.appendChild(s)
  }

  function Pet() {
    this.color = '#d5a74a'
    this.state = 'idle'
    this.scale = 1
    this.x = 120
    this.y = 120
    this.vx = 0
    this.vy = 0
    this.target = null
  }

  Pet.prototype.stepAI = function () {
    // small FSM behavior selection handled externally via widget tick
    if (this.state === 'walk' && this.target) {
      const dx = this.target.x - this.x
      const dy = this.target.y - this.y
      const d = Math.hypot(dx, dy)
      if (d < 3) { this.target = null; this.state = 'idle'; this.vx = 0; this.vy = 0; return }
      const sp = 1.4
      this.vx = (dx / d) * sp
      this.vy = (dy / d) * sp
      this.x += this.vx
      this.y += this.vy
    } else {
      // idle drift slight
      this.vx *= 0.92; this.vy *= 0.92
      this.x += this.vx
      this.y += this.vy
    }
  }

  const API = {
    init(opts = {}) {
      if (API._ready) return API
      setupStyles()

      const optsSafe = Object.assign({ color: '#d5a74a', scale: 1 }, opts)
      const container = document.createElement('div')
      container.id = 'pet-widget-container'
      container.style.pointerEvents = 'none'
      container.style.position = 'fixed'
      container.style.left = '0'
      container.style.top = '0'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.zIndex = '2147483646'
      document.body.appendChild(container)

      const canvas = document.createElement('canvas')
      canvas.className = 'pet-widget-canvas'
      canvas.style.pointerEvents = 'none'
      container.appendChild(canvas)
      const ctx = canvas.getContext('2d')

      let dpr = Math.max(1, window.devicePixelRatio || 1)
      function resize() {
        dpr = Math.max(1, window.devicePixelRatio || 1)
        canvas.width = Math.floor(window.innerWidth * dpr)
        canvas.height = Math.floor(window.innerHeight * dpr)
        canvas.style.width = window.innerWidth + 'px'
        canvas.style.height = window.innerHeight + 'px'
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      resize()
      window.addEventListener('resize', resize)

      const pet = new Pet()
      pet.color = optsSafe.color || pet.color
      pet.scale = optsSafe.scale || 1
      pet.x = Math.max(80, Math.min(window.innerWidth - 80, window.innerWidth * 0.85))
      pet.y = Math.max(80, Math.min(window.innerHeight - 80, window.innerHeight * 0.85))

      let bubble = null

      let lastMeta = extractPageMetadata()

      function updateBubbleForState() {
        if (bubble) bubble.remove(); bubble = null
        if (pet.state === 'talk') {
          const meta = extractPageMetadata()
          const summary = meta.description ? `${meta.title || meta.h1}: ${meta.description.slice(0, 120)}` : meta.h1 || meta.title || 'Hello from BHS Skales'
          bubble = createSpeechBubble(summary, pet.color)
        }
      }

      let lastSwitch = 0
      let raf = 0
      let running = true

      function pickTarget() {
        const tx = Math.random() * (window.innerWidth - 160) + 80
        const ty = Math.random() * (window.innerHeight - 160) + 80
        pet.target = { x: tx, y: ty }
      }

      function tick(now) {
        if (!running) return
        // state machine ticker
        if (!lastSwitch || now - lastSwitch > 2600) {
          lastSwitch = now
          const r = Math.random()
          if (r < 0.45) pet.state = 'idle'
          else if (r < 0.7) { pet.state = 'walk'; pickTarget() }
          else if (r < 0.86) pet.state = 'sit'
          else pet.state = 'talk'
          updateBubbleForState()
        }

        pet.stepAI()

        // bounds guard
        pet.x = clamp(pet.x, 48, window.innerWidth - 48)
        pet.y = clamp(pet.y, 48, window.innerHeight - 48)

        // render
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        renderPet(ctx, pet.x, pet.y, pet.scale, pet.color, pet.state)

        // position bubble
        if (bubble) {
          const bx = clamp(pet.x + 60, 8, window.innerWidth - 8)
          const by = clamp(pet.y - 60, 8, window.innerHeight - 8)
          bubble.style.left = bx + 'px'
          bubble.style.top = by + 'px'
          bubble.style.transform = 'translate(-50%, -100%)'
        }

        raf = requestAnimationFrame(tick)
      }

      raf = requestAnimationFrame(tick)

      API._ready = true

      API.setColor = function (hex) { pet.color = hex; return API }
      API.start = function () { if (!running) { running = true; raf = requestAnimationFrame(tick) }; return API }
      API.stop = function () { running = false; if (raf) cancelAnimationFrame(raf); if (bubble) { bubble.remove(); bubble = null } return API }
      API.destroy = function () { API.stop(); window.removeEventListener('resize', resize); container.remove(); API._ready = false; delete window.PetWidget; return null }
      API.getMetadata = extractPageMetadata

      // expose minimal controls on element for debugging if developer opens console
      container.__pet = pet
      container.__api = API

      // auto-start note
      return API
    },
  }

  window.PetWidget = API
})()
