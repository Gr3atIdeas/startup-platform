import { useCallback, useState } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

const BASE = import.meta.env.BASE_URL

const mediaItems = [
  { type: 'photo' as const, src: `${BASE}media/photo1.jpg`, label: 'Индустриальный интерьер', span: 'tall' },
  { type: 'photo' as const, src: `${BASE}media/photo3.jpg`, label: 'Дизайн пространства', span: 'normal' },
  { type: 'video' as const, src: `${BASE}media/tour.mp4`, label: 'Обзор коворкинга', span: 'tall' },
  { type: 'photo' as const, src: `${BASE}media/photo4.jpg`, label: 'Архитектура лофта', span: 'normal' },
  { type: 'photo' as const, src: `${BASE}media/photo2.jpg`, label: 'Технологии и стиль', span: 'normal' },
]

export default function Gallery() {
  const [activeVideo, setActiveVideo] = useState(false)

  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.gallery-header'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6 }
    )
    const items = el.querySelectorAll('.gallery-item')
    tl.fromTo(
      items,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
      '-=0.2'
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 75%' })

  return (
    <section id="gallery" ref={ref} className="section" style={{ background: 'var(--color-bg-alt)' }}>
      <div className="container">
        <div className="gallery-header" style={{ textAlign: 'center', marginBottom: '48px', opacity: 0 }}>
          <h2 className="section-title">
            Галерея <span style={{ color: 'var(--color-blue)' }}>✦</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Загляните в наше пространство
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: '200px',
          gap: '16px',
        }} className="gallery-grid">
          {mediaItems.map((item, i) => (
            <div
              key={i}
              className="gallery-item"
              style={{
                borderRadius: 'var(--border-radius)',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                opacity: 0,
                gridRow: item.span === 'tall' ? 'span 2' : 'span 1',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(107,75,204,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
            >
              {item.type === 'video' ? (
                <div
                  style={{ width: '100%', height: '100%', position: 'relative', background: '#1E1E2F' }}
                  onClick={() => setActiveVideo(!activeVideo)}
                >
                  <video
                    src={item.src}
                    autoPlay={activeVideo}
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    ref={(el) => { if (el && activeVideo) el.play() }}
                  />
                  {!activeVideo && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(30,30,47,0.35)',
                    }}>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(107,75,204,0.4)',
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <polygon points="8,5 20,12 8,19" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: 'var(--color-red)', fontSize: '0.6875rem',
                    fontWeight: 600, color: '#fff',
                  }}>
                    VIDEO
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={item.src}
                    alt={item.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 55%, rgba(30,30,47,0.65) 100%)',
                    pointerEvents: 'none',
                    display: 'flex', alignItems: 'flex-end', padding: '16px',
                  }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                      {item.label}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 180px !important; }
          }
          @media (max-width: 480px) {
            .gallery-grid { grid-template-columns: 1fr !important; grid-auto-rows: 220px !important; }
          }
        `}</style>
      </div>
    </section>
  )
}
