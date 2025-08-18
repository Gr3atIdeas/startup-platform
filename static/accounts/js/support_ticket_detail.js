document.addEventListener('DOMContentLoaded', function() {
    const closeTicketBtn = document.querySelector('.close-ticket-btn');
    
    if (closeTicketBtn) {
        closeTicketBtn.addEventListener('click', function() {
            showConfirmDialog('Закрытие заявки', 'Вы уверены, что хотите закрыть эту заявку?', closeTicket);
        });
    }
    
    const statusSelect = document.querySelector('.status-select');
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            updateTicketStatus(this.value);
        });
    }
    
    const ticketCards = document.querySelectorAll('.ticket-card');
    ticketCards.forEach(card => {
        card.addEventListener('click', function() {
            const ticketNumberElement = this.querySelector('.detail-value:last-child');
            if (ticketNumberElement) {
                const ticketId = ticketNumberElement.textContent.replace('#', '');
                if (ticketId) {
                    window.location.href = `/support/ticket/${ticketId}/`;
                }
            }
        });
    });
});

function closeTicket() {
    const url = window.location.pathname;
    const ticketId = url.split('/').filter(segment => segment && segment !== 'close').pop();
    
    if (!ticketId || isNaN(ticketId)) {
        showNotification('Ошибка: не удалось определить ID заявки', 'error');
        return;
    }
    
    fetch(`/support/ticket/${ticketId}/close/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification('Заявка успешно закрыта', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification('Ошибка при закрытии заявки: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка при закрытии заявки', 'error');
    });
}

function updateTicketStatus(status) {
    const url = window.location.pathname;
    const ticketId = url.split('/').filter(segment => segment && segment !== 'close' && segment !== 'update-status').pop();
    
    if (!ticketId || isNaN(ticketId)) {
        showNotification('Ошибка: не удалось определить ID заявки', 'error');
        return;
    }
    
    fetch(`/support/ticket/${ticketId}/update-status/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification('Статус заявки успешно обновлен', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification('Ошибка при обновлении статуса: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка при обновлении статуса', 'error');
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
