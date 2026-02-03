import { useEffect, useRef } from 'react'
import { gsap } from '../../utils/gsapSetup'

const BASE = import.meta.env.BASE_URL

export default function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })

    tl.fromTo(
      el.querySelector('.vs-text'),
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
    ).fromTo(
      el.querySelector('.vs-video'),
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )

    return () => { tl.kill() }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // Autoplay muted on load
    video.play().catch(() => {})
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#1E1E2F',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        height: '70vh',
        maxHeight: '700px',
      }} className="vs-grid">
        {/* Text side */}
        <div
          className="vs-text"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 40px 48px 40px',
            marginRight: '-40px',
            opacity: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#E84B5A',
              animation: 'livePulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E84B5A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Видео-обзор
            </span>
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Загляните
            <br />
            <span style={{ color: '#FFD233' }}>внутрь</span>
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7,
            marginBottom: '28px',
          }}>
            Индустриальный лофт с открытым потолком, бетоном и&nbsp;металлом.
            Пространство, созданное для тех, кто запускает великие идеи.
          </p>

          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { num: '50+', label: 'рабочих мест' },
              { num: '3', label: 'переговорных' },
              { num: '24/7', label: 'доступ' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFD233' }}>{stat.num}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Video side — takes remaining space */}
        <div
          className="vs-video"
          style={{
            position: 'relative',
            opacity: 0,
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            src={`${BASE}media/tour.mp4`}
            muted
            loop
            playsInline
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* Gradient fade from text side */}
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0, width: '80px',
            background: 'linear-gradient(90deg, #1E1E2F, transparent)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .vs-grid {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          .vs-video {
            height: 350px;
            order: -1;
          }
          .vs-text {
            padding: 32px 20px !important;
          }
        }
      `}</style>
    </section>
  )
}
