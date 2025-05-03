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

    // Функция для обновления отображения рейтинга (метод наложения)
    function updateRatingDisplay(containerSelector, rating) {
        const starsContainer = document.querySelector(containerSelector);
        if (!starsContainer) return;

        const iconContainers = starsContainer.querySelectorAll('.rating-icon-container'); // Ищем контейнеры
        const ratingValue = parseFloat(rating) || 0;
        const fullStars = Math.floor(ratingValue);
        const partialPercentage = (ratingValue - fullStars) * 100;
        // console.log(`BEFORE LOOP - Rating: ${ratingValue}, Full: ${fullStars}, Partial%: ${partialPercentage}, Containers found: ${iconContainers.length}, Selector: ${containerSelector}`);

        iconContainers.forEach((container, index) => {
            const filledIcon = container.querySelector('.icon-filled');
            if (!filledIcon) return; // Пропускаем, если нет иконки
            // console.log(`Inside loop - Container ${index}:`, container);

            let fillWidth = '0%'; // Ширина по умолчанию
            if (index < fullStars) {
                // Полностью заполненные
                fillWidth = '100%';
            } else if (index === fullStars && partialPercentage > 0) {
                // Частично заполненная
                fillWidth = `${partialPercentage}%`;
            }
            // Применяем ширину к желтой иконке
            filledIcon.style.width = fillWidth;
            // console.log(`Container ${index}: Set width to ${fillWidth}`);
        });
    }

    // 1. Синхронизация прогресс-бара
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentageSpan = document.querySelector('.progress-percentage');
    if (progressFill && progressPercentageSpan) {
        const initialProgress = parseFloat(progressFill.getAttribute('data-progress')) || 0;
        progressFill.style.width = `${initialProgress}%`;
        progressPercentageSpan.textContent = `${Math.round(initialProgress)}%`;
    }

    // 2. Отображение начального рейтинга (теперь планетами)
    const ratingDisplayContainer = '.rating-stars[data-rating]'; // Селектор для основного блока
    const ratingCommentsSelector = '.comment-rating'; // Селектор для рейтинга в комментах
    
    // Отображаем основной рейтинг
    const mainRatingElement = document.querySelector(ratingDisplayContainer);
    if (mainRatingElement) {
        const initialRatingRaw = mainRatingElement.getAttribute('data-rating'); // Получаем как строку
        // console.log(`Raw data-rating attribute: "${initialRatingRaw}"`); // Убираем отладку
        // Заменяем запятую на точку перед parseFloat
        const ratingStringForJs = initialRatingRaw ? initialRatingRaw.replace(',', '.') : '0'; 
        const initialRating = parseFloat(ratingStringForJs); // Парсим строку с точкой
        updateRatingDisplay(ratingDisplayContainer, initialRating);
    }
    
    // Отображаем рейтинг в каждом комментарии
    const commentCards = document.querySelectorAll('.comment-card');
    commentCards.forEach((card, cardIndex) => {
        const commentRatingContainer = card.querySelector(ratingCommentsSelector);
        const commentPlanets = commentRatingContainer ? commentRatingContainer.querySelectorAll('.rating-planet') : null;
        if (commentPlanets && commentPlanets.length > 0) {
            // Пытаемся получить рейтинг из данных (если был бы добавлен)
            // В текущей структуре HTML рейтинга в комменте нет data-атрибута.
            // Мы можем извлечь его из количества активных звезд, если бы они были, 
            // или (что более правильно) его нужно передавать из шаблона.
            // Пока что предполагаем, что рейтинг комментария хранится где-то еще
            // или нужно будет добавить data-rating="{{ comment.rating }}" в HTML.
            // --- ЗАГЛУШКА: ищем предка comment-card и пытаемся найти данные там, если есть --- 
            let commentRatingValue = 0; // Значение по умолчанию
            // Читаем data-rating из контейнера commentRatingContainer
            if (commentRatingContainer && commentRatingContainer.dataset.rating) {
                 commentRatingValue = parseFloat(commentRatingContainer.dataset.rating);
            }
            /* Старый код заглушки:
            const commentRatingAttr = card.dataset.commentRating; // Пример, если бы добавили data-comment-rating
            if (commentRatingAttr) {
                commentRatingValue = parseFloat(commentRatingAttr);
            }
            */
            // Генерируем уникальный селектор для контейнера звезд этого комментария
            const uniqueCommentSelector = `.comment-card:nth-child(${cardIndex + 1}) ${ratingCommentsSelector}`;
            updateRatingDisplay(uniqueCommentSelector, commentRatingValue);
            // ПРИМЕЧАНИЕ: Для корректной работы рейтинга в комментариях, 
            // необходимо передать значение рейтинга каждого комментария из шаблона,
            // например, добавив data-rating="{{ comment.rating|default:0 }}" 
            // к элементу `.comment-rating` или `.comment-card` в HTML.
        }
    });

    // 3. Логика "Показать еще" / "Скрыть" для комментариев
    const showMoreCommentsBtn = document.querySelector('.show-more-comments');
    const hideCommentsBtn = document.querySelector('.hide-comments-button');
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

    // 4. Логика голосования (теперь для иконок-контейнеров)
    const interactiveStarsContainer = document.querySelector('.rating-stars[data-interactive="true"]');
    if (isUserAuthenticated && !hasUserVoted && interactiveStarsContainer) {
        // Ищем контейнеры с data-value, а не сами иконки
        interactiveStarsContainer.querySelectorAll('.rating-icon-container[data-value]').forEach(iconContainer => {
            iconContainer.style.cursor = 'pointer'; // Добавляем указатель
            iconContainer.addEventListener('click', function() {
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
                        const starsContainerElement = this.closest('.rating-stars');
                        if (starsContainerElement) {
                            starsContainerElement.removeAttribute('data-interactive'); // Убираем интерактивность
                            // Обновляем отображение планет после голосования
                            updateRatingDisplay('.rating-stars[data-rating]', data.average_rating);
                            
                            // Убираем data-value и стиль курсора у КОНТЕЙНЕРОВ
                            starsContainerElement.querySelectorAll('.rating-icon-container').forEach(container => {
                                container.removeAttribute('data-value');
                                container.style.cursor = 'default';
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

    // 6. Инициализация Fancybox (Упрощенная)
    try {
        if (typeof Fancybox !== 'undefined') {
             console.log('Initializing Fancybox with FontAwesome icons...');
             Fancybox.bind('[data-fancybox="gallery"]', {
                 Toolbar: {
                     display: {
                         left: [], // Убираем стандартные кнопки слева
                         middle: [], // Убираем стандартные кнопки посередине
                         right: ["close"], // Оставляем стандартную кнопку закрытия (она обычно работает)
                     },
                     items: {
                         // Добавляем свои кнопки с иконками Font Awesome
                         prev: {
                             tpl: '<button class="f-button" title="Previous"><i class="fas fa-chevron-left"></i></button>',
                         },
                         next: {
                             tpl: '<button class="f-button" title="Next"><i class="fas fa-chevron-right"></i></button>',
                         },
                         // Можно переопределить и кнопку закрытия, если стандартная не работает
                         // close: {
                         //     tpl: '<button class="f-button" title="Close"><i class="fas fa-times"></i></button>',
                         // }
                     }
                 },
                 Thumbs: { 
                     showOnStart: false // Не показывать миниатюры при старте
                 }
             }); 
             console.log('Fancybox initialized with FontAwesome icons');
        } else {
            console.error('Fancybox is not defined. Check if the library is loaded correctly.');
        }
    } catch (error) {
        console.error('Error initializing Fancybox:', error);
    }

    // 7. Логика переключения табов
    const tabContainer = document.querySelector('.tab-navigation');
    const contentSections = document.querySelectorAll('.content-section');
    const tabButtons = document.querySelectorAll('.tab-button');

    if (tabContainer && contentSections.length > 0 && tabButtons.length > 0) {
        tabContainer.addEventListener('click', function(event) {
            // Ищем ближайший родительский элемент (или сам элемент) с классом 'tab-button'
            const clickedButton = event.target.closest('.tab-button');

            // Если кнопка найдена (клик был по кнопке или ее дочернему элементу)
            if (clickedButton) {
                const targetId = clickedButton.dataset.target; // Берем data-target с найденной кнопки
                if (!targetId) return;

                // Обновляем кнопки
                tabButtons.forEach(button => {
                    button.classList.remove('active');
                });
                clickedButton.classList.add('active');

                // Обновляем секции контента
                contentSections.forEach(section => {
                    if (section.id === targetId) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
            }
        });
    }

});