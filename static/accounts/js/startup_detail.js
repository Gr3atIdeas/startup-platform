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
    }

    // Функция для обновления отображения рейтинга (метод наложения)
    function updateRatingDisplay(containerSelector, rating) {
        console.log(`[updateRatingDisplay] Called for selector: "${containerSelector}", rating: ${rating}`);
        const starsContainer = document.querySelector(containerSelector);
        if (!starsContainer) {
            console.error(`[updateRatingDisplay] Container not found for selector: "${containerSelector}"`);
            return;
        }

        const iconContainers = starsContainer.querySelectorAll('.rating-icon-container');
        console.log(`[updateRatingDisplay] Found ${iconContainers.length} icon containers within "${containerSelector}"`);
        const ratingValue = parseFloat(rating) || 0;
        const fullStars = Math.floor(ratingValue);
        const partialPercentage = (ratingValue - fullStars) * 100;

        iconContainers.forEach((container, index) => {
            const filledIcon = container.querySelector('.icon-filled');
            if (!filledIcon) {
                console.warn(`[updateRatingDisplay] Filled icon not found in container ${index + 1} for selector "${containerSelector}"`);
                return;
            }

            let fillWidth = '0%';
            if (index < fullStars) {
                fillWidth = '100%';
            } else if (index === fullStars && partialPercentage > 0) {
                fillWidth = `${partialPercentage}%`;
            }
            console.log(`[updateRatingDisplay] Setting width ${fillWidth} for icon ${index + 1} in "${containerSelector}"`);
            filledIcon.style.width = fillWidth;
        });
    }

    // 1. Синхронизация прогресс-бара
    const progressAnimationContainer = document.querySelector('.progress-animation-container');
    const progressPercentageSpan = document.querySelector('.progress-percentage');
    if (progressAnimationContainer && progressPercentageSpan) {
        const initialProgressWidth = progressAnimationContainer.style.width || '0%';
        progressAnimationContainer.style.width = initialProgressWidth;
        const initialProgressValue = parseFloat(initialProgressWidth) || 0;
        progressPercentageSpan.textContent = `${Math.round(initialProgressValue)}%`;
    }

    // 2. Отображение начального рейтинга
    const ratingDisplayContainer = '.rating-stars[data-rating]';
    const ratingCommentsSelector = '.comment-rating';

    const mainRatingElement = document.querySelector(ratingDisplayContainer);
    if (mainRatingElement) {
        const initialRatingRaw = mainRatingElement.getAttribute('data-rating');
        console.log(`[Main Rating] Raw data-rating: "${initialRatingRaw}"`);
        const ratingStringForJs = initialRatingRaw ? initialRatingRaw.replace(',', '.') : '0';
        const initialRating = parseFloat(ratingStringForJs);
        console.log(`[Main Rating] Parsed rating value: ${initialRating}`);
        updateRatingDisplay(ratingDisplayContainer, initialRating);
    } else {
        console.error('[Main Rating] Rating container not found with selector:', ratingDisplayContainer);
    }

    const commentCards = document.querySelectorAll('.comment-card');
    commentCards.forEach((card, cardIndex) => {
        const commentRatingContainer = card.querySelector(ratingCommentsSelector);
        if (commentRatingContainer && commentRatingContainer.dataset.rating !== undefined) {
            const commentRatingValue = parseFloat(commentRatingContainer.dataset.rating.replace(',', '.')) || 0;
            const uniqueCommentSelector = `.comment-card:nth-child(${cardIndex + 1}) ${ratingCommentsSelector}`;
            updateRatingDisplay(uniqueCommentSelector, commentRatingValue);
        }
    });

    const similarRatingContainers = document.querySelectorAll('.similar-card .similar-card-rating[data-rating]');
    console.log(`Found ${similarRatingContainers.length} similar startup rating containers.`);
    similarRatingContainers.forEach((container) => {
        const ratingStringRaw = container.dataset.rating;
        console.log(`[Similar Rating] Raw data-rating: "${ratingStringRaw}" for container:`, container);
        const ratingStringForJs = ratingStringRaw ? ratingStringRaw.replace(',', '.') : '0';
        const similarRatingValue = parseFloat(ratingStringForJs) || 0;
        console.log(`[Similar Rating] Processing similar startup card. Parsed rating: ${similarRatingValue}`);

        const parentLink = container.closest('.similar-card');
        let uniqueSimilarSelector = null;
        if (parentLink && parentLink.getAttribute('href')) {
            uniqueSimilarSelector = `.similar-card[href="${parentLink.getAttribute('href')}"] .similar-card-rating`;
        } else {
            console.warn('Could not find unique href for similar card, using less specific selector');
            uniqueSimilarSelector = `.similar-card-rating[data-rating="${ratingStringRaw}"]`;
        }
        console.log(`Using selector: ${uniqueSimilarSelector}`);
        if (uniqueSimilarSelector) {
            updateRatingDisplay(uniqueSimilarSelector, similarRatingValue);
        }
    });

    const overallRatingStarsElement = document.querySelector('.overall-rating-stars');
    if (overallRatingStarsElement) {
        const overallRatingRaw = overallRatingStarsElement.getAttribute('data-rating');
        const overallRatingStringForJs = overallRatingRaw ? overallRatingRaw.replace(',', '.') : '0';
        const overallRating = parseFloat(overallRatingStringForJs);
        updateRatingDisplay('.overall-rating-stars', overallRating);
    }

    // 3. Логика "Показать еще" / "Скрыть" для комментариев
    const showMoreCommentsBtn = document.querySelector('.show-more-comments');
    const hideCommentsBtn = document.querySelector('.hide-comments-button');
    const commentsToShow = 5;

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

    // 4. Логика голосования и эффект наведения
    const interactiveStarsContainer = document.querySelector('.rating-stars[data-interactive="true"]');
    if (isUserAuthenticated && !hasUserVoted && interactiveStarsContainer) {
        const iconContainers = interactiveStarsContainer.querySelectorAll('.rating-icon-container[data-value]');
        iconContainers.forEach(iconContainer => {
            iconContainer.style.cursor = 'pointer';

            // Обработчик клика для голосования
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

                fetch(`/vote-startup/${startupId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: `rating=${rating}`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const starsContainerElement = this.closest('.rating-stars');
                        if (starsContainerElement) {
                            starsContainerElement.removeAttribute('data-interactive');
                            starsContainerElement.setAttribute('data-rating', data.average_rating);
                            updateRatingDisplay('.rating-stars[data-rating]', data.average_rating);

                            starsContainerElement.querySelectorAll('.rating-icon-container').forEach(container => {
                                container.removeAttribute('data-value');
                                container.style.cursor = 'default';
                            });

                            const ratingValueElement = document.querySelector('.rating-label');
                            if (ratingValueElement) {
                                ratingValueElement.textContent = `Рейтинг ${data.average_rating.toFixed(1)}/5`;
                            }

                            const commentAvgRating = document.querySelector('.average-rating-value');
                            if (commentAvgRating) {
                                commentAvgRating.textContent = data.average_rating.toFixed(1);
                            }

                            const overallRatingStars = document.querySelector('.overall-rating-stars');
                            if (overallRatingStars) {
                                overallRatingStars.setAttribute('data-rating', data.average_rating);
                                updateRatingDisplay('.overall-rating-stars', data.average_rating);
                            }
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

            // Обработчик наведения для подсветки
            iconContainer.addEventListener('mouseover', function() {
                const value = parseInt(this.getAttribute('data-value'));
                iconContainers.forEach((otherIcon, otherIndex) => {
                    const iconFilled = otherIcon.querySelector('.icon-filled');
                    if (otherIndex < value) {
                        iconFilled.style.width = '100%';
                    } else {
                        iconFilled.style.width = '0%';
                    }
                });
            });

            // Обработчик ухода мыши (возвращаем текущий рейтинг)
            iconContainer.addEventListener('mouseout', function() {
                const currentRating = parseFloat(interactiveStarsContainer.getAttribute('data-rating')) || 0;
                iconContainers.forEach((otherIcon, otherIndex) => {
                    const iconFilled = otherIcon.querySelector('.icon-filled');
                    const value = otherIndex + 1;
                    if (value <= Math.floor(currentRating)) {
                        iconFilled.style.width = '100%';
                    } else if (value - 1 < currentRating && currentRating < value) {
                        const percentage = (currentRating - Math.floor(currentRating)) * 100;
                        iconFilled.style.width = `${percentage}%`;
                    } else {
                        iconFilled.style.width = '0%';
                    }
                });
            });
        });
    }

    // 5. Инициализация GLightbox
    if (typeof GLightbox !== 'undefined') {
        const lightbox = GLightbox({
            selector: '.glightbox',
            loop: true,
            touchNavigation: true,
            keyboardNavigation: true,
            closeOnOutsideClick: true,
            plyr: {
                css: 'https://cdn.plyr.io/3.6.12/plyr.css',
                js: 'https://cdn.plyr.io/3.6.12/plyr.polyfilled.js',
                speed: {
                    selected: 1,
                    options: [0.5, 1, 1.25, 1.5]
                },
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
                    normal: 'Обычная',
                    quality: 'Качество',
                    loop: 'Повтор',
                    start: 'Старт',
                    end: 'Конец',
                    all: 'Все',
                    reset: 'Сброс',
                    disabled: 'Отключено',
                    enabled: 'Включено',
                    advertisement: 'Реклама',
                    qualityBadge: {
                        '2160': '4K',
                        '1440': 'HD',
                        '1080': 'HD',
                        '720': 'HD',
                        '576': 'SD',
                        '480': 'SD'
                    }
                }
            }
        });
        console.log('GLightbox initialized with Plyr v3.6.12 and speed options');
    } else {
        console.error('GLightbox is not defined. Check if the library is loaded correctly.');
    }

    // 6. Логика переключения табов
    const tabContainer = document.querySelector('.tab-navigation');
    const contentSections = document.querySelectorAll('.content-section');
    const tabButtons = document.querySelectorAll('.tab-button');

    if (tabContainer && contentSections.length > 0 && tabButtons.length > 0) {
        tabContainer.addEventListener('click', function(event) {
            const clickedButton = event.target.closest('.tab-button');
            if (clickedButton) {
                const targetId = clickedButton.dataset.target;
                if (!targetId) return;

                tabButtons.forEach(button => {
                    button.classList.remove('active');
                });
                clickedButton.classList.add('active');

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

    // 7. Обработчик для "Показать еще" похожие стартапы
    const showMoreSimilarBtn = document.querySelector('.action-button.show-more-similar');
    const similarGrid = document.querySelector('.similar-startups-grid');

    if (showMoreSimilarBtn && similarGrid) {
        showMoreSimilarBtn.addEventListener('click', function() {
            this.textContent = 'Загрузка...';
            this.disabled = true;

            const loadSimilarUrl = pageDataElement.dataset.loadSimilarUrl;
            if (!loadSimilarUrl) {
                console.error('URL для загрузки похожих стартапов не найден в data-атрибуте!');
                this.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
                this.disabled = false;
                alert('Произошла ошибка конфигурации.');
                return;
            }

            fetch(loadSimilarUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const currentCards = similarGrid.querySelectorAll('.similar-card:not(.show-more-placeholder)');
                    currentCards.forEach(card => card.remove());

                    const placeholder = similarGrid.querySelector('.show-more-placeholder');
                    if (placeholder) {
                        placeholder.insertAdjacentHTML('beforebegin', html);
                    } else {
                        similarGrid.innerHTML += html;
                    }

                    const newCards = similarGrid.querySelectorAll('.similar-card:not(.show-more-placeholder)');
                    newCards.forEach((card, cardIndex) => {
                        const similarRatingContainer = card.querySelector('.similar-card-rating');
                        if (similarRatingContainer && similarRatingContainer.dataset.rating !== undefined) {
                            const ratingStringRaw = similarRatingContainer.dataset.rating;
                            const ratingStringForJs = ratingStringRaw ? ratingStringRaw.replace(',', '.') : '0';
                            const similarRatingValue = parseFloat(ratingStringForJs) || 0;
                            updateRatingDisplay(`.similar-card[href="${card.getAttribute('href')}"] .similar-card-rating`, similarRatingValue);
                        }
                    });

                    this.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
                    this.disabled = false;
                })
                .catch(error => {
                    console.error('Ошибка при загрузке похожих стартапов:', error);
                    this.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
                    this.disabled = false;
                    alert('Не удалось загрузить похожие стартапы.');
                });
        });
    }

    // 8. Обработчик для ссылки "Комментарии"
    const commentsLink = document.querySelector('.comments-link[href="#comments-section"]');
    const commentsTabButton = document.querySelector('.tab-button[data-target="comments-section"]');
    const commentsSection = document.getElementById('comments-section');

    if (commentsLink && commentsTabButton && commentsSection) {
        commentsLink.addEventListener('click', function(event) {
            event.preventDefault();

            if (!commentsTabButton.classList.contains('active')) {
                commentsTabButton.click();
            }

            if (window.getComputedStyle(commentsSection).display !== 'none') {
                commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const tabContentContainer = document.querySelector('.tab-content-container');
                if (tabContentContainer) {
                    const activeSection = tabContentContainer.querySelector('.content-section.active');
                    if (activeSection) activeSection.classList.remove('active');
                }
                commentsSection.classList.add('active');
                setTimeout(() => {
                    commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });
    }
});