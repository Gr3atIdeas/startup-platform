// JavaScript для эффектов кнопок
document.addEventListener('DOMContentLoaded', function() {
  // Эффект для кнопки Position Aware (btn-6)
  const positionAwareButtons = document.querySelectorAll('.btn-6');
  
  positionAwareButtons.forEach(function(button) {
    // Добавляем span для эффекта, если его еще нет
    if (!button.querySelector('span')) {
      const span = document.createElement('span');
      button.appendChild(span);
    }
    
    // Обработчик события при наведении мыши
    button.addEventListener('mouseenter', function(e) {
      const parentOffset = button.getBoundingClientRect();
      const relX = e.pageX - parentOffset.left - window.scrollX;
      const relY = e.pageY - parentOffset.top - window.scrollY;
      const span = this.querySelector('span');
      
      span.style.top = relY + 'px';
      span.style.left = relX + 'px';
    });
    
    // Обработчик события при перемещении мыши
    button.addEventListener('mousemove', function(e) {
      const parentOffset = button.getBoundingClientRect();
      const relX = e.pageX - parentOffset.left - window.scrollX;
      const relY = e.pageY - parentOffset.top - window.scrollY;
      const span = this.querySelector('span');
      
      span.style.top = relY + 'px';
      span.style.left = relX + 'px';
    });
  });
}); 