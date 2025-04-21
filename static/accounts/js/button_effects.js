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
      
      // Добавляем span, если его нет
      if ($(this).find('span').length === 0) {
        $(this).append('<span></span>');
      }
      
      // Определяем, нужно ли менять цвет текста
      var shouldChangeTextColor = !$(this).hasClass('login-btn') && 
                                !$(this).hasClass('join-button') && 
                                !$(this).hasClass('btn-secondary');
      
      // Устанавливаем позицию для span
      $(this).find('span').css({top:relY, left:relX});
      
      // Рассчитываем размер эффекта, чтобы покрыть всю кнопку
      var maxWidth = Math.max($(this).width(), $(this).height()) * 2.5;
      $(this).find('span').width(maxWidth).height(maxWidth);
      
      // Меняем цвет текста на белый для синих кнопок
      if (shouldChangeTextColor) {
        $(this).css('color', '#FFFFFF');
      }
    })
    .on('mousemove', function(e) {
      var parentOffset = $(this).offset(),
          relX = e.pageX - parentOffset.left,
          relY = e.pageY - parentOffset.top;
      $(this).find('span').css({top:relY, left:relX});
    })
    .on('mouseleave', function(e) {
      // Определяем, нужно ли менять цвет текста
      var shouldChangeTextColor = !$(this).hasClass('login-btn') && 
                                !$(this).hasClass('join-button') && 
                                !$(this).hasClass('btn-secondary');
      
      // Сбрасываем размер span
      $(this).find('span').width(0).height(0);
      
      // Возвращаем оригинальный цвет текста
      if (shouldChangeTextColor) {
        $(this).css('color', '#000000');
      }
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