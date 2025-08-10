document.addEventListener('DOMContentLoaded', function() {
    function autoHideNotifications() {
        const notifications = document.querySelectorAll('.alert-message');
        notifications.forEach((notification, index) => {
            setTimeout(() => {
                if (notification && !notification.classList.contains('removing')) {
                    notification.classList.add('removing');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 3000 + (index * 500));
        });
    }
    function showNotification(message, type = 'info', duration = 5000) {
        const container = document.querySelector('.messages-container') || createNotificationContainer();
        const notification = document.createElement('div');
        notification.className = `alert-message alert-${type}`;
        const textContainer = document.createElement('span');
        textContainer.textContent = message;
        textContainer.style.flex = '1';
        textContainer.style.marginRight = '10px';
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'notification-close-btn';
        closeBtn.style.cssText = `
            position: absolute;
            top: 50%;
            right: 8px;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #8e8e93;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0,0,0,0.15)';
            closeBtn.style.color = '#1d1d1f';
            closeBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.color = '#8e8e93';
            closeBtn.style.transform = 'translateY(-50%) scale(1)';
        });
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });
        notification.appendChild(textContainer);
        notification.appendChild(closeBtn);
        container.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                hideNotification(notification);
            }
        }, duration);
    }
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
    function createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'messages-container';
        document.body.appendChild(container);
        return container;
    }
    autoHideNotifications();
    window.showNotification = showNotification;
    window.hideNotification = hideNotification;
});
const originalAlert = window.alert;
window.alert = function(message) {
    showNotification(message, 'info', 4000);
};
const originalConfirm = window.confirm;
window.confirm = function(message) {
    return originalConfirm(message);
};
