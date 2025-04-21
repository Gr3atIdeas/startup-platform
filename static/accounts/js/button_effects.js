/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Position Aware effect');
    
    // Сначала удаляем конфликтующие стили
    removeConflictingStyles();
    
    // Затем инициализируем эффект
    setTimeout(function() {
        initPositionAware();
        
        // Наблюдатель за изменениями DOM для динамически добавленных элементов
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    initPositionAware();
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }, 100);
    
    // Обработка AJAX запросов
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOnLoad = xhr.onload;
        
        xhr.onload = function() {
            if (originalOnLoad) {
                originalOnLoad.apply(this, arguments);
            }
            removeConflictingStyles();
            setTimeout(initPositionAware, 100);
        };
        
        return xhr;
    };
});

// Функция удаления конфликтующих стилей
function removeConflictingStyles() {
    console.log('Removing conflicting styles');
    
    // CSS для очистки и перезаписи стилей кнопок
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        button, .btn, input[type="submit"], input[type="button"],
        .catalog-search-btn, .show-button, .detail-button,
        .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a {
            transition: none !important;
            transform: none !important;
        }
        
        button span, .btn span, input[type="submit"] span, input[type="button"] span,
        .catalog-search-btn span, .show-button span, .detail-button span,
        .join-button span, .login-btn span, .create-startup-btn span, 
        .logout-btn span, .nav-menu a span {
            position: absolute !important;
            display: block !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            z-index: -1 !important;
            transition: none !important;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Удаляем все трансформации и переходы, которые могут конфликтовать с эффектом
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a');
    
    buttons.forEach(button => {
        // Сбрасываем все стили, которые могут мешать эффекту
        button.style.removeProperty('transition');
        button.style.removeProperty('transform');
        
        // Проверяем наличие span и создаем его, если нужно
        let waveSpan = button.querySelector('span');
        if (!waveSpan) {
            waveSpan = document.createElement('span');
            button.appendChild(waveSpan);
        }
        
        // Устанавливаем базовые стили для span
        waveSpan.style.position = 'absolute';
        waveSpan.style.display = 'block';
        waveSpan.style.width = '0';
        waveSpan.style.height = '0';
        waveSpan.style.borderRadius = '50%';
        waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
        waveSpan.style.opacity = '0';
        waveSpan.style.pointerEvents = 'none';
        waveSpan.style.zIndex = '-1';
    });

    // Повторная инициализация после очистки
    setTimeout(initPositionAware, 10);
}

// Оптимизация прокрутки
let scrollTimeout;
window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
        initPositionAware();
    }, 200);
}, { passive: true });

function initPositionAware() {
    console.log('Initializing Position Aware buttons');
    
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a');
    
    buttons.forEach(button => {
        // Пропускаем уже обработанные кнопки
        if (button.hasAttribute('data-position-aware-initialized')) return;
        
        // Удаление предыдущих обработчиков событий для избежания дублирования
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
        button.removeEventListener('touchstart', handleTouchStart);
        
        // Проверяем существование элемента span для волнового эффекта
        let waveSpan = button.querySelector('span');
        if (!waveSpan) {
            waveSpan = document.createElement('span');
            button.appendChild(waveSpan);
        }
        
        // Установка базовых стилей для span элемента
        waveSpan.style.position = 'absolute';
        waveSpan.style.display = 'block';
        waveSpan.style.width = '0';
        waveSpan.style.height = '0';
        waveSpan.style.borderRadius = '50%';
        waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
        waveSpan.style.opacity = '0';
        waveSpan.style.pointerEvents = 'none';
        waveSpan.style.zIndex = '-1';
        
        // Добавляем обработчики событий
        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);
        button.addEventListener('touchstart', handleTouchStart);
        
        // Помечаем кнопку как обработанную
        button.setAttribute('data-position-aware-initialized', 'true');
    });
}

function handleMouseEnter(e) {
    const button = e.currentTarget;
    const waveSpan = button.querySelector('span');
    if (!waveSpan) return;
    
    // Получение координат курсора относительно кнопки
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Расчет диаметра волны, чтобы покрыть всю кнопку
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;
    const diameter = Math.max(buttonWidth * 2.5, buttonHeight * 2.5);
    
    // Анимация волны
    waveSpan.style.width = `${diameter}px`;
    waveSpan.style.height = `${diameter}px`;
    waveSpan.style.left = `${x}px`;
    waveSpan.style.top = `${y}px`;
    waveSpan.style.transform = 'translate(-50%, -50%) scale(1)';
    
    // Настройка цвета и анимации в зависимости от типа кнопки
    if (button.classList.contains('login-btn')) {
        waveSpan.style.backgroundColor = 'rgba(255, 239, 43, 0.8)';
    } else if (button.classList.contains('create-startup-btn')) {
        waveSpan.style.backgroundColor = 'rgba(123, 97, 255, 0.8)';
    } else if (button.classList.contains('logout-btn')) {
        waveSpan.style.backgroundColor = 'rgba(255, 107, 107, 0.8)';
    } else if (button.classList.contains('active')) {
        waveSpan.style.backgroundColor = 'rgba(123, 97, 255, 0.2)';
    } else if (button.classList.contains('show-button') || 
               button.classList.contains('detail-button') ||
               button.classList.contains('catalog-search-btn')) {
        waveSpan.style.backgroundColor = 'rgba(123, 97, 255, 0.4)';
    } else {
        waveSpan.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    }
    
    waveSpan.style.transition = 'width 0.5s ease-out, height 0.5s ease-out, opacity 0.5s ease-out';
    waveSpan.style.opacity = '1';
}

function handleMouseLeave(e) {
    const waveSpan = e.currentTarget.querySelector('span');
    if (waveSpan) {
        waveSpan.style.transition = 'all 0.5s ease-out';
        waveSpan.style.opacity = '0';
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;
    const diameter = Math.max(buttonWidth * 3, buttonHeight * 3);
    
    const waveSpan = button.querySelector('span');
    if (!waveSpan) return;
    
    waveSpan.style.width = `${diameter}px`;
    waveSpan.style.height = `${diameter}px`;
    waveSpan.style.left = `${x}px`;
    waveSpan.style.top = `${y}px`;
    
    // Анимация для тач-устройств
    if (button.classList.contains('login-btn')) {
        waveSpan.style.backgroundColor = 'rgba(255, 239, 43, 0.8)';
    } else if (button.classList.contains('create-startup-btn')) {
        waveSpan.style.backgroundColor = 'rgba(123, 97, 255, 0.8)';
    } else if (button.classList.contains('logout-btn')) {
        waveSpan.style.backgroundColor = 'rgba(255, 107, 107, 0.8)';
    } else if (button.classList.contains('show-button') || 
               button.classList.contains('detail-button') ||
               button.classList.contains('catalog-search-btn')) {
        waveSpan.style.backgroundColor = 'rgba(123, 97, 255, 0.4)';
    } else {
        waveSpan.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    }
    
    waveSpan.style.transform = 'translate(-50%, -50%) scale(1)';
    waveSpan.style.transition = 'width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out';
    waveSpan.style.opacity = '1';
    
    // Скрытие волны через 800мс
    setTimeout(() => {
        waveSpan.style.opacity = '0';
    }, 800);
} 