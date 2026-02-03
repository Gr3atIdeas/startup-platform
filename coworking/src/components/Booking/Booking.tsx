import { useCallback, useEffect, useRef } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

const YCLIENTS_COMPANY_ID = '1521273'

export default function Booking() {
  const widgetRef = useRef<HTMLDivElement>(null)

  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.booking-content'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7 }
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 80%' })

  useEffect(() => {
    // Load YClients widget script
    const existingScript = document.querySelector('script[src*="yclients.com"]')
    if (existingScript) return

    const script = document.createElement('script')
    script.src = 'https://w.yclients.com/widget/loader.js'
    script.async = true
    script.onload = () => {
      // Initialize widget after script loads
      if ((window as any).YCWidget) {
        (window as any).YCWidget.init({
          company_id: YCLIENTS_COMPANY_ID,
          container: '#yclients-widget',
        })
      }
    }
    document.body.appendChild(script)
  }, [])

  return (
    <section id="booking" ref={ref} className="section" style={{ background: 'var(--color-bg-alt)' }}>
      <div className="container">
        <div className="booking-content" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', opacity: 0 }}>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Бронирование</h2>
          <p className="section-subtitle" style={{ margin: '0 auto 40px' }}>
            Забронируйте рабочее место или переговорную онлайн
          </p>

          {/* YClients widget container */}
          <div
            id="yclients-widget"
            ref={widgetRef}
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow)',
              padding: '24px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />

          {/* Fallback link button */}
          <a
            href={`https://n1701102.yclients.com/company/${YCLIENTS_COMPANY_ID}/personal/select-services?o=m`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ marginTop: '24px', fontSize: '1.0625rem', padding: '16px 36px' }}
          >
            Записаться через YClients
          </a>
        </div>
      </div>
    </section>
  )
}
