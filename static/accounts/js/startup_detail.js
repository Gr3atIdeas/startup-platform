// Функция для получения CSRF-токена
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

document.addEventListener('DOMContentLoaded', function() {
    const pageDataElement = document.querySelector('.startup-detail-page');
    if (!pageDataElement) {
        console.error('Не удалось найти основной элемент .startup-detail-page');
        return;
    }

    const startupId = pageDataElement.dataset.startupId;
    const startupTitle = pageDataElement.dataset.startupTitle;
    const isUserAuthenticated = pageDataElement.dataset.userAuthenticated === 'true';
    const hasUserVoted = pageDataElement.dataset.userHasVoted === 'true';
    const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken');

    if (!startupId) {
        console.error('Startup ID не найден в data-атрибутах.');
        // Можно остановить выполнение дальнейших скриптов, зависящих от ID
    }

    // 1. Синхронизация прогресс-бара
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentageSpan = document.querySelector('.progress-percentage');
    if (progressFill && progressPercentageSpan) {
        const initialProgress = parseFloat(progressFill.getAttribute('data-progress')) || 0;
        progressFill.style.width = `${initialProgress}%`;
        progressPercentageSpan.textContent = `${Math.round(initialProgress)}%`;
    }

    // 2. Отображение начального рейтинга звезд
    const ratingStarsDisplay = document.querySelector('.rating-stars[data-rating]');
    if (ratingStarsDisplay) {
        const rating = parseFloat(ratingStarsDisplay.getAttribute('data-rating')) || 0;
        const stars = ratingStarsDisplay.querySelectorAll('i.fa-star'); // Уточнили селектор
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < Math.round(rating));
        });
    }

    // 3. Логика "Показать еще" / "Скрыть" для комментариев
    const showMoreCommentsBtn = document.querySelector('.show-more-comments');
    const hideCommentsBtn = document.querySelector('.hide-comments-button');
    const commentCards = document.querySelectorAll('.comment-card');
    const commentsToShow = 3;

    if (showMoreCommentsBtn && hideCommentsBtn && commentCards.length > commentsToShow) {
        showMoreCommentsBtn.addEventListener('click', function() {
            commentCards.forEach((comment, index) => {
                if (index >= commentsToShow) {
                    comment.classList.remove('hidden');
                }
            });
            this.style.display = 'none';
            hideCommentsBtn.style.display = 'inline-flex';
        });

        hideCommentsBtn.addEventListener('click', function() {
            commentCards.forEach((comment, index) => {
                if (index >= commentsToShow) {
                    comment.classList.add('hidden');
                }
            });
            this.style.display = 'none';
            showMoreCommentsBtn.style.display = 'inline-flex';
        });
    } else if (showMoreCommentsBtn) {
        showMoreCommentsBtn.style.display = 'none';
    }

    // 4. Логика голосования звездами (только если пользователь аутентифицирован и не голосовал)
    const interactiveStarsContainer = document.querySelector('.rating-stars[data-interactive="true"]');
    if (isUserAuthenticated && !hasUserVoted && interactiveStarsContainer) {
        interactiveStarsContainer.querySelectorAll('i.fa-star[data-value]').forEach(star => {
            star.style.cursor = 'pointer'; // Добавляем указатель
            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-value');

                if (!csrfToken) {
                    console.error("CSRF токен не найден для голосования.");
                    alert('Ошибка: Не удалось выполнить действие. Попробуйте перезагрузить страницу.');
                    return;
                }
                if (!startupId) {
                    console.error("Startup ID не найден для голосования.");
                    alert('Ошибка: Не удалось определить стартап.');
                    return;
                }

                fetch(`/vote/${startupId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken
                    },
                    body: `rating=${rating}`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const starsContainer = this.closest('.rating-stars');
                        if (starsContainer) {
                            starsContainer.removeAttribute('data-interactive'); // Убираем интерактивность
                            const currentStars = starsContainer.querySelectorAll('i.fa-star');
                            currentStars.forEach((s, index) => {
                                s.classList.toggle('active', index < Math.round(data.average_rating));
                                s.removeAttribute('data-value');
                                s.style.cursor = 'default';
                            });
                            const ratingValueElement = document.querySelector('.rating-label');
                            if (ratingValueElement) {
                                ratingValueElement.textContent = `Рейтинг: ${data.average_rating.toFixed(1)}/5`;
                            }
                            const commentAvgRating = document.querySelector('.comments-rating-summary .average-rating-value');
                            if (commentAvgRating) {
                                commentAvgRating.textContent = data.average_rating.toFixed(1);
                            }
                            // Можно добавить сообщение об успехе
                            // alert('Ваш голос учтен!');
                        }
                    } else {
                        alert(data.error || 'Ошибка при голосовании');
                    }
                })
                .catch(error => {
                    console.error('Ошибка fetch при голосовании:', error);
                    alert('Произошла ошибка сети при голосовании');
                });
            });
        });
    }

    // 5. Обработчик клика по кнопке "Инвестировать"
    const investButton = document.querySelector('.invest-button');
    const modal = document.getElementById('investModal');
    const modalText = document.getElementById('modalText');
    const confirmInvest = document.getElementById('confirmInvest');
    const cancelInvest = document.getElementById('cancelInvest');
    let investAmount = 0;

    if (investButton && !investButton.disabled && modal && modalText && confirmInvest && cancelInvest) {
        investButton.addEventListener('click', function() {
            const amountInput = document.querySelector('.investment-amount');
            investAmount = amountInput ? amountInput.value : 0;

            if (!startupId) {
                 console.error("Startup ID не найден для инвестирования.");
                 alert('Ошибка: Не удалось определить стартап.');
                 return;
            }

            if (!investAmount || investAmount <= 0) {
                alert('Пожалуйста, введите сумму инвестиций больше 0');
                return;
            }

            // Показать модальное окно
            const formattedAmount = parseFloat(investAmount).toLocaleString('ru-RU');
            modalText.innerHTML = `Вы собираетесь инвестировать ${formattedAmount} ₽ в стартап \"${startupTitle}\". Подтвердите действие.`;
            modal.style.display = 'flex';
        });

        // Обработка клика на кнопку подтверждения в модальном окне
        confirmInvest.addEventListener('click', function() {
            modal.style.display = 'none';

             if (!csrfToken) {
                 console.error("CSRF токен не найден для инвестирования.");
                 alert('Ошибка: Не удалось выполнить действие. Попробуйте перезагрузить страницу.');
                 return;
             }
             if (!startupId) {
                 console.error("Startup ID не найден для инвестирования.");
                 alert('Ошибка: Не удалось определить стартап.');
                 return;
             }

            // Отправка AJAX запроса на инвестирование
            fetch(`/invest/${startupId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken
                },
                body: `amount=${investAmount}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновление данных на странице (пример)
                    const progressBarFill = document.querySelector('.progress-fill'); // Правильный селектор
                    const progressText = document.querySelector('.progress-percentage'); // Правильный селектор
                    const investorsCountElement = document.querySelector('.progress-backers'); // Правильный селектор
                    const totalInvestedElement = document.querySelector('.collected-sum-block .info-block-value'); // Правильный селектор

                    if (progressBarFill && data.progress_percentage !== undefined) {
                        progressBarFill.style.width = `${Math.round(data.progress_percentage)}%`;
                        progressBarFill.dataset.progress = data.progress_percentage; // Обновляем data-атрибут тоже
                    }
                    if (progressText && data.progress_percentage !== undefined) {
                        progressText.textContent = `${Math.round(data.progress_percentage)}%`;
                    }
                    if (investorsCountElement && data.investors_count !== undefined) {
                        investorsCountElement.textContent = `(${data.investors_count})`;
                    }
                    if (totalInvestedElement && data.amount_raised !== undefined) {
                        const formattedRaised = parseFloat(data.amount_raised).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
                        totalInvestedElement.textContent = `${formattedRaised} ₽`;
                    }

                    const amountInput = document.querySelector('.investment-amount');
                    if (amountInput) amountInput.value = '';

                    alert('Инвестиция успешно совершена!');
                } else {
                    alert('Ошибка инвестирования: ' + (data.error || 'Неизвестная ошибка'));
                }
            })
            .catch(error => {
                console.error('Ошибка fetch при инвестировании:', error);
                alert('Произошла ошибка сети при инвестировании.');
            });
        });

        // Отмена инвестиции
        cancelInvest.addEventListener('click', function() {
            modal.style.display = 'none';
        });

        // Закрытие модального окна по клику вне области
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

    } else {
         if (!investButton) console.log('Кнопка инвестирования не найдена');
         if (investButton && investButton.disabled) console.log('Кнопка инвестирования неактивна');
         if (!modal) console.log('Модальное окно инвестиций не найдено');
    }

    // 6. Инициализация Fancybox
    try {
        if (typeof Fancybox !== 'undefined') {
             console.log('Initializing Fancybox...');
             Fancybox.bind('[data-fancybox="gallery"]', {
                 Thumbs: { showOnStart: false },
                 Images: { zoom: false },
                 Toolbar: {
                     display: [
                         { id: "prev", position: "center" },
                         { id: "counter", position: "center" },
                         { id: "next", position: "center" },
                         "close",
                     ],
                 },
                 caption: function (fancybox, carousel, slide) {
                     return slide.caption || "";
                 }
             });
             console.log('Fancybox initialized');
        } else {
            console.error('Fancybox is not defined. Check if the library is loaded correctly.');
        }
    } catch (error) {
        console.error('Error initializing Fancybox:', error);
    }

});