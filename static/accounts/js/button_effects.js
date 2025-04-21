/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

/* Функция для настройки эффекта Position Aware */
function setupPositionAwareEffect(context = document) {
    // Выбираем все элементы, к которым нужно применить эффект
    const elements = context.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a');

    elements.forEach(element => {
        // Пропускаем элементы, у которых уже есть эффект
        if (element.classList.contains('position-aware-initialized')) {
            return;
        }

        // Добавляем класс position-aware, если его нет
        if (!element.classList.contains('position-aware')) {
            element.classList.add('position-aware');
        }

        // Создаем элемент для эффекта, если его нет
        let effectElement = element.querySelector('.position-aware-effect');
        if (!effectElement) {
            effectElement = document.createElement('span');
            effectElement.className = 'position-aware-effect';
            element.appendChild(effectElement);
        }

        // Добавляем обработчик события наведения мыши
        element.addEventListener('mouseenter', function(e) {
            // Получаем позицию курсора относительно кнопки
            const x = e.pageX - this.offsetLeft;
            const y = e.pageY - this.offsetTop;
            
            // Устанавливаем позицию эффекта
            effectElement.style.left = x + 'px';
            effectElement.style.top = y + 'px';
        });

        // Добавляем обработчик события движения мыши
        element.addEventListener('mousemove', function(e) {
            // Получаем позицию курсора относительно кнопки
            const x = e.pageX - this.offsetLeft;
            const y = e.pageY - this.offsetTop;
            
            // Обновляем позицию эффекта
            effectElement.style.left = x + 'px';
            effectElement.style.top = y + 'px';
        });

        // Помечаем элемент как инициализированный
        element.classList.add('position-aware-initialized');
    });
}

/* Функция для обновления эффектов при изменении DOM */
function updateEffects() {
    setupPositionAwareEffect();
}

/* Инициализация эффектов при загрузке страницы */
document.addEventListener('DOMContentLoaded', function() {
    setupPositionAwareEffect();
    
    // Наблюдаем за изменениями в DOM для динамически добавляемых элементов
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Проверяем, что это элемент
                        setupPositionAwareEffect(node);
                        if (node.querySelectorAll) {
                            setupPositionAwareEffect(node);
                        }
                    }
                });
            }
        });
    });
    
    // Настраиваем наблюдение за всем документом
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

/* Дополнительные инициализации для динамически загружаемого контента */
if (typeof jQuery !== 'undefined') {
    jQuery(document).on('ajaxComplete', function() {
        setupPositionAwareEffect();
    });
}

/* Поддержка прокрутки страницы */
window.addEventListener('scroll', function() {
    // Запускаем с небольшой задержкой для оптимизации производительности
    if (!window.positionAwareScrollTimeout) {
        window.positionAwareScrollTimeout = setTimeout(function() {
            setupPositionAwareEffect();
            window.positionAwareScrollTimeout = null;
        }, 100);
    }
});

// Экспортируем функцию для возможности вызова из других скриптов
window.applyPositionAwareEffect = applyPositionAwareEffect; 