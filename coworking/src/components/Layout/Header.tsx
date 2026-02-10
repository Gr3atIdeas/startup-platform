import { useState, useEffect } from 'react'
import { trackButtonClick } from '../../utils/metrika'

const navLinks = [
  { href: '#about', label: 'О нас' },
  { href: '#services', label: 'Услуги' },
  { href: '#gallery', label: 'Галерея' },
  { href: '#booking', label: 'Бронирование' },
  { href: '#contacts', label: 'Контакты' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      boxShadow: scrolled ? '0 1px 3px rgba(107,75,204,0.06)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--color-primary)',
          textDecoration: 'none',
        }}>
          Gi<span style={{ color: 'var(--color-yellow)' }}>...</span>
        </a>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="desktop-nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#booking"
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.875rem' }}
            onClick={() => trackButtonClick('header_booking')}
          >
            Забронировать
          </a>
        </nav>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
            {menuOpen
              ? <path d="M6 6l12 12M6 18L18 6" />
              : <path d="M3 6h18M3 12h18M3 18h18" />
            }
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: 'var(--header-height)',
          left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px 0',
        }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '12px 24px',
                color: 'var(--color-text)', fontSize: '1rem', fontWeight: 500, textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  )
}
