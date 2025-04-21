/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Position Aware effect on DOMContentLoaded');
    
    // Initialize immediately and set up observers/listeners
    initPositionAware();
    
    // Наблюдатель за изменениями DOM для динамически добавленных элементов
    const observer = new MutationObserver((mutations) => {
        let needsReInit = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    // Check if the added node is a button or contains buttons
                    if (node.nodeType === 1 && (node.matches('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a') || node.querySelector('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a'))) {
                        needsReInit = true;
                    }
                });
            }
        });
        if (needsReInit) {
            console.log('DOM changed, re-initializing Position Aware');
            initPositionAware();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Обработка AJAX запросов (simple example, might need adjustment based on actual AJAX implementation)
    // Consider using a more robust way to detect AJAX completion if available (e.g., custom events)
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        xhr.addEventListener('load', function() {
            // Re-initialize after AJAX load, give some time for DOM updates
            console.log('AJAX load detected, re-initializing Position Aware');
            setTimeout(initPositionAware, 150);
        });
        return xhr;
    };
});

function initPositionAware() {
    console.log('Running initPositionAware');
    
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a');
    
    buttons.forEach(button => {
        // Пропускаем уже обработанные кнопки
        if (button.hasAttribute('data-position-aware-initialized')) return;

        // --- ВОЗВРАЩАЕМ ЛОГИКУ: Удаляем существующий span --- 
        const existingSpan = button.querySelector('span');
        if (existingSpan) {
            console.log('Removing existing span from:', button);
            existingSpan.remove();
        }
        // --- КОНЕЦ ВОЗВРАТА ---

        // Удаление старых обработчиков событий
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
        button.removeEventListener('touchstart', handleTouchStart);
        
        // --- ВСЕГДА СОЗДАЕМ НОВЫЙ span --- 
        const waveSpan = document.createElement('span');
        
        // Установка базовых стилей для нового span элемента
        waveSpan.style.position = 'absolute';
        waveSpan.style.display = 'block';
        waveSpan.style.width = '0';
        waveSpan.style.height = '0';
        waveSpan.style.borderRadius = '50%';
        waveSpan.style.transform = 'translate(-50%, -50%)'; // NO scale(0) here initially
        waveSpan.style.opacity = '0'; // Initially hidden
        waveSpan.style.pointerEvents = 'none';
        waveSpan.style.zIndex = '0'; 
        // --- ИЗМЕНЕНИЕ TRANSITION: Только width и height --- 
        waveSpan.style.transition = 'width 0.4s ease-in-out, height 0.4s ease-in-out'; // Match example
        // --- КОНЕЦ СОЗДАНИЯ И СТИЛИЗАЦИИ ---

        // Добавляем новый span в кнопку
        button.appendChild(waveSpan);

        // Добавляем обработчики событий
        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);
        button.addEventListener('touchstart', handleTouchStart);
        
        // Помечаем кнопку как обработанную
        button.setAttribute('data-position-aware-initialized', 'true');
        console.log('Initialized button:', button, 'with new span');
    });
}

function handleMouseEnter(e) {
    console.log('Mouse Enter', e.currentTarget);
    const button = e.currentTarget;
    const waveSpan = button.querySelector('span');
    if (!waveSpan || window.getComputedStyle(button).display === 'none') return;
    
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;
    // Use a large fixed size or calculation like original example? Let's try large fixed size first for simplicity.
    // const diameter = Math.max(buttonWidth * 3, buttonHeight * 3); 
    const diameter = Math.max(buttonWidth, buttonHeight) * 2.5; // Ensure it covers the button

    console.log(`Applying styles: top: ${y}, left: ${x}, width: ${diameter}, height: ${diameter}`);
    // --- ИЗМЕНЕНИЕ: Устанавливаем только top/left/width/height + opacity --- 
    waveSpan.style.left = `${x}px`;
    waveSpan.style.top = `${y}px`;
    waveSpan.style.width = `${diameter}px`;
    waveSpan.style.height = `${diameter}px`;
    waveSpan.style.opacity = '1'; // Make visible instantly
    // НЕ УСТАНАВЛИВАЕМ transform: scale(1)
    
    const waveColor = getWaveColor(button);
    waveSpan.style.backgroundColor = waveColor;
    console.log('Styles applied');
}

function handleMouseLeave(e) {
    console.log('Mouse Leave', e.currentTarget);
    const button = e.currentTarget;
    const waveSpan = button.querySelector('span');
    if (waveSpan) {
        // --- ИЗМЕНЕНИЕ: Устанавливаем opacity 0, width/height вернутся через CSS transition --- 
        waveSpan.style.opacity = '0'; // Hide instantly
        waveSpan.style.width = '0'; // Trigger transition back to 0
        waveSpan.style.height = '0';// Trigger transition back to 0
        console.log('Opacity, Width, Height set to 0');

        // --- УДАЛЯЕМ setTimeout --- 
        // clearTimeout / setTimeout logic removed
        
        // --- ДОБАВЛЯЕМ УСТАНОВКУ top/left как в оригинале --- 
        const rect = button.getBoundingClientRect();
        // Need pageX/pageY from event, but mouseleave doesn't guarantee useful coords always?
        // Let's try setting based on last known position or center? Or skip this for now.
        // Original code might have had issues if mouse moved fast.
        // Let's just focus on hiding for now.
         console.log('Span hidden, width/height transitioning to 0 via CSS');

    }
}

function handleTouchStart(e) {
    // Basic touch handling - can be improved
    e.preventDefault(); 
    const touch = e.touches[0];
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;
    const diameter = Math.max(buttonWidth * 3, buttonHeight * 3);
    
    // Ensure span exists (should always exist after init, but check anyway)
    let waveSpan = button.querySelector('span');
    if (!waveSpan) {
        waveSpan = document.createElement('span');
        // Apply styles if somehow missing
        waveSpan.style.position = 'absolute';
        waveSpan.style.display = 'block';
        waveSpan.style.width = '0';
        waveSpan.style.height = '0';
        waveSpan.style.borderRadius = '50%';
        waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
        waveSpan.style.opacity = '0';
        waveSpan.style.pointerEvents = 'none';
        waveSpan.style.zIndex = '-1';
        waveSpan.style.transition = 'width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out, transform 0.6s ease-out';
        button.appendChild(waveSpan);
    }
    
    waveSpan.style.width = `${diameter}px`;
    waveSpan.style.height = `${diameter}px`;
    waveSpan.style.left = `${x}px`;
    waveSpan.style.top = `${y}px`;
    
    const waveColor = getWaveColor(button);
    waveSpan.style.backgroundColor = waveColor;
    
    waveSpan.style.transform = 'translate(-50%, -50%) scale(1)';
    // Ensure transition is set (might not be if init didn't run?)
    waveSpan.style.transition = 'width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out, transform 0.6s ease-out';
    waveSpan.style.opacity = '1';
    
    // Скрытие волны через 800мс
    setTimeout(() => {
        waveSpan.style.opacity = '0';
        // Optional reset
        setTimeout(() => {
            if (waveSpan.style.opacity === '0') {
                waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
                waveSpan.style.width = '0';
                waveSpan.style.height = '0';
            }
        }, 600); // Match touch transition duration
    }, 800);
}

// Helper function for wave color
function getWaveColor(button) {
    if (button.classList.contains('login-btn')) {
        // Exception: Yellow for login button
        return '#FFEF2B'; 
    } else {
        // Default: Blue for all other buttons
        return '#004e9f'; 
    }
    /* Remove old logic
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
    */
} 