import { useCallback } from 'react'
import { useScrollTrigger } from '../../hooks/useScrollTrigger'
import ServiceCard from './ServiceCard'

const services = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a4 4 0 0 0-8 0v2" />
      </svg>
    ),
    title: 'Рабочее место',
    description: 'Удобный стол с эргономичным креслом, розетками и быстрым Wi-Fi. Идеально для фрилансеров и удалённых сотрудников.',
    price: 'от 500 ₽/день',
    accent: 'var(--color-primary-light)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Выделенное место',
    description: 'Персональное закреплённое рабочее место с локером для вещей. Ваш стол всегда свободен и ждёт вас.',
    price: 'от 8 000 ₽/мес',
    accent: 'var(--color-blue-light)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E84B5A" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Переговорная',
    description: 'Комфортная комната для встреч на 4-8 человек с проектором, доской и видеосвязью.',
    price: 'от 500 ₽/час',
    accent: '#FDEAEC',
  },
]

export default function Services() {
  const animation = useCallback((el: HTMLElement, tl: gsap.core.Timeline) => {
    const cards = el.querySelectorAll('.service-card')
    tl.fromTo(
      el.querySelector('.services-header'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6 }
    ).fromTo(
      cards,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 },
      '-=0.2'
    )
  }, [])

  const ref = useScrollTrigger<HTMLElement>({ animation, start: 'top 75%' })

  return (
    <section id="services" ref={ref} className="section">
      <div className="container">
        <div className="services-header" style={{ textAlign: 'center', marginBottom: '56px', opacity: 0 }}>
          <h2 className="section-title">Наши услуги</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Выберите формат, который подходит именно вам
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  )
}
