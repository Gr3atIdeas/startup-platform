import { useCallback, useEffect, useRef } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

const YCLIENTS_COMPANY_ID = '1521273'
const BOOKING_URL = `https://n1701102.yclients.com/company/${YCLIENTS_COMPANY_ID}/personal/select-services?o=m`

export default function Booking() {
  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.booking-content'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7 }
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 80%' })
  const widgetReady = useRef(false)

  // Load YClients widget script and init once on load
  useEffect(() => {
    if (document.getElementById('yc-widget-script')) return
    const script = document.createElement('script')
    script.id = 'yc-widget-script'
    script.src = 'https://w.yclients.com/widget/loader.js'
    script.async = true
    script.onload = () => {
      const YC = (window as any).YCWidget
      if (YC) {
        YC.init({ id: YCLIENTS_COMPANY_ID })
        widgetReady.current = true
      }
    }
    document.head.appendChild(script)
  }, [])

  const openPopup = () => {
    const YC = (window as any).YCWidget
    if (widgetReady.current && YC?.open) {
      YC.open()
    } else if (YC) {
      YC.init({ id: YCLIENTS_COMPANY_ID, autoOpen: true })
    } else {
      // Fallback: centered popup window
      const w = 700, h = 800
      const left = (screen.width - w) / 2
      const top = (screen.height - h) / 2
      window.open(BOOKING_URL, 'yclients', `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`)
    }
  }

  return (
    <section id="booking" ref={ref} className="section" style={{ background: 'var(--color-bg-alt)' }}>
      <div className="container">
        <div className="booking-content" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', opacity: 0 }}>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Бронирование</h2>
          <p className="section-subtitle" style={{ margin: '0 auto 40px' }}>
            Забронируйте рабочее место или переговорную онлайн
          </p>

          {/* Popup widget button */}
          <button
            onClick={openPopup}
            className="btn btn-primary"
            style={{ fontSize: '1.0625rem', padding: '16px 36px', marginBottom: '32px' }}
          >
            Записаться (popup)
          </button>

          {/* YClients inline booking form */}
          <div style={{
            borderRadius: 'var(--border-radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}>
            <iframe
              src={BOOKING_URL}
              width="100%"
              height="700"
              style={{ border: 0, display: 'block' }}
              title="Онлайн-запись — Gi-коворкинг"
              allow="payment"
            />
          </div>

          {/* Fallback link in case iframe is blocked */}
          <a
            href={BOOKING_URL}
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
