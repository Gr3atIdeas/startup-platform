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
        // Используем commentRatingContainer для поиска и проверки data-rating
        if (commentRatingContainer && commentRatingContainer.dataset.rating !== undefined) {
            const commentRatingValue = parseFloat(commentRatingContainer.dataset.rating.replace(',', '.')) || 0;
            // Генерируем УНИКАЛЬНЫЙ селектор для контейнера звезд этого комментария
            // Используем cardIndex + 1, так как nth-child 1-индексированный
            const uniqueCommentSelector = `.comment-card:nth-child(${cardIndex + 1}) ${ratingCommentsSelector}`;
            updateRatingDisplay(uniqueCommentSelector, commentRatingValue);
        }
    });

    // Отображаем рейтинг в карточках похожих стартапов
    const similarCards = document.querySelectorAll('.similar-card');
    similarCards.forEach((card, cardIndex) => {
        const similarRatingContainer = card.querySelector('.similar-card-rating');
        if (similarRatingContainer && similarRatingContainer.dataset.rating !== undefined) {
            const ratingStringRaw = similarRatingContainer.dataset.rating;
            // Заменяем запятую на точку, если есть
            const ratingStringForJs = ratingStringRaw ? ratingStringRaw.replace(',', '.') : '0';
            const similarRatingValue = parseFloat(ratingStringForJs) || 0;
            // Генерируем уникальный селектор для этого контейнера звезд
            const uniqueSimilarSelector = `.similar-card:nth-child(${cardIndex + 1}) .similar-card-rating`;
            updateRatingDisplay(uniqueSimilarSelector, similarRatingValue);
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

    // 6. Инициализация Fancybox (Упрощенная)
    try {
        if (typeof Fancybox !== 'undefined') {
             console.log('Initializing Fancybox with custom HTML buttons...');
             Fancybox.bind('[data-fancybox="gallery"]', {
                 Toolbar: {
                     display: {
                         left: [], // Убираем стандартные кнопки слева
                         middle: [], // Убираем стандартные кнопки посередине
                         right: ["close"], // Оставляем стандартную кнопку закрытия
                     },
                     items: {
                         // Перепроверяем кнопки
                         prev: {
                             html: '<button data-fancybox-prev class="f-button" title="Previous"><i class="fas fa-chevron-left"></i></button>',
                         },
                         next: {
                             html: '<button data-fancybox-next class="f-button" title="Next"><i class="fas fa-chevron-right"></i></button>',
                         },
                         // Кнопка закрытия - используем стандартную, она должна работать
                         // close: {
                         //     html: '<button data-fancybox-close class="f-button" title="Close"><i class="fas fa-times"></i></button>',
                         // }
                     }
                 },
                 Thumbs: {
                     showOnStart: false // Не показывать миниатюры при старте
                 }
             });
             console.log('Fancybox initialized with custom HTML buttons');
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

    // Добавляем обработчик для ссылки "Комментарии" под основным рейтингом
    const commentsLink = document.querySelector('.comments-link[href="#comments-section"]');
    const commentsTabButton = document.querySelector('.tab-button[data-target="comments-section"]');
    const commentsSection = document.getElementById('comments-section');

    if (commentsLink && commentsTabButton && commentsSection) {
        commentsLink.addEventListener('click', function(event) {
            event.preventDefault(); // Предотвращаем стандартный переход по якорю
            
            // Имитируем клик по табу комментариев, если он еще не активен
            if (!commentsTabButton.classList.contains('active')) {
                commentsTabButton.click(); // Вызываем событие click на табе
            }
            
            // Плавная прокрутка к секции комментариев
            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

});