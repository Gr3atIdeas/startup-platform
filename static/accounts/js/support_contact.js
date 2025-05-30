document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-section form');
    const roleSelect = document.getElementById('role');
    const nameInput = document.getElementById('name');
    const telegramInput = document.getElementById('telegram');

    // Получение CSRF-токена
    function getCsrfToken() {
        const tokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return tokenElement ? tokenElement.value : '';
    }

    // Автозаполнение полей
    fetch('/profile/?user_id=' + (window.request_user_id_data || 0), {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.role) {
            const roleMap = {
                'investor': 'investor',
                'startuper': 'startuper',
                'moderator': 'moderator'
            };
            if (roleMap[data.role]) {
                roleSelect.value = roleMap[data.role];
            }
        }
        if (data.first_name) {
            nameInput.value = data.first_name;
        }
        if (data.social_links && data.social_links.telegram) {
            telegramInput.value = data.social_links.telegram;
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки данных пользователя:', error);
    });

    // Отправка формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);

        fetch('/support/contact/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                form.reset();
            } else {
                alert(data.error || 'Произошла ошибка при отправке заявки.');
                if (data.errors) {
                    console.log('Ошибки формы:', data.errors);
                }
            }
        })
        .catch(error => {
            console.error('Ошибка отправки формы:', error);
            alert('Произошла ошибка при отправке заявки.');
        });
    });
});