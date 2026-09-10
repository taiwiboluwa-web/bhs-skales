import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, CATEGORIES, getImageUrl, type Product, type Category } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'

const FALLBACK: Record<Category, string> = {
  Jewelry: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop&auto=format',
  Bags: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=400&fit=crop&auto=format',
  Shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop&auto=format',
  Shades: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=400&fit=crop&auto=format',
  Clothing: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop&auto=format',
}

export default function Collection() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') as Category | null
  const [products, setProducts] = useState<Product[]>([])
  const [active, setActive] = useState<Category | 'All'>(initialCategory ?? 'All')
  const [loading, setLoading] = useState(true)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewProduct(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = active === 'All' ? products : products.filter(p => p.category === active)

  return (
    <div style={{ background: '#0a0a08', color: '#f5f2eb', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* HERO */}
      <div style={{ padding: '4rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Full Import Manifest
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, marginBottom: '0.5rem' }}>
          The Collection
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(245,242,235,0.55)', marginBottom: '2.5rem' }}>
          {products.length} pieces cleared · Dubai · Milan · Istanbul · Paris
        </p>

        {/* NEUMORPHIC CATEGORY TABS */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          {(['All', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={active === cat ? '' : 'neu-btn'}
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 600,
                border: 'none',
                background: active === cat
                  ? 'linear-gradient(135deg, #d4a942 0%, #f0cc6a 50%, #b8892e 100%)'
                  : '#131310',
                color: active === cat ? '#0a0a08' : 'rgba(245,242,235,0.7)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '4px',
                boxShadow: active === cat
                  ? '0 6px 18px rgba(201,168,76,0.4), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.2)'
                  : '4px 4px 10px rgba(0,0,0,0.65), -2px -2px 6px rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
              }}
            >
              {cat}
              <span style={{ marginLeft: '0.4rem', opacity: 0.65, fontSize: '0.62rem' }}>
                ({cat === 'All' ? products.length : products.filter(p => p.category === cat).length})
              </span>
            </button>
          ))}
        </div>

        {/* GRID */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1px', background: 'rgba(201,168,76,0.1)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#0a0a08', padding: '0' }}>
                <div style={{ aspectRatio: '4/3', background: '#1a1a17', animation: 'pulse 1.5s infinite' }} />
                <div style={{ padding: '1rem' }}>
                  <div style={{ height: '12px', background: '#1a1a17', borderRadius: '2px', marginBottom: '8px', width: '60%' }} />
                  <div style={{ height: '10px', background: '#1a1a17', borderRadius: '2px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#c9a84c', letterSpacing: '0.1em', marginBottom: '1rem' }}>NO ITEMS FOUND</div>
            <p style={{ color: 'rgba(245,242,235,0.5)', fontSize: '0.9rem' }}>
              {active === 'All' ? 'No products in the manifest yet.' : `No ${active} items in stock right now.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: 'rgba(201,168,76,0.12)' }}>
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} fallback={FALLBACK[product.category as Category] || FALLBACK.Clothing} onPreview={setPreviewProduct} />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewProduct && (
        <div role="dialog" aria-modal="true" onClick={() => setPreviewProduct(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '960px', width: '100%', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={previewProduct.images?.length ? getImageUrl(previewProduct.images[0]) : FALLBACK[previewProduct.category as Category] || FALLBACK.Clothing} alt={previewProduct.name} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '6px' }} />
            <button onClick={() => setPreviewProduct(null)} aria-label="Close preview" style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#000', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '0.4rem 0.6rem', borderRadius: '999px', fontSize: '1rem' }}>✕</button>
          </div>
        </div>
      )}

      <footer style={{ borderTop: '1px solid rgba(201,168,76,0.15)', padding: '2rem', textAlign: 'center', marginTop: '5rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'rgba(245,242,235,0.35)', letterSpacing: '0.08em' }}>
          Shin&apos;s Fashion · Lagos, Nigeria · Dubai · Milan · Istanbul · Paris
        </div>
      </footer>
    </div>
  )
}

function ProductCard({ product, fallback, onPreview }: { product: Product; fallback: string; onPreview?: (p: Product | null) => void }) {
  const { addToCart } = useCart()
  const [hovered, setHovered] = useState(false)
  const imgSrc = product.images?.length > 0 ? getImageUrl(product.images[0]) : fallback

  // Extract discount fields from Supabase object
  const discountPercent = (product as any).discount_percent || (product as any).discount_percentage || 0
  const hasDiscount = discountPercent > 0
  const originalPrice = product.price
  const discountedPrice = (product as any).discount_price || (originalPrice * (1 - discountPercent / 100))

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? '#141410' : '#0a0a08', transition: 'background 0.2s', cursor: 'pointer' }}
    >
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#1a1a17', position: 'relative' }}>
        <img
          src={imgSrc}
          alt={product.name}
          onError={e => { (e.target as HTMLImageElement).src = fallback }}
          onClick={() => onPreview?.(product)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.4s ease', filter: 'brightness(0.82)', cursor: 'zoom-in' }}
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: '#ef4444', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '3px', fontWeight: 700, fontSize: '0.65rem', fontFamily: "'DM Mono', monospace" }}>
            -{discountPercent}%
          </div>
        )}

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(10,10,8,0.85)', padding: '0.2rem 0.6rem' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', color: '#c9a84c', letterSpacing: '0.1em' }}>{product.status || 'CLEARED'}</span>
        </div>

        {/* Add to Cart Button */}
        <button type="button" onClick={e => { e.stopPropagation(); e.preventDefault(); addToCart({ ...product, price: hasDiscount ? discountedPrice : originalPrice }); }}
          aria-label={`Add ${product.name} to cart`}
          style={{ position: 'absolute', bottom: '0.6rem', right: '0.6rem', background: 'linear-gradient(135deg, #d4a942 0%, #f0cc6a 50%)', color: '#0a0a08', border: 'none', padding: '0.45rem 0.6rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>+</span>
        </button>
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, flex: 1, marginRight: '0.5rem' }}>{product.name}</div>
          
          {/* Price & Discount Display */}
          {originalPrice > 0 && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
              {hasDiscount ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ textDecoration: 'line-through', color: 'rgba(245,242,235,0.4)', fontSize: '0.65rem' }}>
                    ₦{originalPrice.toLocaleString()}
                  </span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>
                    ₦{discountedPrice.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span style={{ color: '#c9a84c' }}>
                  ₦{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.4)', letterSpacing: '0.08em' }}>
            {product.origin || '—'} → LOS
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', background: 'rgba(201,168,76,0.1)', color: '#c9a84c', padding: '0.1rem 0.4rem', letterSpacing: '0.06em' }}>
            {product.category}
          </span>
        </div>

        {product.description && (
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,242,235,0.45)', marginTop: '0.5rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
      </div>
    </div>
  )
}
