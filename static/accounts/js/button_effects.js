/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

// Функция для применения эффекта Position Aware ко всем кнопкам
function applyPositionAwareEffect() {
  // Выбираем все элементы кнопок и навигации
  const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .join-button, .login-btn, .create-startup-btn, .logout-btn, .detail-button, .show-button, .nav-menu a');
  
  buttons.forEach(button => {
    // Проверяем, не был ли эффект уже применен
    if (button.dataset.effectApplied === 'true') {
      return;
    }
    
    // Добавляем span для эффекта, если его еще нет
    if (!button.querySelector('span')) {
      const span = document.createElement('span');
      button.appendChild(span);
    }
    
    // Обработчик при наведении мыши
    button.addEventListener('mouseenter', function(e) {
      const span = this.querySelector('span');
      if (span) {
        const buttonRect = this.getBoundingClientRect();
        const offsetX = e.clientX - buttonRect.left;
        const offsetY = e.clientY - buttonRect.top;
        
        span.style.left = offsetX + 'px';
        span.style.top = offsetY + 'px';
        
        // Рассчитываем размер эффекта, чтобы покрыть всю кнопку
        const maxWidth = Math.max(buttonRect.width, buttonRect.height) * 2.5;
        span.style.width = maxWidth + 'px';
        span.style.height = maxWidth + 'px';
        
        // Устанавливаем правильный цвет текста при наведении
        if (this.classList.contains('btn-primary') || 
            this.classList.contains('create-startup-btn') || 
            this.classList.contains('catalog-search-btn') || 
            this.classList.contains('detail-button') ||
            this.classList.contains('show-button')) {
          this.style.color = '#FFFFFF';
        }
      }
    });
    
    // Обработчик движения мыши
    button.addEventListener('mousemove', function(e) {
      const span = this.querySelector('span');
      if (span) {
        const buttonRect = this.getBoundingClientRect();
        span.style.left = (e.clientX - buttonRect.left) + 'px';
        span.style.top = (e.clientY - buttonRect.top) + 'px';
      }
    });
    
    // Обработчик выхода мыши
    button.addEventListener('mouseleave', function() {
      const span = this.querySelector('span');
      if (span) {
        span.style.width = '0';
        span.style.height = '0';
        
        // Возвращаем оригинальный цвет текста
        this.style.color = '';
      }
    });
    
    // Отмечаем, что эффект применен
    button.dataset.effectApplied = 'true';
  });
}

// Запускаем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  applyPositionAwareEffect();
  
  // Периодически проверяем новые кнопки, которые могли быть добавлены динамически
  setInterval(applyPositionAwareEffect, 2000);
  
  // Настраиваем MutationObserver для отслеживания изменений в DOM
  const observer = new MutationObserver((mutations) => {
    let shouldApply = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldApply = true;
      }
    });
    
    if (shouldApply) {
      applyPositionAwareEffect();
    }
  });
  
  // Начинаем отслеживать изменения в документе
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Экспортируем функцию для возможности вызова из других скриптов
window.applyPositionAwareEffect = applyPositionAwareEffect; 