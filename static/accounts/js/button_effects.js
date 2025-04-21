/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

$(function() {  
  $('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .join-button, .login-btn, .create-startup-btn, .logout-btn, .detail-button, .show-button, .nav-menu a')
    .on('mouseenter', function(e) {
      var parentOffset = $(this).offset(),
          relX = e.pageX - parentOffset.left,
          relY = e.pageY - parentOffset.top;
      $(this).find('span').css({top:relY, left:relX})
    })
    .on('mouseout', function(e) {
      var parentOffset = $(this).offset(),
          relX = e.pageX - parentOffset.left,
          relY = e.pageY - parentOffset.top;
      $(this).find('span').css({top:relY, left:relX})
    });
});

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