import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white mt-16 pb-24">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              {/* Prefer public root /logo.png so build won't fail if asset isn't imported */}
              <img src="/logo.png" alt="BHS Skales" className="w-14 h-14 rounded-full object-cover shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div>
                <div className="text-lg font-semibold">BHS Skales</div>
                <div className="text-sm text-neutral-400">Cleared for Lagos</div>
              </div>
            </div>
            <p className="text-sm text-neutral-300 leading-6">A curated import house drawing from the finest fashion markets of Dubai, Milan, Istanbul, and Paris, delivered with precision to your door in Lagos.</p>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-lg font-semibold text-white mb-4">Quick Links</div>
            <nav className="flex flex-col gap-2">
              <Link to="/#arrivals" className="text-neutral-300 hover:text-amber-400 transition-colors">Arrivals</Link>
              <Link to="/collection" className="text-neutral-300 hover:text-amber-400 transition-colors">Collection</Link>
              <Link to="/#about" className="text-neutral-300 hover:text-amber-400 transition-colors">About Us</Link>
              <Link to="/#contact" className="text-neutral-300 hover:text-amber-400 transition-colors">Contact</Link>
            </nav>
          </div>

          {/* Contact & Socials */}
          <div>
            <div className="text-lg font-semibold text-white mb-4">Contact</div>
            <div className="flex flex-col gap-1 mb-4 text-sm">
              <div className="text-neutral-400">Phone:</div>
              <a href="tel:+2347045207918" className="text-amber-400 font-semibold hover:opacity-90">+234 704 520 7918</a>
              <div className="mt-2 text-neutral-400">Email:</div>
              <a href="mailto:hello@bhsskales.com" className="text-amber-400 hover:text-amber-500 transition-colors">hello@bhsskales.com</a>
            </div>

            <div className="text-lg font-semibold text-white mb-3">Follow Us</div>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 p-2 rounded-lg text-neutral-300 hover:text-amber-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
              </svg>
              </a>

              <a href="https://wa.me/2347045207918" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 p-2 rounded-lg text-neutral-300 hover:text-amber-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              </a>

              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 p-2 rounded-lg text-neutral-300 hover:text-amber-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden="true">
                <path d="M9 19V6l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
              </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-800 mt-8 pt-6 text-center">
          <div className="text-sm text-neutral-400">© 2026 BHS Skales. All rights reserved.</div>
          <div className="mt-2"><Link to="/admin/login" className="text-neutral-500 hover:text-neutral-300 text-xs">Admin Login</Link></div>
        </div>
      </div>
    </footer>
  )
}
