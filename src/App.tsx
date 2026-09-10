import { useState, useEffect, useRef, useCallback } from 'react'
import { useCart } from '@/context/CartContext'
import { Link } from 'react-router-dom'
import logoDark from '@/imports/SEWA_S__3_-1.png'
import { supabase, getImageUrl, getSalePrice, type Product } from '@/lib/supabase'

const NAV_LINKS = ['Arrivals', 'Collection', 'About', 'Contact']

const STATUS_BADGE: Record<string, string> = {
  'CLEARED':  'clay-green',
  'NEW IN':   'clay-gold',
  'LIMITED':  'clay-purple',
  'SOLD OUT': 'clay-red',
  'INCOMING': 'clay-gold',
  'RESERVED': 'clay-purple',
}

const FALLBACK_IMG: Record<string, string> = {
  Jewelry:  'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=300&fit=crop&auto=format',
  Bags:     'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop&auto=format',
  Shoes:    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=300&fit=crop&auto=format',
  Shades:   'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop&auto=format',
  Clothing: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format',
}

const CATEGORIES = [
  { name: 'Jewelry',  sub: 'Cuffs · Chains · Rings',        img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop&auto=format' },
  { name: 'Bags',     sub: 'Totes · Clutches · Crossbody',  img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=400&fit=crop&auto=format' },
  { name: 'Shoes',    sub: 'Heels · Flats · Boots',          img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop&auto=format' },
  { name: 'Shades',   sub: 'Wraparound · Cat-Eye · Aviator', img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=400&fit=crop&auto=format' },
  { name: 'Clothing', sub: 'Sets · Dresses · Tailoring',     img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop&auto=format' },
]

const TESTIMONIALS = [
  { name: 'Temi A.',    location: 'Lekki',            rating: 5, text: "The leather tote I got from BHS Skales is the most complimented thing I own. Quality that speaks for itself — zero customs stress." },
  { name: 'Chisom O.', location: 'Ikoyi',             rating: 5, text: "I've been ordering from BHS Skales for two years. Dubai gold that arrives perfect, prices that make sense. They know their craft." },
  { name: 'Adaeze K.', location: 'Victoria Island',   rating: 5, text: "The Milan shoes arrived in immaculate condition. BHS Skales is the only curated import house I trust in Lagos." },
]

const CITIES = ['Dubai', 'Milan', 'Istanbul', 'Paris', 'Lagos']

const STATS = [
  { value: 4,   suffix: '',  label: 'Source Cities' },
  { value: 500, suffix: '+', label: 'Pieces Cleared' },
  { value: 3,   suffix: '+', label: 'Years Trading' },
  { value: 98,  suffix: '%', label: 'Satisfaction Rate' },
]

/* ── useReveal ──────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return ref
}

/* ── useCounter: animated number count-up ──────────────── */
function useCounter(target: number, duration = 1600) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(tick)
      else setCount(target)
    }
    requestAnimationFrame(tick)
  }, [started, target, duration])
  return { count, ref }
}

/* ── GoldParticles: floating embers ────────────────────── */
function GoldParticles({ count = 22 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 2.8 + 0.5,
      left: Math.random() * 100,
      delay: Math.random() * 14,
      dur: Math.random() * 8 + 10,
      dx: (Math.random() - 0.5) * 130,
      color: ['rgba(240,204,106,1)', 'rgba(201,168,76,1)', 'rgba(255,220,130,0.9)', 'rgba(180,140,55,0.8)'][i % 4],
    }))
  ).current
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: '-8px', left: `${p.left}%`,
          width: `${p.size}px`, height: `${p.size}px`,
          background: p.color, borderRadius: '50%',
          boxShadow: `0 0 ${p.size * 5}px ${p.color}`,
          '--pdx': `${p.dx}px`,
          animation: `ember-rise ${p.dur}s ${p.delay}s ease-out infinite`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

/* ── FloatingOrbs: large ambient color blobs ────────────── */
function FloatingOrbs() {
  const orbs = [
    { size: 500, x: '5%',  y: '15%', color: 'rgba(201,168,76,0.045)', delay: '0s',  dur: '20s' },
    { size: 400, x: '68%', y: '8%',  color: 'rgba(110,45,175,0.05)',  delay: '6s',  dur: '24s' },
    { size: 360, x: '50%', y: '60%', color: 'rgba(25,115,95,0.04)',   delay: '12s', dur: '18s' },
    { size: 300, x: '82%', y: '52%', color: 'rgba(201,168,76,0.035)', delay: '3s',  dur: '22s' },
    { size: 280, x: '22%', y: '75%', color: 'rgba(150,80,20,0.04)',   delay: '9s',  dur: '16s' },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <div key={i} style={{
          position: 'absolute', left: orb.x, top: orb.y,
          width: orb.size, height: orb.size,
          background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(50px)',
          animation: `orb-drift ${orb.dur} ${orb.delay} ease-in-out infinite`,
          willChange: 'transform',
        }} />
      ))}
    </div>
  )
}

/* ── CursorGlow: soft gold spotlight follows cursor ─────── */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -400, y: -400 })
  const raf = useRef(0)
  const cur = useRef({ x: -400, y: -400 })
  useEffect(() => {
    const onMove = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove, { passive: true })
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const animate = () => {
      cur.current.x = lerp(cur.current.x, pos.current.x, 0.1)
      cur.current.y = lerp(cur.current.y, pos.current.y, 0.1)
      if (ref.current) {
        ref.current.style.left = `${cur.current.x}px`
        ref.current.style.top  = `${cur.current.y}px`
      }
      raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current) }
  }, [])
  return (
    <div ref={ref} style={{
      position: 'fixed', pointerEvents: 'none', zIndex: 9998,
      width: '500px', height: '500px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(201,168,76,0.055) 0%, rgba(201,168,76,0.018) 45%, transparent 70%)',
      transform: 'translate(-50%, -50%)',
      mixBlendMode: 'screen',
      willChange: 'left, top',
    }} />
  )
}

/* ── ScrollProgress: animated gold bar at page top ─────── */
function ScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      setPct(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="scroll-bar" style={{ width: `${pct}%` }} />
  )
}

/* ── CityMarquee: source city ticker ───────────────────── */
function CityMarquee() {
  const ITEMS = [
    { city: 'Dubai', detail: 'Gold Souk' }, { city: 'Milan', detail: 'Via Montenapoleone' },
    { city: 'Istanbul', detail: 'Grand Bazaar' }, { city: 'Paris', detail: 'Rue du Faubourg' },
    { city: 'Lagos', detail: 'Import Cleared' },
  ]
  const all = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS]
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(201,168,76,0.1)', borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0.8rem 0' }}>
      <div className="marquee-track">
        {all.map((item, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.22em',
            textTransform: 'uppercase', marginRight: '2.5rem',
            color: i % 2 === 0 ? '#c9a84c' : 'rgba(245,242,235,0.28)',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          }}>
            {item.city}
            {i % 2 === 0 && <span style={{ color: 'rgba(201,168,76,0.38)', fontSize: '0.52rem', letterSpacing: '0.1em' }}>{item.detail}</span>}
            <span style={{ marginLeft: '0.4rem', color: 'rgba(201,168,76,0.2)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── MorphBlob ──────────────────────────────────────────── */
function MorphBlob({ size = 340, color = 'rgba(201,168,76,0.06)', delay = '0s' }: { size?: number; color?: string; delay?: string }) {
  return (
    <div style={{
      width: size, height: size, background: color,
      animation: `morph 14s ${delay} ease-in-out infinite`,
      pointerEvents: 'none', filter: 'blur(1px)',
    }} />
  )
}

/* ── AnimatedRule: gold divider that draws in on scroll ── */
function AnimatedRule({ style }: { style?: React.CSSProperties }) {
  const ref = useReveal(0.3)
  return <div ref={ref} className="animated-rule" style={style} />
}

/* ── StatCounter: number that counts up on scroll ──────── */
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value, 1800)
  return (
    <div ref={ref} className="stat-card" style={{
      textAlign: 'center', padding: '2rem 1.5rem',
      borderRight: '1px solid rgba(201,168,76,0.08)',
    }}>
      <div style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
        fontWeight: 400, color: '#c9a84c', lineHeight: 1, marginBottom: '0.5rem',
        textShadow: '0 0 40px rgba(201,168,76,0.25)',
      }}>
        {count}{suffix}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(245,242,235,0.38)' }}>
        {label}
      </div>
    </div>
  )
}

/* ── KineticTitle: word-by-word stagger reveal ──────────── */
function KineticTitle({ lines }: { lines: Array<{ text: string; gold?: boolean; italic?: boolean }> }) {
  const ref = useReveal(0.05)
  let wordIndex = 0
  return (
    <div ref={ref} className="kinetic-title">
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.text.split(' ').map((word, wi) => {
            const cls = `kinetic-word kd${Math.min(++wordIndex, 8)}`
            return (
              <span key={wi} className={cls} style={{
                marginRight: '0.28em',
                ...(line.italic ? { fontStyle: 'italic' } : {}),
                ...(line.gold ? { color: '#c9a84c' } : {}),
              }}>{word}</span>
            )
          })}
        </span>
      ))}
    </div>
  )
}

/* ── WhatsAppFloat: fixed pulsing button ────────────────── */
function WhatsAppFloat() {
  return (
    <a href="https://wa.me/2347045207918?text=Hello%2C%20I%20would%20like%20to%20place%20an%20order" style={{
      position: 'fixed', bottom: '4.5rem', right: '2rem', zIndex: 9999,
      width: '54px', height: '54px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #25D366, #128C7E)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.35rem', textDecoration: 'none',
      boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'scale(1.12)'; el.style.boxShadow = '0 6px 30px rgba(37,211,102,0.6)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 4px 20px rgba(37,211,102,0.4)' }}
    >
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(37,211,102,0.5)', animation: 'ring-expand 2s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(37,211,102,0.35)', animation: 'ring-expand 2s 0.75s ease-out infinite' }} />
      💬
    </a>
  )
}

/* ── RevealBlock ────────────────────────────────────────── */
function RevealBlock({ children, className = 'reveal', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useReveal()
  return <div ref={ref} className={className} style={style}>{children}</div>
}

const BRAND_VIDEO_URL = "https://efogrjhuqyzvgrahobto.supabase.co/storage/v1/object/sign/products/SHIN'S%20%20FASHION%20.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNThkNTUwZC1hMDQzLTQ5ZjItYmVmYy1iZjNhOGQ3ZDZhY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0cy9TSElOJ1MgIEZBU0hJT04gLm1wNCIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODU2OTM1NzMsImV4cCI6ODY1Nzg1NjA3MTczfQ.9_hlVcIhK3PXUN8Lc7fCuMSCGRO92g-zIplPoQNxlxg"

/* ── BrandVideoSection: cinematic with live HUD overlays ── */
function BrandVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [clock, setClock] = useState('00:00:00')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const replay = () => { v.currentTime = 0; v.play().catch(() => {}) }
    v.addEventListener('ended', replay)
    return () => v.removeEventListener('ended', replay)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setClock(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`)
      setTick(t => (t + 1) % 4)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const HUD_CORNER = ({ pos }: { pos: React.CSSProperties }) => (
    <div style={{
      position: 'absolute', ...pos, zIndex: 4,
      width: '22px', height: '22px',
      borderTop: 'top' in pos ? '1px solid rgba(201,168,76,0.4)' : 'none',
      borderBottom: 'bottom' in pos ? '1px solid rgba(201,168,76,0.4)' : 'none',
      borderLeft: ('left' in pos) ? '1px solid rgba(201,168,76,0.4)' : 'none',
      borderRight: ('right' in pos) ? '1px solid rgba(201,168,76,0.4)' : 'none',
    }} />
  )

  return (
    <section style={{ position: 'relative', background: '#0a0a08', overflow: 'hidden', height: '480px' }}>
      <video ref={videoRef} autoPlay loop muted playsInline preload="auto"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}>
        <source src={BRAND_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="grain-overlay" />
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.01) 2px, rgba(201,168,76,0.01) 4px)', pointerEvents: 'none' }} />
      {/* Border glow */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, border: '1px solid rgba(201,168,76,0.28)', pointerEvents: 'none', animation: 'border-glow 3s ease-in-out infinite' }} />
      {/* Vignettes */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to bottom, #0a0a08, transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to top, #0a0a08, transparent)', pointerEvents: 'none', zIndex: 2 }} />

      {/* HUD: top-left clock */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 4, fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', animation: 'hud-blink 4s infinite' }}>
        {clock} · LOS
      </div>

      {/* HUD: top-right manifest status */}
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 4, textAlign: 'right' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.52rem', color: 'rgba(201,168,76,0.4)', letterSpacing: '0.12em', marginBottom: '3px' }}>MANIFEST STATUS</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#c9a84c', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          <span style={{ width: '5px', height: '5px', background: '#4ade80', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite', flexShrink: 0 }} />
          ACTIVE{'·'.repeat(tick)}
        </div>
      </div>

      {/* HUD: bottom-right route */}
      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 4, fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', color: 'rgba(201,168,76,0.45)', letterSpacing: '0.12em', textAlign: 'right' }}>
        DXB → MXP → IST → CDG → LOS
      </div>

      {/* Corner marks */}
      <HUD_CORNER pos={{ top: '6%', left: '2%' }} />
      <HUD_CORNER pos={{ top: '6%', right: '2%' }} />
      <HUD_CORNER pos={{ bottom: '6%', left: '2%' }} />
      <HUD_CORNER pos={{ bottom: '6%', right: '2%' }} />

      {/* Live badge */}
      <div className="glass" style={{ position: 'absolute', bottom: '2rem', left: '2rem', padding: '0.6rem 1.2rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', zIndex: 4 }}>
        <span style={{ width: '6px', height: '6px', background: '#c9a84c', borderRadius: '50%', animation: 'pulse-dot 1.5s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#f5f2eb', letterSpacing: '0.12em', textTransform: 'uppercase' }}>BHS Skales — Live</span>
      </div>
    </section>
  )
}

/* ── MAIN APP ───────────────────────────────────────────── */
export default function App() {
  const [scrolled, setScrolled] = useState(false)
  const [activeNav, setActiveNav] = useState('Arrivals')
  const { cartItems, addToCart, cartOpen, setCartOpen } = useCart()
  const [latestArrivals, setLatestArrivals] = useState<Product[]>([])
  const [arrivalsLoading, setArrivalsLoading] = useState(true)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    supabase.from('products').select('*').eq('is_latest_arrival', true).order('updated_at', { ascending: false })
      .then(({ data }) => { setLatestArrivals(data ?? []); setArrivalsLoading(false) })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <main className="flex-1">

        {/* Global ambient layers */}
        <CursorGlow />
        <ScrollProgress />
        <div className="page-noise" />
        <WhatsAppFloat />

      {/* ── AURORA HERO ────────────────────────────────── */}
      <section ref={heroRef} id="arrivals" className="aurora-bg" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '0 2rem 5rem', position: 'relative', overflow: 'hidden',
      }}
        onMouseMove={e => {
          const rect = heroRef.current?.getBoundingClientRect()
          if (!rect) return
          setMouse({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 })
        }}
      >
        {/* Floating ambient orbs */}
        <FloatingOrbs />
        {/* Aurora canvas — parallax 1 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1,
          background: `
            radial-gradient(ellipse 70% 55% at 15% 45%, rgba(180,110,25,0.3) 0%, transparent 60%),
            radial-gradient(ellipse 55% 45% at 80% 20%, rgba(110,45,175,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 60% 45% at 60% 85%, rgba(25,115,95,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 45% 35% at 90% 65%, rgba(201,168,76,0.18) 0%, transparent 50%)
          `,
          transform: `translate(${mouse.x * -18}px, ${mouse.y * -12}px)`,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }} />
        {/* Morph blobs — parallax 1.5 */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', zIndex: 1, transform: `translate(${mouse.x * -28}px, ${mouse.y * -20}px)`, transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'none' }}>
          <MorphBlob size={320} color="rgba(201,168,76,0.055)" delay="0s" />
        </div>
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', zIndex: 1, transform: `translate(${mouse.x * 22}px, ${mouse.y * 16}px)`, transition: 'transform 1s cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'none' }}>
          <MorphBlob size={260} color="rgba(110,45,175,0.07)" delay="4s" />
        </div>
        {/* Hero photo — parallax 2 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2,
          backgroundImage: 'url(https://images.unsplash.com/photo-1445205170230-053b83016050?w=1800&h=1200&fit=crop&auto=format)',
          backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'brightness(0.28)',
          transform: `translate(${mouse.x * -10}px, ${mouse.y * -7}px)`,
          transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)',
        }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to top, #0a0a08 28%, transparent 65%)' }} />
        {/* Gold embers */}
        <GoldParticles count={26} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 4, maxWidth: '900px' }}>
          <RevealBlock className="reveal d1">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '5px', height: '5px', background: '#c9a84c', borderRadius: '50%', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
              Est. Lagos · Import Manifest Active
            </div>
          </RevealBlock>

          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', lineHeight: 1.05, fontWeight: 400, marginBottom: '1.5rem' }}>
            <KineticTitle lines={[
              { text: 'Sourced the world over.' },
              { text: 'Cleared for Lagos.', gold: true, italic: true },
            ]} />
          </h1>

          <RevealBlock className="reveal d3">
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(245,242,235,0.7)', maxWidth: '520px', marginBottom: '2.5rem' }}>
              A curated import house drawing from the finest fashion markets of Dubai, Milan, Istanbul, and Paris — delivered with precision to your door in Lagos.
            </p>
          </RevealBlock>

          <RevealBlock className="reveal d4">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/collection" style={{
                background: 'linear-gradient(135deg, #d4a942 0%, #f0cc6a 50%, #b8892e 100%)',
                color: '#0a0a08', padding: '0.9rem 2.2rem',
                fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', fontWeight: 700, borderRadius: '4px',
                boxShadow: '0 8px 24px rgba(201,168,76,0.4), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.25)',
                transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s',
                display: 'inline-block',
              }}
                onMouseMove={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  const { left, top, width, height } = el.getBoundingClientRect()
                  const dx = (e.clientX - left - width / 2) * 0.28
                  const dy = (e.clientY - top - height / 2) * 0.28
                  el.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`
                  el.style.boxShadow = '0 12px 32px rgba(201,168,76,0.55), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.25)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translate(0,0) scale(1)'
                  el.style.boxShadow = '0 8px 24px rgba(201,168,76,0.4), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.25)'
                }}>
                View Collection
              </Link>
              <a href="#about" className="glass-light" style={{
                color: '#f5f2eb', padding: '0.9rem 2.2rem',
                fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', fontWeight: 500, borderRadius: '4px',
                transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
                onMouseMove={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  const { left, top, width, height } = el.getBoundingClientRect()
                  el.style.transform = `translate(${(e.clientX - left - width / 2) * 0.25}px, ${(e.clientY - top - height / 2) * 0.25}px)`
                }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translate(0,0)' }}>
                Our Provenance
              </a>
            </div>
          </RevealBlock>
        </div>

        {/* City row */}
        <RevealBlock className="reveal d5">
          <div style={{ position: 'relative', zIndex: 4, marginTop: '4rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {CITIES.map((city, i) => (
              <div key={city} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#c9a84c' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,242,235,0.4)' }}>{city}</span>
              </div>
            ))}
          </div>
        </RevealBlock>
      </section>

      {/* ── STATS BAR ──────────────────────────────────── */}
      <div style={{ background: '#0c0c0a', borderTop: '1px solid rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ borderRight: i < 3 ? '1px solid rgba(201,168,76,0.08)' : 'none' }}>
              <StatCounter value={s.value} suffix={s.suffix} label={s.label} />
            </div>
          ))}
        </div>
      </div>

      {/* ── BRAND VIDEO ────────────────────────────────── */}
      <BrandVideoSection />

      {/* ── LATEST ARRIVALS GRID ───────────────────────── */}
      <section id="arrivals-grid" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <RevealBlock className="reveal">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Current Manifest · Live
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400 }}>
              Latest Arrivals
            </h2>
            <Link to="/collection" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a84c', textDecoration: 'none', borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: '2px', transition: 'border-color 0.2s' }}>
              Full Manifest →
            </Link>
          </div>
        </RevealBlock>

        <AnimatedRule style={{ marginBottom: '0' }} />

        {arrivalsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', background: 'rgba(201,168,76,0.08)', marginTop: '1px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: '#0a0a08' }}>
                <div style={{ aspectRatio: '4/3', background: 'linear-gradient(90deg, #1a1a17 25%, #222220 50%, #1a1a17 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ padding: '1rem' }}>
                  <div style={{ height: '10px', background: '#1a1a17', borderRadius: '2px', width: '55%', marginBottom: '8px' }} />
                  <div style={{ height: '8px', background: '#1a1a17', borderRadius: '2px', width: '35%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : latestArrivals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(201,168,76,0.12)', marginTop: '1px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#c9a84c', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>MANIFEST PENDING</div>
            <p style={{ color: 'rgba(245,242,235,0.4)', fontSize: '0.85rem' }}>New arrivals coming soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', background: 'rgba(201,168,76,0.1)', marginTop: '1px' }}>
            {latestArrivals.map(item => <ManifestCard key={item.id} item={item} />)}
          </div>
        )}
      </section>

      {/* ── CATEGORY SECTION ───────────────────────────── */}
      <AnimatedRule />
      <section id="collection" className="aurora-bg" style={{ padding: '6rem 2rem', background: '#0c0c0a', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          <RevealBlock className="reveal">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Five Departments
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, marginBottom: '3rem' }}>
              The Collection
            </h2>
          </RevealBlock>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {CATEGORIES.map((cat, i) => <CategoryTile key={cat.name} cat={cat} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── PROVENANCE SECTION ─────────────────────────── */}
      <AnimatedRule />
      <section id="about" className="texture-leather" style={{ padding: '7rem 2rem', background: '#0a0a08' }}>
        <CityMarquee />
        <div style={{ maxWidth: '1100px', margin: '4rem auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
          <RevealBlock className="slide-left">
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Provenance &amp; Origin
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 400, marginBottom: '1.5rem', lineHeight: 1.15 }}>
                Every piece personally<br />inspected before it<br />reaches you.
              </h2>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'rgba(245,242,235,0.65)', marginBottom: '1.5rem' }}>
                BHS Skales isn&apos;t a marketplace — it&apos;s a curated house. Every piece enters through our hands before it reaches yours. We travel Dubai&apos;s gold souks, Milan&apos;s ateliers, Istanbul&apos;s leather districts, and Paris&apos;s tailoring houses so you don&apos;t have to.
              </p>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'rgba(245,242,235,0.65)', marginBottom: '2.5rem' }}>
                Authenticity is not a claim here — it&apos;s a process. Each item is documented, inspected, and cleared before landing in Lagos.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {['Dubai', 'Milan', 'Istanbul', 'Paris'].map(city => (
                  <div key={city} className="neu spotlight-card" style={{ padding: '0.65rem 1.1rem', borderRadius: '4px', transition: 'transform 0.2s', cursor: 'default' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#c9a84c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{city}</div>
                  </div>
                ))}
              </div>
            </div>
          </RevealBlock>
          <RevealBlock className="slide-right">
            <div className="texture-metal spotlight-card" style={{ position: 'relative', aspectRatio: '4/5', background: '#1a1a17', overflow: 'hidden', borderRadius: '2px' }}
              onMouseMove={e => {
                const el = e.currentTarget as HTMLDivElement
                const { left, top, width, height } = el.getBoundingClientRect()
                el.style.setProperty('--sx', `${((e.clientX - left) / width) * 100}%`)
                el.style.setProperty('--sy', `${((e.clientY - top) / height) * 100}%`)
              }}>
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&h=900&fit=crop&auto=format"
                alt="Curated luxury fashion"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.82)', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
              />
              <div className="glass" style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#c9a84c', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>MANIFEST — LOS DESTINATION</div>
                <div style={{ fontSize: '0.8rem', color: '#f5f2eb' }}>Dubai · Milan · Istanbul · Paris → Lagos</div>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────── */}
      <AnimatedRule />
      <section style={{ padding: '6rem 2rem', background: '#0c0c0a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <RevealBlock className="reveal">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Client Registry
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, marginBottom: '3rem' }}>
              What Lagos Says
            </h2>
          </RevealBlock>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} t={t} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────── */}
      <AnimatedRule />
      <section id="contact" className="aurora-bg" style={{ padding: '7rem 2rem', textAlign: 'center', position: 'relative', background: '#0a0a08' }}>
        <FloatingOrbs />
        <RevealBlock className="scale-in" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Begin Your Order
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Ready to receive something<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>exceptional?</em>
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(245,242,235,0.6)', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
            Reach us on WhatsApp for inquiries, custom orders, or to reserve a specific piece from an upcoming manifest.
          </p>
          <a href="https://wa.me/2347045207918?text=Hello%2C%20I%20would%20like%20to%20place%20an%20order%20from%20BHS%20Skales" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            background: 'linear-gradient(135deg, #2d7a4f 0%, #4ade80 50%, #1a5c38 100%)',
            color: '#0a0a08', padding: '1rem 2.5rem',
            fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            textDecoration: 'none', fontWeight: 700, borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(74,222,128,0.35), inset 0 -2px 5px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.2)',
            transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s',
          }}
            onMouseMove={e => {
              const el = e.currentTarget as HTMLAnchorElement
              const { left, top, width, height } = el.getBoundingClientRect()
              el.style.transform = `translate(${(e.clientX - left - width / 2) * 0.3}px, ${(e.clientY - top - height / 2) * 0.3}px) scale(1.05)`
              el.style.boxShadow = '0 12px 36px rgba(74,222,128,0.5), inset 0 -2px 5px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.2)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform = 'translate(0,0) scale(1)'
              el.style.boxShadow = '0 8px 24px rgba(74,222,128,0.35), inset 0 -2px 5px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.2)'
            }}>
            💬 Chat on WhatsApp
          </a>
        </RevealBlock>
      </section>

      </main>
    </div>
  )
}

/* ── MANIFEST CARD: spotlight + tilt + shimmer ──────────── */
function ManifestCard({ item }: { item: Product }) {
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const badge = STATUS_BADGE[item.status] ?? 'clay-gold'
  const imgSrc = item.images?.length > 0 ? getImageUrl(item.images[0]) : FALLBACK_IMG[item.category] ?? FALLBACK_IMG.Clothing

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width
    const y = (e.clientY - top) / height
    el.style.setProperty('--sx', `${x * 100}%`)
    el.style.setProperty('--sy', `${y * 100}%`)
    el.style.transform = `perspective(700px) rotateX(${-(y - 0.5) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateZ(6px)`
  }, [])

  const handleLeave = useCallback(() => {
    const el = cardRef.current
    if (el) el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)'
    setHovered(false)
  }, [])

  return (
    <div ref={cardRef} className="spotlight-card tilt-card"
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      onMouseEnter={() => setHovered(true)}
      style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}>
      <Link to={`/collection?category=${item.category}`} style={{
        background: hovered ? '#141410' : '#0a0a08', transition: 'background 0.25s',
        overflow: 'hidden', cursor: 'pointer', display: 'block', textDecoration: 'none', color: 'inherit',
        borderBottom: hovered ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
      }}>
        <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#1a1a17', position: 'relative' }}>
          <img src={imgSrc} alt={item.name}
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG[item.category] ?? FALLBACK_IMG.Clothing }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.07)' : 'scale(1)', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)', filter: 'brightness(0.8)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.07) 60%, transparent 80%)', opacity: hovered ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '0.65rem', right: '0.65rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
            {item.discount_percent > 0 && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', fontWeight: 700, background: '#ef4444', color: '#fff', padding: '0.2rem 0.45rem', borderRadius: '2px', letterSpacing: '0.06em' }}>
                -{item.discount_percent}%
              </span>
            )}
            <span className={`clay-badge ${badge}`}>{item.status}</span>
          </div>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: hovered ? '#f5f2eb' : 'rgba(245,242,235,0.85)', transition: 'color 0.2s' }}>{item.name}</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.4)', letterSpacing: '0.08em' }}>{item.origin} → LOS</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.3)', letterSpacing: '0.08em' }}>{item.category}</span>
            {item.price > 0 && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {item.discount_percent > 0 && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.3)', textDecoration: 'line-through' }}>₦{item.price.toLocaleString()}</span>
                )}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: item.discount_percent > 0 ? '#f87171' : '#c9a84c', fontWeight: item.discount_percent > 0 ? 700 : 400 }}>
                  ₦{getSalePrice(item.price, item.discount_percent).toLocaleString()}
                </span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── CATEGORY TILE: spotlight + tilt + reveal ───────────── */
function CategoryTile({ cat, index = 0 }: { cat: typeof CATEGORIES[0]; index?: number }) {
  const [hovered, setHovered] = useState(false)
  const tileRef = useRef<HTMLDivElement>(null)
  const delayClass = `d${Math.min(index + 1, 5)}`

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = tileRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width
    const y = (e.clientY - top) / height
    el.style.setProperty('--sx', `${x * 100}%`)
    el.style.setProperty('--sy', `${y * 100}%`)
    el.style.transform = `perspective(700px) rotateX(${-(y - 0.5) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateZ(6px)`
  }, [])

  const handleLeave = useCallback(() => {
    const el = tileRef.current
    if (el) el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)'
    setHovered(false)
  }, [])

  return (
    <RevealBlock className={`scale-in ${delayClass}`}>
      <div ref={tileRef} className="spotlight-card tilt-card"
        onMouseMove={handleMove} onMouseLeave={handleLeave}
        onMouseEnter={() => setHovered(true)}
        style={{ borderRadius: '2px', willChange: 'transform', transformStyle: 'preserve-3d' }}>
        <Link to={`/collection?category=${cat.name}`}
          style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#1a1a17', cursor: 'pointer', display: 'block', textDecoration: 'none', borderRadius: '2px' }}>
          <img src={cat.img} alt={cat.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.09)' : 'scale(1)', transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1)', filter: hovered ? 'brightness(0.5)' : 'brightness(0.4)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,8,0.92) 40%, transparent 70%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(201,168,76,0.09) 0%, transparent 50%)', opacity: hovered ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }} />
          <div className="glass" style={{ position: 'absolute', bottom: '1.25rem', left: '1rem', right: '1rem', padding: '0.75rem 1rem', borderRadius: '4px', transform: hovered ? 'translateY(-5px)' : 'translateY(0)', transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.2rem', fontWeight: 400, color: '#f5f2eb', marginBottom: '0.2rem' }}>{cat.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.5)', letterSpacing: '0.08em' }}>{cat.sub}</div>
          </div>
        </Link>
      </div>
    </RevealBlock>
  )
}

/* ── TESTIMONIAL CARD: glass + spotlight + tilt ─────────── */
function TestimonialCard({ t, index = 0 }: { t: typeof TESTIMONIALS[0]; index?: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const delayClass = `d${Math.min(index + 1, 5)}`

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width
    const y = (e.clientY - top) / height
    el.style.setProperty('--sx', `${x * 100}%`)
    el.style.setProperty('--sy', `${y * 100}%`)
    el.style.transform = `perspective(700px) rotateX(${-(y - 0.5) * 5}deg) rotateY(${(x - 0.5) * 5}deg) translateZ(4px)`
  }, [])

  const handleLeave = useCallback(() => {
    const el = cardRef.current
    if (el) el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)'
  }, [])

  return (
    <RevealBlock className={`reveal ${delayClass}`}>
      <div ref={cardRef} className="glass-card tilt-card spotlight-card"
        onMouseMove={handleMove} onMouseLeave={handleLeave}
        style={{ padding: '1.75rem', borderRadius: '4px', cursor: 'default', willChange: 'transform', transformStyle: 'preserve-3d' }}>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
          {Array.from({ length: t.rating }).map((_, i) => (
            <span key={i} style={{ color: '#c9a84c', fontSize: '0.75rem' }}>★</span>
          ))}
        </div>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'rgba(245,242,235,0.75)', marginBottom: '1.25rem' }}>&ldquo;{t.text}&rdquo;</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a84c, #8a6a20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#0a0a08', fontWeight: 700, flexShrink: 0 }}>
            {t.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#c9a84c', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{t.location}</div>
          </div>
        </div>
      </div>
    </RevealBlock>
  )
}
