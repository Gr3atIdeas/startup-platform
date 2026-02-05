interface ServiceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  price: string
  accent?: string
  accentDark?: string
}

export default function ServiceCard({ icon, title, description, price, accent = 'var(--color-primary-light)', accentDark = 'var(--color-primary)' }: ServiceCardProps) {
  return (
    <div className="service-card" style={{
      background: 'var(--color-white)',
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--shadow)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'default',
      opacity: 0,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        const bg = e.currentTarget.querySelector('.sc-icon-bg') as HTMLElement
        if (bg) bg.style.transform = 'scale(1.1) rotate(5deg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
        const bg = e.currentTarget.querySelector('.sc-icon-bg') as HTMLElement
        if (bg) bg.style.transform = 'scale(1) rotate(0deg)'
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: '4px',
        background: accentDark,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Content area */}
      <div style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header row: title left, icon-badge right */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.2, flex: 1 }}>{title}</h3>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: accent,
            color: accentDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '20px' }}>
          {description}
        </p>

        {/* Price tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: accent,
          borderRadius: '8px',
          marginBottom: '20px',
          alignSelf: 'flex-start',
        }}>
          <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: accentDark }}>
            {price}
          </span>
        </div>

        {/* CTA button */}
        <a href="#booking" className="btn btn-primary" style={{
          padding: '12px 28px',
          fontSize: '0.9375rem',
          marginTop: 'auto',
          alignSelf: 'flex-start',
        }}>
          Выбрать
        </a>
      </div>

      {/* Large decorative background icon */}
      <div
        className="sc-icon-bg"
        style={{
          position: 'absolute',
          bottom: '-10px',
          right: '-10px',
          width: '120px',
          height: '120px',
          opacity: 0.06,
          color: accentDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          transition: 'transform 0.4s ease',
          transform: 'scale(1) rotate(0deg)',
        }}
      >
        <div style={{ transform: 'scale(4.5)' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
