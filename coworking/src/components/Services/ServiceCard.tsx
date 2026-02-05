interface ServiceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  price: string
  accent?: string
}

export default function ServiceCard({ icon, title, description, price, accent = 'var(--color-primary-light)' }: ServiceCardProps) {
  return (
    <div className="service-card" style={{
      background: 'var(--color-white)',
      borderRadius: 'var(--border-radius)',
      padding: '32px',
      boxShadow: 'var(--shadow)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'default',
      opacity: 0,
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: accent,
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '16px' }}>
        {description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          {price}
        </div>
        <a href="#booking" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.8125rem' }}>
          Выбрать
        </a>
      </div>
    </div>
  )
}
