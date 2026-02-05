import { useCallback } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

const YCLIENTS_COMPANY_ID = '1521273'
const BOOKING_URL = `https://n1701102.yclients.com/company/${YCLIENTS_COMPANY_ID}/personal/select-services?o=m`

const prices = [
  { name: 'Рабочее место', price: 'от 400 ₽/час', subprice: '1 300 ₽/день' },
  { name: 'Мероприятие', price: 'от 5 000 ₽/час', subprice: null },
  { name: 'Переговорная', price: 'от 1 500 ₽/час', subprice: '7 000 ₽/сутки' },
]

export default function Booking() {
  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.booking-content'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7 }
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 80%' })

  return (
    <section id="booking" ref={ref} className="section" style={{ background: 'var(--color-bg-alt)' }}>
      <div className="container">
        <div className="booking-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', opacity: 0 }}>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Бронирование</h2>
          <p className="section-subtitle" style={{ margin: '0 auto 40px' }}>
            Забронируйте рабочее место или переговорную онлайн
          </p>

          {/* Price summary table */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'var(--color-border)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '40px',
          }}>
            {prices.map((item, idx) => (
              <div
                key={item.name}
                style={{
                  background: 'var(--color-white)',
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-secondary)',
                }}>
                  {item.name}
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: idx === 0 ? 'var(--color-primary)' : idx === 1 ? '#4A90D9' : '#E84B5A',
                }}>
                  {item.price}
                </span>
                {item.subprice && (
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {item.subprice}
                  </span>
                )}
              </div>
            ))}
          </div>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: '1.125rem', padding: '18px 48px' }}
          >
            Записаться
          </a>

          <style>{`
            @media (max-width: 640px) {
              .booking-content > div:first-of-type {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </div>
    </section>
  )
}
