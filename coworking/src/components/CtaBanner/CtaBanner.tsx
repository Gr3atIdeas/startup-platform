import { useCallback } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

export default function CtaBanner() {
  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.cta-inner'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7 }
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 85%' })

  return (
    <section ref={ref} style={{ padding: '40px 0 0' }}>
      <div className="container">
        <div
          className="cta-inner"
          style={{
            background: 'linear-gradient(135deg, #6B4BCC 0%, #4A90D9 100%)',
            borderRadius: 'var(--border-radius)',
            padding: '56px 48px',
            textAlign: 'center',
            opacity: 0,
          }}
        >
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '12px',
          }}>
            Готовы попробовать?
          </h2>
          <p style={{
            fontSize: '1.0625rem',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '500px',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}>
            Первый день — бесплатно. Приходите, оцените пространство и решите сами.
          </p>
          <a
            href="#booking"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 36px',
              borderRadius: '12px',
              background: '#FFD233',
              color: '#1E1E2F',
              fontSize: '1.0625rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Забронировать бесплатный день
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
