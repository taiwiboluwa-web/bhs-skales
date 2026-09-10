import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, CATEGORIES, getImageUrl, STORAGE_BUCKET, getSalePrice, type Product, type Category } from '@/lib/supabase'
import logoDark from '@/imports/SEWA_S__3_-1.png'

const EMPTY_FORM = {
  name: '',
  category: 'Jewelry' as Category,
  price: '',
  discount_percent: '0',
  origin: '',
  description: '',
  status: 'CLEARED',
  is_latest_arrival: false,
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Category | 'All' | 'Latest Arrivals'>('All')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [newImages, setNewImages] = useState<File[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/admin/login'); return }
      setUser(data.user)
      fetchProducts()
    })
  }, [])

  // Auto-logout on inactivity: 15 minutes (900,000 ms)
  useEffect(() => {
    const TIMEOUT = 15 * 60 * 1000 // 15 minutes
    const timerRef = { id: undefined as unknown as number }

    const logout = async () => {
      try {
        await supabase.auth.signOut()
      } finally {
        // Redirect to admin login to keep flow consistent
        navigate('/admin/login')
      }
    }

    const resetTimer = () => {
      if (timerRef.id) window.clearTimeout(timerRef.id)
      // @ts-ignore
      timerRef.id = window.setTimeout(logout, TIMEOUT)
    }

    // Events that indicate user activity
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }))

    // Start initial timer
    resetTimer()

    // Pause timer when page is hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.id) window.clearTimeout(timerRef.id)
      } else {
        resetTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
      document.removeEventListener('visibilitychange', handleVisibility)
      if (timerRef.id) window.clearTimeout(timerRef.id)
    }
  }, [navigate])

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setNewImages([])
    setRemovedImages([])
    setEditingProduct(null)
    setModal('add')
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      category: p.category as Category,
      price: String(p.price ?? ''),
      discount_percent: String(p.discount_percent ?? 0),
      origin: p.origin ?? '',
      description: p.description ?? '',
      status: p.status ?? 'CLEARED',
      is_latest_arrival: p.is_latest_arrival ?? false,
    })
    setNewImages([])
    setRemovedImages([])
    setEditingProduct(p)
    setModal('edit')
  }

  async function toggleLatestArrival(p: Product) {
    const next = !p.is_latest_arrival
    const { error } = await supabase
      .from('products')
      .update({ is_latest_arrival: next, updated_at: new Date().toISOString() })
      .eq('id', p.id)
    if (!error) {
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_latest_arrival: next } : x))
      showToast(next ? `"${p.name}" added to Latest Arrivals` : `"${p.name}" removed from Latest Arrivals`)
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
      if (error) {
        showToast(`Image upload failed: ${error.message}`, 'error')
      } else {
        urls.push(path)
      }
    }
    return urls
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)

    const uploadedPaths = await uploadImages(newImages)
    const existingImages = editingProduct
      ? (editingProduct.images ?? []).filter(img => !removedImages.includes(img))
      : []
    const images = [...existingImages, ...uploadedPaths]

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price) || 0,
      discount_percent: Math.min(100, Math.max(0, parseInt(form.discount_percent) || 0)),
      origin: form.origin.trim(),
      description: form.description.trim(),
      status: form.status,
      images,
      is_latest_arrival: form.is_latest_arrival,
      updated_at: new Date().toISOString(),
    }

    if (modal === 'add') {
      const { error } = await supabase.from('products').insert([payload])
      if (!error) { showToast('Product added to manifest'); fetchProducts(); setModal(null) }
      else showToast('Error: ' + error.message, 'error')
    } else if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id)
      if (!error) { showToast('Product updated'); fetchProducts(); setModal(null) }
      else showToast('Error: ' + error.message, 'error')
    }

    setSaving(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) { showToast('Product deleted'); fetchProducts(); setDeleteConfirm(null) }
    else showToast('Error: ' + error.message, 'error')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const [deploying, setDeploying] = useState(false)
  const [deployLog, setDeployLog] = useState<{ msg: string; ok: boolean }[]>([])

  async function deployNow() {
    setDeploying(true)
    setDeployLog([])

    const log = (msg: string, ok = true) =>
      setDeployLog(prev => [...prev, { msg, ok }])

    // 1 — Supabase: verify connection + reload products
    try {
      await fetchProducts()
      log('Supabase refreshed ✓')
    } catch {
      log('Supabase refresh failed', false)
    }

    // 2 — GitHub: create an empty commit to trigger Vercel redeploy
    try {
      const OWNER = 'taiwiboluwa-web'
      const REPO  = 'bhs-skales'
      const TOKEN = import.meta.env.VITE_GITHUB_TOKEN ?? ''
      const FILE  = 'last-deploy.txt'
      const API   = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`
      const headers = {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      }

      // Get current SHA if file exists
      let sha: string | undefined
      const existing = await fetch(API, { headers })
      if (existing.ok) {
        const json = await existing.json()
        sha = json.sha
      }

      const content = btoa(`Deployed: ${new Date().toISOString()}`)
      const body: Record<string, string> = {
        message: `chore: deploy trigger ${new Date().toISOString()}`,
        content,
      }
      if (sha) body.sha = sha

      const push = await fetch(API, { method: 'PUT', headers, body: JSON.stringify(body) })
      if (push.ok) {
        log('GitHub commit pushed ✓ — Vercel redeploy triggered')
      } else {
        const err = await push.json()
        log(`GitHub error: ${err.message}`, false)
      }
    } catch (e: any) {
      log(`GitHub failed: ${e.message}`, false)
    }

    setDeploying(false)
  }

  const latestCount = products.filter(p => p.is_latest_arrival).length

  const filtered =
    activeTab === 'All' ? products
    : activeTab === 'Latest Arrivals' ? products.filter(p => p.is_latest_arrival)
    : products.filter(p => p.category === activeTab)

  return (
    <div style={{ background: '#0a0a08', color: '#f5f2eb', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toastType === 'success' ? '#c9a84c' : '#ef4444',
          color: toastType === 'success' ? '#0a0a08' : '#fff',
          padding: '0.75rem 1.5rem', fontSize: '0.8rem', fontWeight: 600,
          letterSpacing: '0.04em', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          borderRadius: '3px', maxWidth: '320px',
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* ── SIDEBAR ─────────────────────────────────── */}
        <aside style={{ width: '240px', background: '#0f0f0c', borderRight: '1px solid rgba(201,168,76,0.12)', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0 }}>
          <div style={{ padding: '0 1.5rem 2rem' }}>
            <img src={logoDark} alt="BHS Skales" style={{ height: '52px', objectFit: 'contain' }} />
          </div>

          <div style={{ padding: '0 1rem', marginBottom: '0.25rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.4rem' }}>
              Views
            </div>
            {/* Latest Arrivals special tab */}
            <button onClick={() => setActiveTab('Latest Arrivals')} style={{
              width: '100%', textAlign: 'left',
              background: activeTab === 'Latest Arrivals' ? 'rgba(201,168,76,0.12)' : 'transparent',
              border: 'none',
              borderLeft: activeTab === 'Latest Arrivals' ? '2px solid #c9a84c' : '2px solid transparent',
              color: activeTab === 'Latest Arrivals' ? '#c9a84c' : 'rgba(245,242,235,0.6)',
              padding: '0.6rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>⭐ Latest Arrivals</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', opacity: 0.7 }}>{latestCount}</span>
            </button>
            <button onClick={() => setActiveTab('All')} style={{
              width: '100%', textAlign: 'left',
              background: activeTab === 'All' ? 'rgba(201,168,76,0.12)' : 'transparent',
              border: 'none',
              borderLeft: activeTab === 'All' ? '2px solid #c9a84c' : '2px solid transparent',
              color: activeTab === 'All' ? '#c9a84c' : 'rgba(245,242,235,0.6)',
              padding: '0.6rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              All Products
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', opacity: 0.7 }}>{products.length}</span>
            </button>
          </div>

          <div style={{ padding: '0 1rem', marginTop: '0.5rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.4rem' }}>
              Categories
            </div>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} style={{
                width: '100%', textAlign: 'left',
                background: activeTab === cat ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeTab === cat ? '2px solid #c9a84c' : '2px solid transparent',
                color: activeTab === cat ? '#c9a84c' : 'rgba(245,242,235,0.55)',
                padding: '0.55rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {cat}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', opacity: 0.6 }}>
                  {products.filter(p => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
            <div style={{ padding: '0 0.5rem 0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.25)', letterSpacing: '0.06em', wordBreak: 'break-all' }}>
              {user?.email}
            </div>
            <button onClick={handleSignOut} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(201,168,76,0.18)', color: 'rgba(245,242,235,0.45)', padding: '0.5rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: '2px' }}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Admin Dashboard
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '2rem', fontWeight: 400 }}>
                {activeTab === 'Latest Arrivals' ? '⭐ Latest Arrivals' : activeTab === 'All' ? 'All Products' : activeTab}
              </h1>
              {activeTab === 'Latest Arrivals' && (
                <p style={{ fontSize: '0.78rem', color: 'rgba(245,242,235,0.45)', marginTop: '0.35rem' }}>
                  These products show on the homepage manifest. Toggle the ⭐ switch on any product to add or remove it.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={openAdd} style={{
                  background: 'linear-gradient(135deg, #d4a942, #f0cc6a, #b8892e)',
                  color: '#0a0a08', border: 'none', padding: '0.75rem 1.5rem',
                  fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: '3px',
                  boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
                }}>
                  + Add Product
                </button>
                <button onClick={deployNow} disabled={deploying} style={{
                  background: deploying ? '#1a1a17' : '#0f0f0c',
                  color: deploying ? '#c9a84c' : '#f5f2eb',
                  border: `1px solid ${deploying ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.25)'}`,
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
                  cursor: deploying ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', borderRadius: '3px',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: deploying ? '0 0 12px rgba(201,168,76,0.2)' : 'none',
                }}>
                  <span style={{ display: 'inline-block', animation: deploying ? 'spin 1s linear infinite' : 'none', fontSize: '0.85rem' }}>⟳</span>
                  {deploying ? 'Deploying…' : '↑ Deploy Now'}
                </button>
              </div>
              {/* Deploy log */}
              {deployLog.length > 0 && (
                <div style={{ background: '#0a0a08', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '3px', padding: '0.6rem 0.85rem', minWidth: '300px' }}>
                  {deployLog.map((l, i) => (
                    <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: l.ok ? '#4ade80' : '#ef4444', letterSpacing: '0.06em', lineHeight: 1.8 }}>
                      {l.ok ? '✓' : '✗'} {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1px', background: 'rgba(201,168,76,0.08)', marginBottom: '2rem', borderRadius: '2px', overflow: 'hidden' }}>
            <StatTile label="Total" value={products.length} />
            <StatTile label="⭐ Arrivals" value={latestCount} highlight />
            <StatTile label="🔥 On Sale" value={products.filter(p => p.discount_percent > 0).length} sale />
            {CATEGORIES.map(cat => (
              <StatTile key={cat} label={cat} value={products.filter(p => p.category === cat).length} />
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(245,242,235,0.35)', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              LOADING MANIFEST…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(201,168,76,0.12)', borderRadius: '2px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#c9a84c', marginBottom: '0.5rem' }}>
                {activeTab === 'Latest Arrivals' ? 'NO LATEST ARRIVALS SET' : 'MANIFEST EMPTY'}
              </div>
              <p style={{ color: 'rgba(245,242,235,0.35)', fontSize: '0.82rem' }}>
                {activeTab === 'Latest Arrivals'
                  ? 'Toggle the ⭐ switch on any product to feature it on the homepage.'
                  : 'No products yet. Add your first item.'}
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.12)', background: '#0f0f0c' }}>
                    {['', 'Image', 'Name', 'Category', 'Price', 'Sale', 'Origin', 'Status', '⭐ Latest', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.7rem 0.85rem', textAlign: 'left', fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.07)', background: i % 2 === 0 ? '#0a0a08' : '#0d0d0a', transition: 'background 0.15s' }}>
                      {/* Row number */}
                      <td style={{ padding: '0.7rem 0.5rem 0.7rem 0.85rem', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.2)' }}>{i + 1}</td>

                      {/* Image */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div style={{ width: '44px', height: '44px', background: '#1a1a17', overflow: 'hidden', borderRadius: '2px', flexShrink: 0 }}>
                          {p.images?.length > 0 && (
                            <img src={getImageUrl(p.images[0])} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '0.7rem 0.85rem', fontSize: '0.83rem', fontWeight: 500, maxWidth: '180px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', background: 'rgba(201,168,76,0.1)', color: '#c9a84c', padding: '0.2rem 0.45rem', letterSpacing: '0.06em', borderRadius: '2px' }}>{p.category}</span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '0.7rem 0.85rem', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {p.price > 0 ? (
                          p.discount_percent > 0
                            ? <span style={{ color: 'rgba(245,242,235,0.35)', textDecoration: 'line-through' }}>₦{p.price.toLocaleString()}</span>
                            : <span style={{ color: '#c9a84c' }}>₦{p.price.toLocaleString()}</span>
                        ) : '—'}
                      </td>

                      {/* Sale */}
                      <td style={{ padding: '0.7rem 0.85rem', whiteSpace: 'nowrap' }}>
                        {p.discount_percent > 0 ? (
                          <div>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '0.15rem 0.4rem', borderRadius: '2px', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>
                              -{p.discount_percent}% OFF
                            </span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>
                              ₦{getSalePrice(p.price, p.discount_percent).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.2)' }}>—</span>
                        )}
                      </td>

                      {/* Origin */}
                      <td style={{ padding: '0.7rem 0.85rem', fontSize: '0.78rem', color: 'rgba(245,242,235,0.45)' }}>{p.origin || '—'}</td>

                      {/* Status */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Latest Arrival Toggle */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <button
                          onClick={() => toggleLatestArrival(p)}
                          title={p.is_latest_arrival ? 'Remove from Latest Arrivals' : 'Add to Latest Arrivals'}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: p.is_latest_arrival ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                            border: p.is_latest_arrival ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            padding: '0.3rem 0.65rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {/* Toggle pill */}
                          <div style={{
                            width: '28px', height: '14px',
                            background: p.is_latest_arrival ? '#c9a84c' : 'rgba(255,255,255,0.12)',
                            borderRadius: '7px',
                            position: 'relative',
                            transition: 'background 0.2s',
                            flexShrink: 0,
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              left: p.is_latest_arrival ? '16px' : '2px',
                              width: '10px', height: '10px',
                              background: '#fff',
                              borderRadius: '50%',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.62rem', color: p.is_latest_arrival ? '#c9a84c' : 'rgba(245,242,235,0.35)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {p.is_latest_arrival ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.7rem 0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => openEdit(p)} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)', color: '#c9a84c', padding: '0.3rem 0.65rem', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: '2px' }}>Edit</button>
                          <button onClick={() => setDeleteConfirm(p.id)} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', color: '#ef4444', padding: '0.3rem 0.65rem', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: '2px' }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* ── ADD / EDIT MODAL ──────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: '#0f0f0c', border: '1px solid rgba(201,168,76,0.2)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '4px' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  {modal === 'add' ? 'New Entry' : 'Edit Entry'}
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 400, color: '#f5f2eb' }}>
                  {modal === 'add' ? 'Add Product' : editingProduct?.name}
                </h2>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,242,235,0.35)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <Field label="Product Name">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gold-Plated Cuff Set" style={inputStyle} />
              </Field>

              <Field label="Category">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Price (₦)">
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="45000" style={inputStyle} />
                </Field>
                <Field label="Origin City">
                  <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="Dubai" style={inputStyle} />
                </Field>
              </div>

              {/* ── SALE / DISCOUNT ── */}
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      🔥 Sale Discount
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.38)', letterSpacing: '0.06em' }}>
                      Set to 0 to remove the sale. Max 90%.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="0" max="90"
                      value={form.discount_percent}
                      onChange={e => setForm(f => ({ ...f, discount_percent: String(Math.min(90, Math.max(0, parseInt(e.target.value) || 0))) }))}
                      style={{ ...inputStyle, width: '70px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: parseInt(form.discount_percent) > 0 ? '#f87171' : '#f5f2eb', padding: '0.5rem' }}
                    />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', color: 'rgba(245,242,235,0.4)' }}>%</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range" min="0" max="90" step="5"
                  value={form.discount_percent}
                  onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                  style={{ width: '100%', accentColor: '#f87171', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: '0.52rem', color: 'rgba(245,242,235,0.25)', marginTop: '0.25rem' }}>
                  <span>0%</span><span>30%</span><span>60%</span><span>90%</span>
                </div>

                {/* Live preview */}
                {parseInt(form.discount_percent) > 0 && parseFloat(form.price) > 0 && (
                  <div style={{ marginTop: '0.85rem', padding: '0.7rem 0.9rem', background: 'rgba(239,68,68,0.08)', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: 'rgba(245,242,235,0.35)', textDecoration: 'line-through' }}>
                      ₦{parseFloat(form.price).toLocaleString()}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.15rem 0.45rem', borderRadius: '2px', letterSpacing: '0.06em' }}>
                      -{form.discount_percent}% OFF
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', color: '#f87171', fontWeight: 700 }}>
                      ₦{getSalePrice(parseFloat(form.price), parseInt(form.discount_percent)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  {['CLEARED', 'INCOMING', 'SOLD OUT', 'RESERVED', 'LIMITED'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief product description…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>

              {/* Latest Arrival toggle */}
              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '4px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: '0.2rem' }}>⭐ Feature on Homepage</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,242,235,0.4)', letterSpacing: '0.06em' }}>
                    Shows this product in the "Latest Arrivals" manifest on the homepage
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_latest_arrival: !f.is_latest_arrival }))}
                  style={{
                    width: '48px', height: '24px', flexShrink: 0,
                    background: form.is_latest_arrival ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                    borderRadius: '12px', border: 'none', position: 'relative',
                    cursor: 'pointer', transition: 'background 0.2s',
                    boxShadow: form.is_latest_arrival ? '0 0 12px rgba(201,168,76,0.4)' : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: form.is_latest_arrival ? '27px' : '3px',
                    width: '18px', height: '18px',
                    background: '#fff', borderRadius: '50%',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }} />
                </button>
              </div>

              {/* Existing Images */}
              {modal === 'edit' && editingProduct && editingProduct.images?.length > 0 && (
                <Field label="Current Images">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {editingProduct.images.filter(img => !removedImages.includes(img)).map(img => (
                      <div key={img} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '2px', overflow: 'hidden' }}>
                        <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setRemovedImages(r => [...r, img])} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.9)', border: 'none', color: '#fff', width: '18px', height: '18px', fontSize: '0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: '2px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                </Field>
              )}

              {/* Upload */}
              <Field label="Upload Images">
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => setNewImages(Array.from(e.target.files ?? []))} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{ background: 'rgba(201,168,76,0.06)', border: '1px dashed rgba(201,168,76,0.3)', color: '#c9a84c', padding: '0.75rem 1rem', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', width: '100%', fontFamily: 'Inter, sans-serif', borderRadius: '2px' }}>
                  {newImages.length > 0 ? `${newImages.length} file${newImages.length > 1 ? 's' : ''} selected` : '+ Choose Images'}
                </button>
                {newImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {newImages.map((f, i) => (
                      <div key={i} style={{ width: '60px', height: '60px', background: '#1a1a17', overflow: 'hidden', position: 'relative', borderRadius: '2px' }}>
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setNewImages(imgs => imgs.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.85)', border: 'none', color: '#fff', width: '16px', height: '16px', fontSize: '0.5rem', cursor: 'pointer', padding: 0, borderRadius: '2px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
                background: saving || !form.name.trim()
                  ? 'rgba(201,168,76,0.35)'
                  : 'linear-gradient(135deg, #d4a942, #f0cc6a, #b8892e)',
                color: '#0a0a08', border: 'none', padding: '0.9rem',
                fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', borderRadius: '3px',
                boxShadow: saving || !form.name.trim() ? 'none' : '0 4px 16px rgba(201,168,76,0.35)',
              }}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add to Manifest' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0f0f0c', border: '1px solid rgba(220,38,38,0.25)', padding: '2rem', maxWidth: '360px', width: '100%', textAlign: 'center', borderRadius: '4px' }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.5rem', marginBottom: '0.75rem' }}>Delete Product?</div>
            <p style={{ fontSize: '0.83rem', color: 'rgba(245,242,235,0.55)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This permanently removes the product from the manifest. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(245,242,235,0.15)', color: 'rgba(245,242,235,0.6)', padding: '0.75rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: '2px' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, background: 'rgba(220,38,38,0.85)', border: 'none', color: '#fff', padding: '0.75rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: '2px' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, highlight, sale }: { label: string; value: number; highlight?: boolean; sale?: boolean }) {
  const accent = sale ? '#f87171' : highlight ? '#c9a84c' : undefined
  return (
    <div style={{ background: '#0f0f0c', padding: '1.1rem 1rem', borderLeft: accent ? `2px solid ${accent}` : 'none' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: accent ?? 'rgba(245,242,235,0.35)', letterSpacing: '0.1em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.6rem', color: accent ?? '#f5f2eb' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    CLEARED:  { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
    INCOMING: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
    LIMITED:  { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
    RESERVED: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
    'SOLD OUT': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  }
  const style = map[status] ?? { bg: 'rgba(255,255,255,0.06)', color: 'rgba(245,242,235,0.5)' }
  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.56rem', background: style.bg, color: style.color, padding: '0.2rem 0.5rem', letterSpacing: '0.08em', borderRadius: '2px', whiteSpace: 'nowrap' }}>
      {status || 'CLEARED'}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1a1a17', border: '1px solid rgba(201,168,76,0.18)',
  color: '#f5f2eb', padding: '0.7rem 0.9rem', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', borderRadius: '2px',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'rgba(245,242,235,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
