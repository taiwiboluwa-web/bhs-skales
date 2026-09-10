import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import App from './App'
import Collection from './pages/Collection'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import './index.css'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import { supabase, getImageUrl, getSalePrice, type Product } from './lib/supabase'

const SITE_URL = 'https://bhsskales.com'

function NavigationScrollManager() {
  const location = useLocation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (location.pathname === '/collection') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        return
      }

      if (location.pathname === '/') {
        const hash = location.hash.replace(/^#/, '')
        if (hash) {
          const target = document.getElementById(hash)
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
          }
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  return null
}

function SeoEnhancer() {
  const location = useLocation()

  useEffect(() => {
    const page = location.pathname
    const title = page === '/collection'
      ? "Luxury Bags, Shoes, Jewelry & Fashion | BHS Skales Lagos"
      : "BHS Skales | Luxury Imports & Premium Fashion Store in Lagos"
    const description = page === '/collection'
      ? "Shop curated luxury bags, shoes, jewelry, shades and clothing from BHS Skales, a premium fashion and luxury imports store serving Lagos, Nigeria."
      : "BHS Skales is a Lagos, Nigeria luxury imports and premium fashion store offering curated bags, shoes, jewelry, shades and clothing sourced from Dubai, Milan, Istanbul and Paris."

    document.title = title
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name=\"${name}\"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.name = name
        document.head.appendChild(el)
      }
      el.content = content
    }
    const setProperty = (property: string, content: string) => {
      let el = document.querySelector(`meta[property=\"${property}\"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.content = content
    }

    setMeta('description', description)
    setMeta('keywords', 'luxury imports Lagos, designer fashion Lagos, luxury bags Nigeria, imported luxury products Nigeria, premium fashion store Lagos')
    setProperty('og:title', title)
    setProperty('og:description', description)
    setProperty('og:url', `${SITE_URL}${page}`)

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${SITE_URL}${page}`
  }, [location.pathname])

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
    if (!measurementId || document.getElementById('google-analytics-script')) return

    const script = document.createElement('script')
    script.id = 'google-analytics-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    const inline = document.createElement('script')
    inline.id = 'google-analytics-config'
    inline.text = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}', { send_page_view: true });`
    document.head.appendChild(inline)
  }, [])

  useEffect(() => {
    const updateImageAlt = () => {
      document.querySelectorAll('img').forEach((img) => {
        if (img.alt?.trim()) return
        const source = img.currentSrc || img.src
        const type = source.match(/(bag|shoe|jewel|shade|glass|cloth|dress|fashion)/i)?.[1]?.toLowerCase()
        const label = type === 'bag' ? 'luxury bag' : type === 'shoe' ? 'luxury shoes' : type?.includes('jewel') ? 'luxury jewelry' : type === 'shade' || type === 'glass' ? 'fashion shades' : type?.includes('cloth') || type === 'dress' || type === 'fashion' ? 'premium fashion' : 'luxury fashion'
        img.alt = `${label} from BHS Skales in Lagos, Nigeria`
      })
    }
    updateImageAlt()
    const observer = new MutationObserver(updateImageAlt)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    const injectProductSchema = async () => {
      if (location.pathname !== '/collection') return
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (cancelled || !data?.length) return

      const products = data as Product[]
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: "BHS Skales Luxury Product Collection",
        url: `${SITE_URL}/collection`,
        itemListElement: products.map((product, index) => {
          const salePrice = getSalePrice(product.price, product.discount_percent)
          const image = product.images?.[0] ? getImageUrl(product.images[0]) : undefined
          return {
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.name,
              description: product.description || `${product.category} from BHS Skales, luxury imports serving Lagos, Nigeria.`,
              image: image ? [image] : undefined,
              category: product.category,
              brand: { '@type': 'Brand', name: "BHS Skales" },
              offers: {
                '@type': 'Offer',
                priceCurrency: 'NGN',
                price: salePrice,
                availability: product.status === 'SOLD OUT' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                url: `${SITE_URL}/collection`,
              },
            },
          }
        }),
      }

      let script = document.getElementById('product-structured-data') as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = 'product-structured-data'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(jsonLd)
    }

    injectProductSchema()
    return () => {
      cancelled = true
      document.getElementById('product-structured-data')?.remove()
    }
  }, [location.pathname])

  return null
}

function SiteChrome() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) return null

  return (
    <>
      <Header />
      <CartDrawer />
      <Footer />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <NavigationScrollManager />
        <SeoEnhancer />
        <SiteChrome />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>,
)
