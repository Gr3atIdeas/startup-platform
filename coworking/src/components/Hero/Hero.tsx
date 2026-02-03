import { useEffect, useRef } from 'react'
import { gsap } from '../../utils/gsapSetup'

/* Simple rocket SVG inspired by the Gi mural */
function Rocket({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" style={style}>
      {/* Flame */}
      <ellipse cx="100" cy="295" rx="22" ry="25" fill="#FFD233" opacity="0.9" />
      <ellipse cx="100" cy="300" rx="14" ry="18" fill="#E84B5A" opacity="0.85" />
      {/* Body */}
      <path d="M70 260 C70 260 65 140 100 50 C135 140 130 260 130 260 Z" fill="#4A90D9" />
      <path d="M80 260 C80 260 78 150 100 65 C122 150 120 260 120 260 Z" fill="#5BA0E8" />
      {/* Nose cone */}
      <ellipse cx="100" cy="68" rx="18" ry="22" fill="#E84B5A" />
      <ellipse cx="100" cy="62" rx="12" ry="14" fill="#F06070" />
      {/* Window */}
      <circle cx="100" cy="140" r="22" fill="#1E1E2F" />
      <circle cx="100" cy="140" r="17" fill="#6B4BCC" />
      <circle cx="100" cy="140" r="12" fill="#EDE8FC" />
      <ellipse cx="95" cy="135" rx="5" ry="6" fill="#fff" opacity="0.6" />
      {/* Fins */}
      <path d="M70 230 L45 270 L70 260 Z" fill="#E84B5A" />
      <path d="M130 230 L155 270 L130 260 Z" fill="#E84B5A" />
      {/* Stripe details */}
      <rect x="85" y="180" width="30" height="4" rx="2" fill="#FFD233" />
      <rect x="85" y="195" width="30" height="4" rx="2" fill="#FFD233" />
    </svg>
  )
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(
      el.querySelector('.hero-title'),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9 }
    )
      .fromTo(
        el.querySelector('.hero-subtitle'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.4'
      )
      .fromTo(
        el.querySelector('.hero-actions'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      )
      .fromTo(
        el.querySelector('.hero-rocket'),
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.6'
      )

    // Gentle floating for rocket
    gsap.to(el.querySelector('.hero-rocket'), {
      y: -12, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut',
    })

    return () => { tl.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #F7F5FF 0%, #EDE8FC 40%, #E6F0FB 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles — like bubbles/planets from the mural */}
      <div style={{
        position: 'absolute', top: '8%', right: '12%',
        width: '180px', height: '180px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #FFD233 0%, #FFE680 100%)',
        opacity: 0.2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '5%',
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #4A90D9 0%, #87BFFF 100%)',
        opacity: 0.15, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '60%', right: '3%',
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #E84B5A 0%, #FF8A94 100%)',
        opacity: 0.12, pointerEvents: 'none',
      }} />

      {/* Soft dot pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(107,75,204,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr auto',
        alignItems: 'center', gap: '40px',
        paddingTop: '100px', paddingBottom: '80px',
      }}>
        <div>
          <h1
            className="hero-title"
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
              fontWeight: 800,
              color: 'var(--color-text)',
              lineHeight: 1.1,
              marginBottom: '24px',
              maxWidth: '600px',
              opacity: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Gi-коворкинг
            <br />
            <span style={{ color: 'var(--color-primary)' }}>
              Great Ideas
            </span>
            <span style={{ color: 'var(--color-yellow)', fontSize: '0.5em', verticalAlign: 'super' }}> ✦</span>
          </h1>

          <p
            className="hero-subtitle"
            style={{
              fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '500px',
              lineHeight: 1.7,
              marginBottom: '40px',
              opacity: 0,
            }}
          >
            Пространство, где идеи превращаются в стартапы.
            Индустриальный лофт в центре Краснодара для тех, кто запускает проекты.
          </p>

          <div className="hero-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', opacity: 0 }}>
            <a href="#booking" className="btn btn-primary" style={{
              fontSize: '1.0625rem',
              padding: '16px 36px',
            }}>
              Забронировать место
            </a>
            <a href="#gallery" className="btn btn-outline">
              Смотреть обзор
            </a>
          </div>
        </div>

        {/* Rocket illustration */}
        <div className="hero-rocket" style={{ opacity: 0 }}>
          <Rocket style={{ width: '200px', height: 'auto' }} />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .container { grid-template-columns: 1fr !important; }
          .hero-rocket { display: flex; justify-content: center; }
          .hero-rocket svg { width: 140px !important; }
        }
      `}</style>
    </section>
  )
}
