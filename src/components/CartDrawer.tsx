import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { getImageUrl } from '@/lib/supabase'

export default function CartDrawer() {
  const { cartItems, clearCart, cartOpen, setCartOpen, removeItem, updateQuantity, subtotal, totalCount } = useCart()

  if (!cartOpen) return null

  const handleOrder = () => {
    const itemsList = cartItems.map(it => `• ${it.name} x${it.quantity} - ₦${(Number(it.price || 0) * it.quantity).toLocaleString()}`).join('\n')
    const message = `Hello, I would like to place an order from BHS Skales:\n\n${itemsList}\n\n*Subtotal: ₦${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`
    const whatsappUrl = `https://wa.me/2347045207918?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setCartOpen(false)}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
        background: 'rgba(6,6,5,0.86)',
        backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderLeft: '1px solid rgba(201,168,76,0.12)', boxShadow: '-18px 0 80px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', padding: '1.25rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.15rem' }}>Shopping Cart ({totalCount} {totalCount === 1 ? 'item' : 'items'})</div>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" style={{ background: 'transparent', border: 'none', color: '#f5f2eb', fontSize: '1.05rem' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', paddingTop: '2rem' }}>
              <div style={{ fontSize: '2rem', opacity: 0.22 }}>🛒</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'rgba(245,242,235,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your cart is empty</div>
              <Link to="/collection" onClick={() => setCartOpen(false)}
                style={{ marginTop: '1rem', background: '#c9a84c', color: '#0a0a08', padding: '0.75rem 1.5rem', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>
                Browse Collection
              </Link>
            </div>
          ) : (
            cartItems.map((it) => (
              <div key={it.id} style={{ background: '#0b0b09', borderRadius: '8px', padding: '0.8rem', display: 'flex', gap: '0.75rem', alignItems: 'center', position: 'relative' }}>
                {/* thumbnail */}
                <div style={{ width: '68px', height: '68px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={it.images?.length ? getImageUrl(it.images[0]) : ''} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{it.name}</div>
                    <button onClick={() => removeItem(it.id)} aria-label="Remove item" style={{ background: 'transparent', border: 'none', color: '#ff5a5a', fontSize: '1rem' }}>🗑️</button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(245,242,235,0.55)', marginTop: '0.3rem' }}>{it.category || ''}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => updateQuantity(it.id, (it.quantity || 1) - 1)} style={{ padding: '0.15rem 0.5rem' }}>−</button>
                      <div style={{ minWidth: '24px', textAlign: 'center' }}>{it.quantity}</div>
                      <button onClick={() => updateQuantity(it.id, (it.quantity || 1) + 1)} style={{ padding: '0.15rem 0.5rem' }}>+</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", color: '#c9a84c', fontWeight: 700 }}>₦{(Number(it.price || 0) * (it.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(245,242,235,0.45)' }}>Subtotal</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom summary */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ color: 'rgba(245,242,235,0.8)' }}>Subtotal</div>
            <div style={{ color: '#c9a84c', fontFamily: "'DM Mono', monospace", fontWeight: 800 }}>₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: 'rgba(245,242,235,0.9)', fontWeight: 800 }}>Total</div>
            <div style={{ color: '#c9a84c', fontFamily: "'DM Mono', monospace", fontWeight: 800 }}>₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleOrder} className="neu-btn" style={{ flex: 1, background: 'linear-gradient(135deg, #c9a84c 0%, #b28d3a 50%)', color: '#0a0a08', fontWeight: 800, padding: '0.8rem' }}>Order via WhatsApp</button>
            <button onClick={() => setCartOpen(false)} className="neu-btn" style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#f5f2eb', padding: '0.8rem' }}>Continue Shopping</button>
          </div>
        </div>
      </div>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: -1 }} />
    </div>
  )
}
