/**
 * Apple-style Notifications Manager
 * Автоматическое управление уведомлениями с анимациями
 */

document.addEventListener('DOMContentLoaded', function() {
    // Функция для автоматического скрытия уведомлений
    function autoHideNotifications() {
        const notifications = document.querySelectorAll('.alert-message');
        
        notifications.forEach((notification, index) => {
            // Добавляем задержку для каждого уведомления
            setTimeout(() => {
                if (notification && !notification.classList.contains('removing')) {
                    notification.classList.add('removing');
                    
                    // Удаляем элемент после завершения анимации
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 3000 + (index * 500)); // 3 секунды + 500мс задержка для каждого следующего
        });
    }

    // Функция для создания нового уведомления
    function showNotification(message, type = 'info', duration = 5000) {
        const container = document.querySelector('.messages-container') || createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `alert-message alert-${type}`;
        
        // Создаем контейнер для текста
        const textContainer = document.createElement('span');
        textContainer.textContent = message;
        textContainer.style.flex = '1';
        
        // Добавляем кнопку закрытия
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'notification-close-btn';
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #8e8e93;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0,0,0,0.1)';
            closeBtn.style.color = '#1d1d1f';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.color = '#8e8e93';
        });
        
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });
        
        notification.appendChild(textContainer);
        notification.appendChild(closeBtn);
        container.appendChild(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            if (notification.parentNode) {
                hideNotification(notification);
            }
        }, duration);
    }

    // Функция для скрытия уведомления
    function hideNotification(notification) {
        if (notification && !notification.classList.contains('removing')) {
            notification.classList.add('removing');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Функция для создания контейнера уведомлений
    function createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'messages-container';
        document.body.appendChild(container);
        return container;
    }

    // Запускаем автоматическое скрытие существующих уведомлений
    autoHideNotifications();

    // Делаем функции доступными глобально
    window.showNotification = showNotification;
    window.hideNotification = hideNotification;
});

// Переопределяем стандартный alert для использования наших уведомлений
const originalAlert = window.alert;
window.alert = function(message) {
    showNotification(message, 'info', 4000);
};

// Переопределяем стандартный confirm для использования наших уведомлений
const originalConfirm = window.confirm;
window.confirm = function(message) {
    // Используем оригинальный confirm для совместимости
    return originalConfirm(message);
}; 