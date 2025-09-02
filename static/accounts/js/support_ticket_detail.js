document.addEventListener('DOMContentLoaded', function() {
    const closeTicketBtn = document.querySelector('.close-ticket-btn');

    if (closeTicketBtn) {
        closeTicketBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите закрыть эту заявку?')) {
                closeTicket();
            }
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

            const ticketId = this.getAttribute('data-ticket-id');
            console.log('Found ticket ID from data attribute:', ticketId);

            if (ticketId && !isNaN(ticketId)) {
                const url = `/support/ticket/${ticketId}/`;
                console.log('Redirecting to:', url);
                window.location.href = url;
            } else {
                console.error('Invalid ticket ID:', ticketId);

                const ticketNumberElement = this.querySelector('.ticket-info-right .detail-value:last-child');
                if (ticketNumberElement) {
                    const fallbackId = ticketNumberElement.textContent.replace('#', '');
                    console.log('Fallback ticket ID:', fallbackId);
                    if (fallbackId && !isNaN(fallbackId)) {
                        const url = `/support/ticket/${fallbackId}/`;
                        console.log('Redirecting to (fallback):', url);
                        window.location.href = url;
                    }
                }
            }
        });
    });
});

function closeTicket() {
    const url = window.location.pathname;
    const ticketId = url.split('/').filter(segment => segment && segment !== 'close').pop();

    if (!ticketId || isNaN(ticketId)) {
        alert('Ошибка: не удалось определить ID заявки');
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
            alert('Заявка успешно закрыта');
            location.reload();
        } else {
            alert('Ошибка при закрытии заявки: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Произошла ошибка при закрытии заявки');
    });
}

function updateTicketStatus(status) {
    const url = window.location.pathname;
    const ticketId = url.split('/').filter(segment => segment && segment !== 'close' && segment !== 'update-status').pop();

    if (!ticketId || isNaN(ticketId)) {
        alert('Ошибка: не удалось определить ID заявки');
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
            alert('Статус заявки успешно обновлен');
            location.reload();
        } else {
            alert('Ошибка при обновлении статуса: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Произошла ошибка при обновлении статуса');
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
