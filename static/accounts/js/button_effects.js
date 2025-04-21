/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

$(function() {  
  // Выбираем все элементы, к которым нужно применить эффект
  const elements = 'button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a';
  
  // Инициализация элементов при загрузке
  initializeElements();
  
  // Функция инициализации элементов
  function initializeElements() {
    $(elements).each(function() {
      // Пропускаем элементы, у которых уже есть span
      if ($(this).find('span').length === 0) {
        $(this).append('<span></span>');
      }
    });
    
    // Добавляем обработчики событий
    $(elements)
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
  }
  
  // Обработка AJAX-запросов
  $(document).on('ajaxComplete', function() {
    initializeElements();
  });
  
  // Наблюдение за изменениями DOM
  const observer = new MutationObserver(function(mutations) {
    let shouldInit = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldInit = true;
      }
    });
    
    if (shouldInit) {
      initializeElements();
    }
  });
  
  // Настраиваем наблюдение за всем документом
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  /* Поддержка прокрутки страницы */
  window.addEventListener('scroll', function() {
    // Запускаем с небольшой задержкой для оптимизации производительности
    if (!window.positionAwareScrollTimeout) {
      window.positionAwareScrollTimeout = setTimeout(function() {
        initializeElements();
        window.positionAwareScrollTimeout = null;
      }, 100);
    }
  });
}); 