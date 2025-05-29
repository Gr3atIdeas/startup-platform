document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-section form');
    const roleSelect = document.getElementById('id_role');
    const nameInput = document.getElementById('id_name');
    const telegramInput = document.getElementById('id_telegram');

    // Получение CSRF-токена
    function getCsrfToken() {
        const tokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return tokenElement ? tokenElement.value : '';
    }

    // Проверка аутентификации
    if (!window.request_user_id_data || window.request_user_id_data === 0) {
        console.error('Пользователь не аутентифицирован или user_id отсутствует');
        alert('Пожалуйста, войдите в систему для создания заявки.');
        return;
    }

    // Автозаполнение полей
    fetch(`/profile/?user_id=${window.request_user_id_data}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('Ответ сервера (автозаполнение):', response.status, response.statusText);
        return response.text().then(text => ({ status: response.status, text }));
    })
    .then(({ status, text }) => {
        if (status !== 200) {
            console.error('Ошибка сервера:', status, text);
            throw new Error(`HTTP ${status}: ${text}`);
        }
        try {
            const data = JSON.parse(text);
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
        } catch (e) {
            console.error('Ошибка парсинга JSON:', text);
            throw e;
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
                let errorMsg = data.error || 'Произошла ошибка при отправке заявки.';
                if (data.errors) {
                    errorMsg += '\nОшибки: ' + Object.values(data.errors).flat().join('; ');
                    console.log('Ошибки формы:', data.errors);
                }
                alert(errorMsg);
            }
        })
        .catch(error => {
            console.error('Ошибка отправки формы:', error);
            alert('Произошла ошибка при отправке заявки.');
        });
    });
});