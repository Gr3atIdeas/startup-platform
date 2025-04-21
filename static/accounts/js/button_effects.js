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
    
    // Удаляем все трансформации и переходы, которые могут конфликтовать с эффектом
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a');
    
    buttons.forEach(button => {
        // Сбрасываем стили, которые могут мешать эффекту
        button.style.removeProperty('transition');
        button.style.removeProperty('transform');
        
        // Проверяем наличие span и создаем его, если нужно
        let waveSpan = button.querySelector('span');
        if (!waveSpan) {
            waveSpan = document.createElement('span');
            // Ensure the button is relative for absolute positioning of span
            if (window.getComputedStyle(button).position === 'static') {
                 button.style.position = 'relative';
            }
            button.appendChild(waveSpan);
        }
        
        // Устанавливаем базовые стили для span (делается и в initPositionAware, но может быть нужно здесь для первого раза)
        waveSpan.style.position = 'absolute';
        waveSpan.style.display = 'block';
        waveSpan.style.width = '0';
        waveSpan.style.height = '0';
        waveSpan.style.borderRadius = '50%';
        waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
        waveSpan.style.opacity = '0';
        waveSpan.style.pointerEvents = 'none';
        waveSpan.style.zIndex = '-1'; // Ensure it's behind content
        waveSpan.style.transition = 'width 0.5s ease-out, height 0.5s ease-out, opacity 0.5s ease-out, transform 0.5s ease-out'; // Add transition here too? Maybe safer in init
    });
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
        
        // Ensure the button is relative for absolute positioning of span
        if (window.getComputedStyle(button).position === 'static') {
             button.style.position = 'relative';
        }
        // Ensure overflow is hidden on the button itself to contain the span
        button.style.overflow = 'hidden';

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
        waveSpan.style.zIndex = '-1'; // Ensure it's behind content
        waveSpan.style.transition = 'width 0.5s ease-out, height 0.5s ease-out, opacity 0.5s ease-out, transform 0.5s ease-out'; // Added transform transition

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
    const diameter = Math.max(buttonWidth * 2.5, buttonHeight * 2.5); // Increased multiplier slightly
    
    // Анимация волны
    waveSpan.style.width = `${diameter}px`;
    waveSpan.style.height = `${diameter}px`;
    waveSpan.style.left = `${x}px`;
    waveSpan.style.top = `${y}px`;
    waveSpan.style.transform = 'translate(-50%, -50%) scale(1)'; // Scale up
    
    // Настройка цвета и анимации в зависимости от типа кнопки
    const waveColor = getWaveColor(button);
    waveSpan.style.backgroundColor = waveColor;
    
    waveSpan.style.opacity = '1'; // Make visible
}

function handleMouseLeave(e) {
    const waveSpan = e.currentTarget.querySelector('span');
    if (waveSpan) {
        waveSpan.style.opacity = '0'; // Fade out
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
    
    const waveColor = getWaveColor(button);
    waveSpan.style.backgroundColor = waveColor;
    
    waveSpan.style.transform = 'translate(-50%, -50%) scale(1)';
    waveSpan.style.transition = 'width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out, transform 0.6s ease-out';
    waveSpan.style.opacity = '1';
    
    setTimeout(() => {
        waveSpan.style.opacity = '0';
    }, 800);
}

// Helper function for wave color
function getWaveColor(button) {
    if (button.classList.contains('login-btn')) {
        return 'rgba(255, 239, 43, 0.6)'; // Adjusted alpha
    } else if (button.classList.contains('create-startup-btn')) {
        return 'rgba(123, 97, 255, 0.6)'; // Adjusted alpha
    } else if (button.classList.contains('logout-btn')) {
        return 'rgba(255, 107, 107, 0.6)'; // Adjusted alpha
    } else if (button.classList.contains('active') || button.closest('.nav-menu a.active')) { // Check parent for nav menu
        return 'rgba(123, 97, 255, 0.2)';
    } else if (button.classList.contains('show-button') || 
               button.classList.contains('detail-button') ||
               button.classList.contains('catalog-search-btn') ||
               button.classList.contains('join-button') || // Added join button
               button.classList.contains('action-button') || // Added action buttons
               button.classList.contains('invest-button') || // Added invest button
               button.classList.contains('confirm-btn') || // Added confirm button
               button.classList.contains('submit-btn') || // Added submit button
               button.type === 'submit') { // Added generic submit buttons
        return 'rgba(123, 97, 255, 0.4)'; // Accent color wave
    } else {
        // Default wave color (e.g., for simple buttons or links)
        return 'rgba(255, 255, 255, 0.2)'; // White wave
    }
} 