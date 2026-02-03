import { useCallback } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

const features = [
  'Высокоскоростной Wi-Fi',
  'Эргономичная мебель и освещение',
  'Кухня с кофе и снеками',
  'Принтер и сканер',
  'Локеры для хранения',
  'Круглосуточный доступ',
]

export default function About() {
  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.about-text'),
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.8 }
    ).fromTo(
      el.querySelector('.about-image'),
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.8 },
      '-=0.5'
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 80%' })

  return (
    <section id="about" ref={ref} className="section" style={{ background: 'var(--color-bg)' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }} className="about-grid">
          <div className="about-text" style={{ opacity: 0 }}>
            <h2 className="section-title">
              О нашем
              <br />
              <span style={{ color: 'var(--color-primary)' }}>пространстве</span>
            </h2>
            <p className="section-subtitle" style={{ marginBottom: '28px' }}>
              Gi-коворкинг — это больше, чем просто рабочее место.
              Мы создали пространство, где можно сосредоточиться на главном,
              найти единомышленников и запустить свой проект.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {features.map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    &#10003;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="about-image" style={{ opacity: 0 }}>
            <div style={{
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}media/photo2.jpg`}
                alt="Интерьер Gi-коворкинга"
                style={{
                  width: '100%',
                  height: '480px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .about-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </div>
    </section>
  )
}
