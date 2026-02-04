import { useCallback } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

const BASE = import.meta.env.BASE_URL

const photos = [
  { src: `${BASE}media/photo1.webp`, label: 'Индустриальный интерьер' },
  { src: `${BASE}media/photo3.webp`, label: 'Дизайн пространства' },
  { src: `${BASE}media/photo4.webp`, label: 'Архитектура лофта' },
  { src: `${BASE}media/photo2.webp`, label: 'Технологии и стиль' },
]

export default function Gallery() {
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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }} className="gallery-grid">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="gallery-item"
              style={{
                borderRadius: 'var(--border-radius)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow)',
                opacity: 0,
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
              <img
                src={photo.src}
                alt={photo.label}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(180deg, transparent 0%, rgba(30,30,47,0.65) 100%)',
                pointerEvents: 'none',
                padding: '16px',
              }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                  {photo.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 480px) {
            .gallery-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  )
}
