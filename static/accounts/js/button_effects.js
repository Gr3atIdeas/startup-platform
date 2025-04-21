// Эффект Position Aware для всех кнопок
document.addEventListener("DOMContentLoaded", function() {
  // Находим все кнопки на странице
  const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .footer-join-btn, .header-btn');
  
  // Для каждой кнопки добавляем обработчики событий
  buttons.forEach(function(button) {
    // Создаем span элемент для эффекта, если его еще нет
    if (!button.querySelector('span')) {
      const span = document.createElement('span');
      button.appendChild(span);
    }
    
    // Получаем span элемент
    const span = button.querySelector('span');
    
    // Обработчик наведения мыши
    button.addEventListener('mouseenter', function(e) {
      // Получаем размеры кнопки для расчета максимального размера круга
      const buttonRect = button.getBoundingClientRect();
      const buttonWidth = buttonRect.width;
      const buttonHeight = buttonRect.height;
      
      // Вычисляем максимальный размер (диагональ прямоугольника)
      const maxSize = Math.sqrt(Math.pow(buttonWidth, 2) + Math.pow(buttonHeight, 2)) * 2;
      
      // Устанавливаем позицию курсора относительно кнопки
      const x = e.clientX - buttonRect.left;
      const y = e.clientY - buttonRect.top;
      
      // Применяем стили к span
      span.style.left = x + 'px';
      span.style.top = y + 'px';
      span.style.width = maxSize + 'px';
      span.style.height = maxSize + 'px';
    });
    
    // Обработчик движения мыши
    button.addEventListener('mousemove', function(e) {
      // Получаем размеры кнопки
      const buttonRect = button.getBoundingClientRect();
      
      // Устанавливаем позицию курсора относительно кнопки
      const x = e.clientX - buttonRect.left;
      const y = e.clientY - buttonRect.top;
      
      // Применяем стили к span
      span.style.left = x + 'px';
      span.style.top = y + 'px';
    });
    
    // Обработчик ухода мыши
    button.addEventListener('mouseleave', function() {
      // Сбрасываем размер span при уходе мыши
      span.style.width = '0';
      span.style.height = '0';
    });
  });
}); 