export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-text)',
      color: 'rgba(255,255,255,0.7)',
      padding: '48px 0 32px',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '40px',
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
              Gi<span style={{ color: '#FFD233' }}>...</span> <span style={{ fontWeight: 400, fontSize: '0.875rem' }}>Great Ideas</span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
              Пространство для работы, встреч и запуска стартапов в Краснодаре.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Навигация</div>
            {['О нас', 'Услуги', 'Галерея', 'Бронирование', 'Контакты'].map((item) => (
              <a
                key={item}
                href={`#${item === 'О нас' ? 'about' : item === 'Услуги' ? 'services' : item === 'Галерея' ? 'gallery' : item === 'Бронирование' ? 'booking' : 'contacts'}`}
                style={{
                  display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem',
                  padding: '4px 0', textDecoration: 'none',
                }}
              >
                {item}
              </a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Контакты</div>
            <p style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Краснодар, Уральская 75/6</p>
            <p style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Пн-Пт: 9:00 — 21:00</p>
            <p style={{ fontSize: '0.875rem' }}>Сб-Вс: 10:00 — 18:00</p>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px', textAlign: 'center', fontSize: '0.8125rem',
        }}>
          &copy; {new Date().getFullYear()} Gi-коворкинг. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
