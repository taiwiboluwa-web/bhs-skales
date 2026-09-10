import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoDark from '@/imports/SEWA_S__3_-1.png'
import { useCart } from '@/context/CartContext'

export default function Header() {
  const { setCartOpen, totalCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const goToSection = (section: string) => {
    const hash = `#${section}`

    if (location.pathname === '/') {
      if (location.hash === hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        return
      }
      window.history.pushState(null, '', hash)
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    navigate(`/${hash}`)
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const goToCollection = () => {
    if (location.pathname === '/collection') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    navigate('/collection')
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), 50)
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 2rem', height: '72px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease',
    }}>
      <Link to="/" onClick={() => window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), 50)}>
        <img src={logoDark} alt="BHS Skales" style={{ height: '62px', width: 'auto', objectFit: 'contain' }} />
      </Link>
      <nav style={{ display: 'flex', gap: '2rem' }}>
        <button onClick={() => goToSection('arrivals')} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f2eb', fontWeight: 500 }}>Arrivals</button>
        <button onClick={goToCollection} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f2eb', fontWeight: 500 }}>Collection</button>
        <button onClick={() => goToSection('about')} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f2eb', fontWeight: 500 }}>About</button>
        <button onClick={() => goToSection('contact')} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f2eb', fontWeight: 500 }}>Contact</button>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <a href="https://wa.me/2347045207918?text=Hello" className="neu-btn" style={{ fontSize: '0.68rem', color: '#f5f2eb', padding: '0.45rem 1rem', borderRadius: '3px', textDecoration: 'none', fontWeight: 600 }}>📱 Order</a>
        <button className="neu-btn" onClick={() => setCartOpen(true)} style={{ position: 'relative', padding: '0.45rem 0.7rem', borderRadius: '3px', fontSize: '1rem' }} aria-label="Open cart">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>🛒{totalCount > 0 && <span style={{ marginLeft: '6px', background: '#c9a84c', color: '#0a0a08', fontSize: '0.66rem', padding: '0.12rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>{totalCount}</span>}</span>
        </button>
      </div>
    </header>
  )
}
