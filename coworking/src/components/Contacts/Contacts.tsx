import { useCallback } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'

export default function Contacts() {
  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    tl.fromTo(
      el.querySelector('.contacts-info'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7 }
    ).fromTo(
      el.querySelector('.contacts-map'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7 },
      '-=0.4'
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 85%' })

  return (
    <section id="contacts" ref={ref} className="section">
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
          alignItems: 'start',
        }} className="contacts-grid">
          <div className="contacts-info" style={{ opacity: 0 }}>
            <h2 className="section-title">Контакты</h2>
            <p className="section-subtitle" style={{ marginBottom: '32px' }}>
              Приходите к нам или свяжитесь удобным способом
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                  label: 'Адрес',
                  value: 'г. Краснодар, ул. Уральская 75/6',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                  label: 'Часы работы',
                  value: 'Пн-Пт: 9:00 — 21:00 | Сб-Вс: 10:00 — 18:00',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
                  label: 'Email',
                  value: 'info@greatideas.ru',
                  isLink: true,
                },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.label}</div>
                    {item.isLink ? (
                      <a href={`mailto:${item.value}`} style={{ color: 'var(--color-primary)', fontSize: '0.9375rem' }}>
                        {item.value}
                      </a>
                    ) : (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contacts-map" style={{ opacity: 0 }}>
            <div style={{ borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=38.976383%2C45.035470&z=16&pt=38.976383%2C45.035470%2Cpm2blm"
                width="100%"
                height="400"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                title="Карта — Gi-коворкинг"
              />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .contacts-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  )
}
