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
        console.log(`[updateRatingDisplay] Called for selector: "${containerSelector}", rating: ${rating}`); // <<< Лог 1: Вызов функции
        const starsContainer = document.querySelector(containerSelector);
        if (!starsContainer) {
            console.error(`[updateRatingDisplay] Container not found for selector: "${containerSelector}"`); // <<< Лог 2: Контейнер не найден
            return;
        }

        const iconContainers = starsContainer.querySelectorAll('.rating-icon-container'); // Ищем контейнеры
        console.log(`[updateRatingDisplay] Found ${iconContainers.length} icon containers within "${containerSelector}"`); // <<< Лог 3: Сколько контейнеров иконок найдено
        const ratingValue = parseFloat(rating) || 0;
        const fullStars = Math.floor(ratingValue);
        const partialPercentage = (ratingValue - fullStars) * 100;
        

        iconContainers.forEach((container, index) => {
            const filledIcon = container.querySelector('.icon-filled');
            if (!filledIcon) {
                console.warn(`[updateRatingDisplay] Filled icon not found in container ${index + 1} for selector "${containerSelector}"`); // <<< Лог 4: Заполненная иконка не найдена
                return; // Пропускаем, если нет иконки
            }

            let fillWidth = '0%'; // Ширина по умолчанию
            if (index < fullStars) {
                // Полностью заполненные
                fillWidth = '100%';
            } else if (index === fullStars && partialPercentage > 0) {
                // Частично заполненная
                fillWidth = `${partialPercentage}%`;
            }
            // Применяем ширину к желтой иконке
            console.log(`[updateRatingDisplay] Setting width ${fillWidth} for icon ${index + 1} in "${containerSelector}"`); // <<< Лог 5: Применение ширины
            filledIcon.style.width = fillWidth;
            
        });
    }

    // 1. Синхронизация прогресс-бара
    // Находим новый контейнер анимации и текстовый элемент
    const progressAnimationContainer = document.querySelector('.progress-animation-container'); 
    const progressPercentageSpan = document.querySelector('.progress-percentage');
    if (progressAnimationContainer && progressPercentageSpan) {
        // Получаем ширину из инлайн-стиля (уже содержит проценты)
        const initialProgressWidth = progressAnimationContainer.style.width || '0%';
        // Устанавливаем ширину (на всякий случай, хотя она уже задана в HTML)
        progressAnimationContainer.style.width = initialProgressWidth;
        // Извлекаем числовое значение процента для текста
        const initialProgressValue = parseFloat(initialProgressWidth) || 0;
        progressPercentageSpan.textContent = `${Math.round(initialProgressValue)}%`;
    }

    // 2. Отображение начального рейтинга (теперь планетами)
    const ratingDisplayContainer = '.rating-stars[data-rating]'; // Селектор для основного блока
    const ratingCommentsSelector = '.comment-rating'; // Селектор для рейтинга в комментах
    
    // Отображаем основной рейтинг
    const mainRatingElement = document.querySelector(ratingDisplayContainer);
    if (mainRatingElement) {
        const initialRatingRaw = mainRatingElement.getAttribute('data-rating'); // Получаем как строку
        console.log(`[Main Rating] Raw data-rating: "${initialRatingRaw}"`); // <<< Лог 6: Сырое значение data-rating
        
        // Заменяем запятую на точку перед parseFloat
        const ratingStringForJs = initialRatingRaw ? initialRatingRaw.replace(',', '.') : '0';
        const initialRating = parseFloat(ratingStringForJs); // Парсим строку с точкой
        console.log(`[Main Rating] Parsed rating value: ${initialRating}`); // <<< Лог 7: Распарсенное значение
        updateRatingDisplay(ratingDisplayContainer, initialRating);
    } else {
        console.error('[Main Rating] Rating container not found with selector:', ratingDisplayContainer); // <<< Лог 8: Основной контейнер не найден
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
    // ---> Рефакторинг: Ищем все контейнеры рейтинга внутри .similar-card <--- 
    const similarRatingContainers = document.querySelectorAll('.similar-card .similar-card-rating[data-rating]');
    console.log(`Found ${similarRatingContainers.length} similar startup rating containers.`); // Логгирование
    similarRatingContainers.forEach((container) => {
        const ratingStringRaw = container.dataset.rating;
        // ---> Добавляем лог сырых данных для похожих <--- 
        console.log(`[Similar Rating] Raw data-rating: "${ratingStringRaw}" for container:`, container); // <<< Лог 9: Сырые данные для похожих
        const ratingStringForJs = ratingStringRaw ? ratingStringRaw.replace(',', '.') : '0';
        const similarRatingValue = parseFloat(ratingStringForJs) || 0;
        console.log(`[Similar Rating] Processing similar startup card. Parsed rating: ${similarRatingValue}`); // Логгирование (обновлено)
        
        // Генерируем УНИКАЛЬНЫЙ селектор для этого контейнера
        // Можно использовать href родительской ссылки .similar-card
        const parentLink = container.closest('.similar-card');
        let uniqueSimilarSelector = null;
        if (parentLink && parentLink.getAttribute('href')) {
            uniqueSimilarSelector = `.similar-card[href="${parentLink.getAttribute('href')}"] .similar-card-rating`;
        } else {
            // Фоллбэк, если нет href (менее надежно)
            console.warn('Could not find unique href for similar card, using less specific selector');
            // Пытаемся использовать data-rating как часть селектора (но он может быть не уникальным)
            uniqueSimilarSelector = `.similar-card-rating[data-rating="${ratingStringRaw}"]`; 
        }
        console.log(`Using selector: ${uniqueSimilarSelector}`); // Логгирование
        if (uniqueSimilarSelector) {
             updateRatingDisplay(uniqueSimilarSelector, similarRatingValue);
        }
    });

    // >>> ДОБАВЛЯЕМ ОТОБРАЖЕНИЕ ДЛЯ ОБЩЕГО РЕЙТИНГА В БЛОКЕ КОММЕНТАРИЕВ <<<
    const overallRatingStarsElement = document.querySelector('.overall-rating-stars');
    if (overallRatingStarsElement) {
        const overallRatingRaw = overallRatingStarsElement.getAttribute('data-rating');
        const overallRatingStringForJs = overallRatingRaw ? overallRatingRaw.replace(',', '.') : '0';
        const overallRating = parseFloat(overallRatingStringForJs);
        updateRatingDisplay('.overall-rating-stars', overallRating);
    }
    // >>> КОНЕЦ ДОБАВЛЕННОГО КОДА <<<

    // 3. Логика "Показать еще" / "Скрыть" для комментариев
    const showMoreCommentsBtn = document.querySelector('.show-more-comments');
    const hideCommentsBtn = document.querySelector('.hide-comments-button');
    const commentsToShow = 5; // Показываем 5 по умолчанию

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

    // 6. Инициализация GLightbox (новая нумерация)
    if (typeof GLightbox !== 'undefined') {
        const lightbox = GLightbox({
            selector: '.glightbox', // Используем класс, добавленный к ссылкам
            loop: true,          // Включаем зацикливание галереи
            touchNavigation: true,
            keyboardNavigation: true,
            // Дополнительные опции можно добавить здесь
            // skin: 'clean', // Пример скина
            // openEffect: 'zoom',
            // closeEffect: 'fade',
            closeOnOutsideClick: true, // Добавляем опцию закрытия по клику вне окна
            plyr: { // Добавляем настройки Plyr (версия 3.6.12)
                css: 'https://cdn.plyr.io/3.6.12/plyr.css',
                js: 'https://cdn.plyr.io/3.6.12/plyr.polyfilled.js', // Используем polyfilled
                // Опции Plyr
                speed: {
                    selected: 1, // Скорость по умолчанию
                    options: [0.5, 1, 1.25, 1.5] // Доступные скорости
                },
                // Добавляем объект i18n для переводов
                i18n: {
                    restart: 'Перезапустить',
                    rewind: 'Перемотать {seektime}с',
                    play: 'Воспроизвести',
                    pause: 'Пауза',
                    fastForward: 'Вперед {seektime}с',
                    seek: 'Искать',
                    seekLabel: '{currentTime} из {duration}',
                    played: 'Воспроизведено',
                    buffered: 'Буферизовано',
                    currentTime: 'Текущее время',
                    duration: 'Продолжительность',
                    volume: 'Громкость',
                    mute: 'Выключить звук',
                    unmute: 'Включить звук',
                    enableCaptions: 'Включить субтитры',
                    disableCaptions: 'Выключить субтитры',
                    download: 'Скачать',
                    enterFullscreen: 'Во весь экран',
                    exitFullscreen: 'Выйти из полноэкранного режима',
                    frameTitle: 'Плеер для {title}',
                    captions: 'Субтитры',
                    settings: 'Настройки',
                    menuBack: 'Назад',
                    speed: 'Скорость',
                    normal: 'Обычная', // Перевод для "Normal" скорости
                    quality: 'Качество',
                    loop: 'Повтор',
                    start: 'Старт',
                    end: 'Конец',
                    all: 'Все',
                    reset: 'Сброс',
                    disabled: 'Отключено',
                    enabled: 'Включено',
                    advertisement: 'Реклама',
                    qualityBadge: { // Переводы для значков качества, если понадобятся
                        '2160': '4K',
                        '1440': 'HD',
                        '1080': 'HD',
                        '720': 'HD',
                        '576': 'SD',
                        '480': 'SD'
                    }
                }
                // tooltips: { controls: true, seek: true }
            }
        });
        console.log('GLightbox initialized with Plyr v3.6.12 and speed options');
    } else {
        console.error('GLightbox is not defined. Check if the library is loaded correctly.');
    }

    // 8. Логика переключения табов (сдвигаем нумерацию)
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

    // 9. Обработчик для "Показать еще" похожие стартапы
    const showMoreSimilarBtn = document.querySelector('.action-button.show-more-similar');
    const similarGrid = document.querySelector('.similar-startups-grid');

    if (showMoreSimilarBtn && similarGrid) {
        showMoreSimilarBtn.addEventListener('click', function() {
            // Показываем индикатор загрузки (опционально)
            this.textContent = 'Загрузка...';
            this.disabled = true;

            // Определяем URL для AJAX запроса из data-атрибута
            const loadSimilarUrl = pageDataElement.dataset.loadSimilarUrl;
            if (!loadSimilarUrl) {
                console.error('URL для загрузки похожих стартапов не найден в data-атрибуте!');
                this.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
                this.disabled = false;
                alert('Произошла ошибка конфигурации.');
                return; // Прерываем выполнение
            }
            
            fetch(loadSimilarUrl) 
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text(); // Ожидаем HTML
                })
                .then(html => {
                    // Находим все текущие карточки, КРОМЕ плейсхолдера с кнопкой
                    const currentCards = similarGrid.querySelectorAll('.similar-card:not(.show-more-placeholder)');
                    // Удаляем текущие карточки
                    currentCards.forEach(card => card.remove());
                    
                    // Вставляем новый HTML ПЕРЕД кнопкой "Показать еще"
                    const placeholder = similarGrid.querySelector('.show-more-placeholder');
                    if (placeholder) {
                        placeholder.insertAdjacentHTML('beforebegin', html);
                    } else {
                        // Если вдруг кнопки нет, просто добавляем в конец
                        similarGrid.innerHTML += html;
                    }

                    // Обновляем отображение рейтинга для НОВЫХ карточек
                    const newCards = similarGrid.querySelectorAll('.similar-card:not(.show-more-placeholder)'); // Ищем снова
                    newCards.forEach((card, cardIndex) => {
                        const similarRatingContainer = card.querySelector('.similar-card-rating');
                        if (similarRatingContainer && similarRatingContainer.dataset.rating !== undefined) {
                            const ratingStringRaw = similarRatingContainer.dataset.rating;
                            const ratingStringForJs = ratingStringRaw ? ratingStringRaw.replace(',', '.') : '0';
                            const similarRatingValue = parseFloat(ratingStringForJs) || 0;
                            // Селектор нужно обновить, чтобы он был уникальным в контексте нового набора
                            // Простой способ - использовать уникальный ID или data-атрибут, если он есть
                            // Или пересчитать уникальный селектор на основе нового порядка
                            // Пока используем простой поиск внутри card
                            updateRatingDisplay(`.similar-card[href="${card.getAttribute('href')}"] .similar-card-rating`, similarRatingValue);
                        }
                    });

                    // Возвращаем кнопку в исходное состояние
                    this.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
                    this.disabled = false;
                })
                .catch(error => {
                    console.error('Ошибка при загрузке похожих стартапов:', error);
                    // Возвращаем кнопку в исходное состояние
                    this.innerHTML = '<i class="fas fa-redo"></i> Показать еще'; 
                    this.disabled = false;
                    alert('Не удалось загрузить похожие стартапы.');
                });
        });
    }

    // Обработчик для ссылки "Комментарии"
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
            // Убедимся, что секция видима перед прокруткой (на случай, если она скрыта другим JS)
            if (window.getComputedStyle(commentsSection).display !== 'none') {
                 commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // Если секция скрыта, сначала делаем ее активной (если таб-логика не справляется)
                 const tabContentContainer = document.querySelector('.tab-content-container');
                 if (tabContentContainer) {
                     const activeSection = tabContentContainer.querySelector('.content-section.active');
                     if (activeSection) activeSection.classList.remove('active');
                 }
                commentsSection.classList.add('active');
                 // Даем браузеру время на отображение перед прокруткой
                 setTimeout(() => {
                     commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }, 100); 
            }
        });
    }

    // 11. Удаляем мешающий span.wave-effect из кнопки "Чат" (новая нумерация)
    // const chatButton = document.querySelector('.action-button.chat-button');
    // if (chatButton) {
    //     const observer = new MutationObserver(function(mutationsList, observer) {
    //         // Перебираем все мутации
    //         for(const mutation of mutationsList) {
    //             if (mutation.type === 'childList') {
    //                 // Перебираем добавленные узлы
    //                 mutation.addedNodes.forEach(node => {
    //                     // Проверяем, является ли узел элементом и имеет ли он класс wave-effect
    //                     if (node.nodeType === 1 && node.classList.contains('wave-effect')) {
    //                         // Немедленно удаляем этот узел
    //                         chatButton.removeChild(node);
    //                         console.log('Removed wave-effect span from chat button.');
    //                     }
    //                 });
    //             }
    //         }
    //     });
    //
    //     // Начинаем наблюдение за дочерними элементами кнопки чата
    //     observer.observe(chatButton, { childList: true });
    //
    //     // Опционально: можно остановить наблюдение через какое-то время или при определенных условиях
    //     // observer.disconnect();
    // } else {
    //     console.warn('Chat button not found for wave-effect removal.');
    // }

});