/**
 * Эффект Position Aware для кнопок - анимация с эффектом волны от положения курсора
 * Применяется ко всем кнопкам и элементам навигации на сайте
 */

document.addEventListener('DOMContentLoaded', function() {
    initPositionAware();
    initNavButtons();
    
    const observer = new MutationObserver((mutations) => {
        let needsReInit = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (node.matches('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a') || node.querySelector('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a'))) {
                        needsReInit = true;
                    }
                });
            }
        });
        if (needsReInit) {
            initPositionAware();
            initNavButtons();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        xhr.addEventListener('load', function() {
            setTimeout(() => {
                initPositionAware();
                initNavButtons();
            }, 150);
        });
        return xhr;
    };
});

// Инициализация специальной обработки кнопок навигации
function initNavButtons() {
    const navButtons = document.querySelectorAll('.nav-menu a:not(.login-btn)');
    
    navButtons.forEach(button => {
        // Удаляем существующие обработчики, чтобы не было дублирования
        button.removeEventListener('mouseenter', handleNavButtonEnter);
        button.removeEventListener('mouseleave', handleNavButtonLeave);
        
        // Добавляем новые обработчики для навигационных кнопок
        button.addEventListener('mouseenter', handleNavButtonEnter);
        button.addEventListener('mouseleave', handleNavButtonLeave);
    });
}

// Обработчик наведения на кнопку навигации
function handleNavButtonEnter(e) {
    const button = e.currentTarget;
    // Добавляем границу при наведении
    button.style.border = '1px solid var(--standard-button-border)';
}

// Обработчик ухода курсора с кнопки навигации
function handleNavButtonLeave(e) {
    const button = e.currentTarget;
    // Удаляем границу при уходе курсора
    button.style.border = 'none';
}

function initPositionAware() {
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"], .catalog-search-btn, .show-button, .detail-button, .join-button, .login-btn, .create-startup-btn, .logout-btn, .nav-menu a');
    
    buttons.forEach(button => {
        if (button.closest('.goverlay') || button.closest('.tab-navigation')) {
            button.removeAttribute('data-position-aware-initialized');
            const existingSpan = button.querySelector('span.wave-effect');
            if (existingSpan) {
                existingSpan.remove();
            }
            button.removeEventListener('mouseenter', handleMouseEnter);
            button.removeEventListener('mouseleave', handleMouseLeave);
            button.removeEventListener('touchstart', handleTouchStart);
            return;
        }

        if (button.closest('.tabbed-content-wrapper')) {
            button.removeAttribute('data-position-aware-initialized');
            const existingSpan = button.querySelector('span.wave-effect');
            if (existingSpan) {
                existingSpan.remove();
            }
            button.removeEventListener('mouseenter', handleMouseEnter);
            button.removeEventListener('mouseleave', handleMouseLeave);
            button.removeEventListener('touchstart', handleTouchStart);
            return;
        }

        if (button.hasAttribute('data-position-aware-initialized')) return;

        const existingSpan = button.querySelector('span.wave-effect');
        if (existingSpan) {
            existingSpan.remove();
        }

        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
        button.removeEventListener('touchstart', handleTouchStart);
        
        const waveSpan = document.createElement('span');
        waveSpan.className = 'wave-effect';
        
        waveSpan.style.position = 'absolute';
        waveSpan.style.display = 'block';
        waveSpan.style.width = '0';
        waveSpan.style.height = '0';
        waveSpan.style.borderRadius = '50%';
        waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
        waveSpan.style.opacity = '1';
        waveSpan.style.pointerEvents = 'none';
        waveSpan.style.zIndex = '-1';
        waveSpan.style.transition = 'width 0.4s ease-in-out, height 0.4s ease-in-out, opacity 0.4s ease-in-out, transform 0.4s ease-in-out';

        Array.from(button.childNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node !== waveSpan) {
                const currentZIndex = window.getComputedStyle(node).zIndex;
                if (currentZIndex === 'auto' || parseInt(currentZIndex) < 1) {
                    node.style.position = 'relative';
                    node.style.zIndex = '2';
                }
            }
        });

        Array.from(button.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                const wrapper = document.createElement('span');
                wrapper.textContent = node.textContent;
                wrapper.style.position = 'relative';
                wrapper.style.zIndex = '2';
                node.parentNode.replaceChild(wrapper, node);
            }
        });

        button.appendChild(waveSpan);

        button.addEventListener('mouseenter', handleMouseEnter);
        button.addEventListener('mouseleave', handleMouseLeave);
        button.addEventListener('touchstart', handleTouchStart);
        
        button.setAttribute('data-position-aware-initialized', 'true');
    });
}

function handleMouseEnter(e) {
    const button = e.currentTarget;
    const waveSpan = button.querySelector('span.wave-effect');
    if (!waveSpan || window.getComputedStyle(button).display === 'none') return;
    
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;
    const diameter = Math.max(buttonWidth * 3, buttonHeight * 3); 
    
    const waveColor = getWaveColor(button);
    waveSpan.style.backgroundColor = waveColor;
    waveSpan.style.left = `${x}px`;
    waveSpan.style.top = `${y}px`;
    waveSpan.style.width = `${diameter}px`;
    waveSpan.style.height = `${diameter}px`;
    waveSpan.style.transform = 'translate(-50%, -50%) scale(1)';
    waveSpan.style.opacity = '1'; 

    button.classList.add('wave-active');
}

function handleMouseLeave(e) {
    const button = e.currentTarget;
    const waveSpan = button.querySelector('span.wave-effect');
    if (waveSpan) {
        waveSpan.style.opacity = '0'; 
        waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
        waveSpan.style.width = '0'; 
        waveSpan.style.height = '0';

        button.classList.remove('wave-active');
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
    
    let waveSpan = button.querySelector('span.wave-effect');
    if (!waveSpan) {
        waveSpan = document.createElement('span');
        waveSpan.className = 'wave-effect';
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
    waveSpan.style.transition = 'width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out, transform 0.6s ease-out';
    waveSpan.style.opacity = '1';
    
    button.classList.add('wave-active');
    
    setTimeout(() => {
        if (waveSpan) {
            waveSpan.style.opacity = '0';
            waveSpan.style.transform = 'translate(-50%, -50%) scale(0)';
            waveSpan.style.width = '0';
            waveSpan.style.height = '0';
            
            button.classList.remove('wave-active');
        }
    }, 600);
}

function getWaveColor(button) {
    if (button.classList.contains('login-btn') || button.classList.contains('join-button')) {
        return '#ffef2b'; 
    } else {
        return '#004e9f'; 
    }
} 