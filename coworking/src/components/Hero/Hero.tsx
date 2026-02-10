import { useEffect, useRef } from 'react'
import { gsap } from '../../utils/gsapSetup'
import { trackButtonClick } from '../../utils/metrika'

const BASE = import.meta.env.BASE_URL

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
            Коворкинг
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
            <a
              href="#booking"
              className="btn btn-primary"
              style={{
                fontSize: '1.0625rem',
                padding: '16px 36px',
              }}
              onClick={() => trackButtonClick('hero_booking')}
            >
              Забронировать место
            </a>
            <a
              href="#gallery"
              className="btn btn-outline"
              onClick={() => trackButtonClick('hero_gallery')}
            >
              Смотреть обзор
            </a>
          </div>
        </div>

        {/* Rocket illustration */}
        <div className="hero-rocket" style={{ opacity: 0 }}>
          <img src={`${BASE}media/rocket.svg`} alt="Rocket" style={{ width: '400px', height: 'auto' }} />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .container { grid-template-columns: 1fr !important; }
          .hero-rocket { display: flex; justify-content: center; }
          .hero-rocket img { width: 280px !important; }
        }
      `}</style>
    </section>
  )
}
