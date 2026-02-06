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
            style={{ fontSize: '1.125rem', padding: '18px 48px', marginBottom: '32px' }}
          >
            Записаться онлайн
          </a>

          {/* Contact info */}
          <div style={{
            padding: '24px',
            background: 'var(--color-white)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Или свяжитесь с нами напрямую
            </div>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://t.me/Gi_Great_ideas" target="_blank" rel="noopener noreferrer" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.001.321.023.465.141.122.098.155.231.171.324.016.093.036.305.02.469z"/>
                </svg>
                @Gi_Great_ideas
              </a>
              <a href="tel:+79182119418" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                textDecoration: 'none',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                +7 (918) 211-94-18
              </a>
            </div>
          </div>

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
