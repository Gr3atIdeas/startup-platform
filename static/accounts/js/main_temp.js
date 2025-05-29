// This is a placeholder for JavaScript code for the main_temp page.
// We can add functionality here later if needed.

document.addEventListener('DOMContentLoaded', function () {
    const faqData = {
        "what-is-great-ideas": {
            "title": "Что такое «Great Ideas»?",
            "answer": "<p>«Great Ideas» — это маркетплейс стартапов, где стартаперы размещают свои проекты, а инвесторы исследуют их в поисках лучших идей для инвестиций или покупки.</p>"
        },
        "how-to-register": {
            "title": "Как зарегистрироваться на платформе «Great Ideas»?",
            "answer": "<p>Зарегистрируйтесь через форму на главной странице. Подтвердите почту и заполните профиль.</p>"
        },
        "how-to-setup-profile": {
            "title": "Как правильно оформить профиль стартапа?",
            "answer": "<p>Добавьте логотип, описание проекта, команду, презентацию и ключевые данные. <a href='#' class='faq-answer-details-link'>Узнайте больше о том, как правильно регистрировать проект <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
        },
        "can-edit-info": {
            "title": "Можно ли редактировать информацию после публикации?",
            "answer": "<p>Да, вы можете редактировать информацию, но изменения будут проходить модерацию.</p>"
        },
        "franchise-types": {
            "title": "Какие виды франшиз можно размещать?",
            "answer": "<p>Франшизы в сферах общественного питания, розничной торговли, услуг для бизнеса, образования, здоровья/красоты, IT и других. <a href='#' class='faq-answer-details-link'>Список доступных сфер <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
        },
        "franchise-limits": {
            "title": "Есть ли ограничения на размещение франшиз?",
            "answer": "<p>Нельзя размещать франшизы в сферах азартных игр, MLM, финансовых пирамид, взрослого контента и запрещенных законом видов деятельности.</p>"
        },
        "franchise-requirements": {
            "title": "Какие требования для размещения франшизы?",
            "answer": "<p>Зарегистрированный бизнес, подтвержденная бизнес-модель, финансовая отчетность, наличие сайта и маркетинговых материалов.</p>"
        },
        "franchise-verification": {
            "title": "Проверяет ли платформа франшизы перед публикацией?",
            "answer": "<p>Да, все франшизы проходят модерацию на соответствие требованиям платформы. Однако Great Ideas не несет ответственности за финансовое состояние или успех франшизы. Инвесторам рекомендуется самостоятельно изучать и проверять проекты перед инвестированием.</p>"
        },
        "franchise-data-privacy": {
            "title": "Как защищена конфиденциальность данных франшизы?",
            "answer": "<p>Названия компаний и чувствительные данные скрыты до подписания NDA с заинтересованным инвестором.</p>"
        },
        "how-to-get-noticed": {
            "title": "Как сделать мой стартап заметным для инвесторов?",
            "answer": "<p>Заполните профиль максимально детально, добавьте видео-презентацию и кейсы.</p>"
        },
        "minimum-goal": {
            "title": "Что такое минимальная цель и что будет, если я её не достигну?",
            "answer": "<p>Минимальная цель – это сумма, необходимая для запуска проекта. Если она не достигнута, инвестиции возвращаются инвесторам. (требует обсуждение с клиентом).</p>"
        },
        "attract-more-investors": {
            "title": "Как я могу привлечь больше инвесторов?",
            "answer": "<p>Регулярно обновляйте информацию, публикуйте новости о развитии проекта, участвуйте в обсуждениях.</p>"
        },
        "how-to-sell-startup": {
            "title": "Как выставить стартап на продажу?",
            "answer": "<p>В разделе «Создать стартап/франшизу» выберите тип «Продажа бизнеса».</p>"
        },
        "sell-part-of-company": {
            "title": "Можно ли продать только часть компании?",
            "answer": "<p>Да, вы можете предложить долевую продажу.</p>"
        },
        "startup-categories-allowed": {
            "title": "Какие категории стартапов можно размещать?",
            "answer": "<p>Технологические, электронная коммерция, инновационные продукты, гейминг, образование, креативные индустрии, наука, экология.</p>"
        },
        "startup-categories-forbidden": {
            "title": "Какие категории стартапов нельзя размещать?",
            "answer": "<p>Контент для взрослых, финансовые пирамиды, азартные игры, нелегальная фармацевтика, политика, криптовалюты.</p>"
        },
        "required-documents": {
            "title": "Какие документы нужно предоставить?",
            "answer": "<p>Бизнес-план, финансовая модель, презентация проекта. Для юридических лиц — копии учредительных документов. <a href='#' class='faq-answer-details-link'>Подробнее о документах <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
        },
        "platform-commission": {
            "title": "Какая комиссия взимается с успешного проекта?",
            "answer": "<p>Комиссия составляет 5% от суммы привлеченных инвестиций (требует обсуждение с клиентом).</p>"
        },
        "data-confidentiality-legal": {
            "title": "Как защищена конфиденциальность данных?",
            "answer": "<p>Мы используем современные методы шифрования и соблюдаем политику конфиденциальности. <a href='#' class='faq-answer-details-link'>Политика конфиденциальности <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
        },
        "specialists-on-platform": {
            "title": "Каких специалистов можно найти на платформе?",
            "answer": "<p>Маркетологи, разработчики, дизайнеры, юристы, финансовые консультанты и другие. <a href='#' class='faq-answer-details-link'>Найти специалиста <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
        },
        "specialist-quality-check": {
            "title": "Как проверяется качество специалистов?",
            "answer": "<p>Специалисты проходят верификацию, предоставляют портфолио и отзывы от предыдущих клиентов.</p>"
        },
        "protecting-ip": {
            "title": "Как защитить интеллектуальную собственность?",
            "answer": "<p>Рекомендуем заключать NDA с инвесторами и партнерами. Платформа также предоставляет шаблоны документов.</p>"
        },
        "who-can-be-investor": {
            "title": "Кто может стать инвестором на платформе?",
            "answer": "<p>Любое физическое или юридическое лицо, заинтересованное в инвестировании в стартапы или франшизы.</p>"
        },
        "accredited-investor-status": {
            "title": "Как подтвердить статус аккредитованного инвестора?",
            "answer": "<p>Предоставьте документы, подтверждающие ваш доход или капитал, в соответствии с законодательством вашей страны.</p>"
        },
        "find-suitable-startups": {
            "title": "Как найти подходящие стартапы?",
            "answer": "<p>Используйте фильтры по категориям, сумме инвестиций, стадии проекта и другим параметрам.</p>"
        },
        "request-additional-data": {
            "title": "Можно ли запросить дополнительные данные у стартапа?",
            "answer": "<p>Да, после подписания NDA вы можете запросить более детальную информацию.</p>"
        },
        "investment-risks": {
            "title": "Какие риски связаны с инвестициями?",
            "answer": "<p>Инвестиции в стартапы являются высокорискованными и могут привести к потере вложенных средств. <a href='#' class='faq-answer-details-link'>Подробнее о рисках <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
        },
        "how-to-invest": {
            "title": "Как я могу инвестировать в стартап или франшизу?",
            "answer": "<p>Выберите проект, изучите информацию, свяжитесь с основателями и заключите сделку через платформу.</p>"
        },
        "investment-confirmation": {
            "title": "Как я получу подтверждение своей инвестиции?",
            "answer": "<p>Вы получите электронное подтверждение и соответствующие юридические документы.</p>"
        },
        "can-sell-investment": {
            "title": "Могу ли я продать свою инвестицию?",
            "answer": "<p>Да, на платформе предусмотрена возможность продажи доли в стартапе (требует обсуждение с клиентом).</p>"
        },
        "commission-for-investing": {
            "title": "Есть ли комиссия за инвестирование?",
            "answer": "<p>Для инвесторов комиссия отсутствует (требует обсуждение с клиентом).</p>"
        },
        "cancel-investment": {
            "title": "Могу ли я отменить свою инвестицию?",
            "answer": "<p>Условия отмены инвестиций зависят от стадии проекта и соглашения с основателями (требует обсуждение с клиентом).</p>"
        },
        "investment-confirmation-docs": {
            "title": "Какие документы подтверждают мою инвестицию?",
            "answer": "<p>Договор инвестирования, выписка из реестра акционеров (если применимо).</p>"
        },
        "contact-startup-founders": {
            "title": "Как я могу связаться с основателями стартапа?",
            "answer": "<p>Используйте внутреннюю систему сообщений на платформе после выражения интереса к проекту.</p>"
        }
    };

    const questionItems = document.querySelectorAll('.faq-question-item, .faq-question-category');
    const answerTitleElement = document.getElementById('faqAnswerTitle');
    const answerBodyElement = document.getElementById('faqAnswerBody');
    const accordionCategories = document.querySelectorAll('.faq-accordion-category');

    function updateAnswer(questionId) {
        const questionData = faqData[questionId];
        if (questionData) {
            answerTitleElement.textContent = questionData.title;
            answerBodyElement.innerHTML = questionData.answer;
        }
    }

    questionItems.forEach(item => {
        item.addEventListener('click', function () {
            // Remove active class from all items
            questionItems.forEach(qItem => qItem.classList.remove('active'));
            // Add active class to the clicked item
            this.classList.add('active');
            
            const questionId = this.dataset.questionId;
            if (questionId) {
                updateAnswer(questionId);
            }
        });
    });

    accordionCategories.forEach(category => {
        const header = category.querySelector('.faq-accordion-header');
        header.addEventListener('click', function () {
            // Toggle the 'open' class on the parent .faq-accordion-category
            category.classList.toggle('open');
        });
    });

    // Initialize with the first question active (if any)
    const initialActiveQuestion = document.querySelector('.faq-question-category.active');
    if (initialActiveQuestion) {
        const initialQuestionId = initialActiveQuestion.dataset.questionId;
        if (initialQuestionId) {
            updateAnswer(initialQuestionId);
        }
    } else if (questionItems.length > 0) {
        // If no question is active by default, activate the first one
        const firstQuestion = questionItems[0];
        firstQuestion.classList.add('active');
        const firstQuestionId = firstQuestion.dataset.questionId;
        if (firstQuestionId) {
            updateAnswer(firstQuestionId);
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.features-carousel');
    const wrapper = document.querySelector('.features-carousel-wrapper');
    const arrowLeft = document.querySelector('.arrow-left-control');
    const arrowRight = document.querySelector('.arrow-right-control');

    if (!carousel || !arrowLeft || !arrowRight || !wrapper) {
        console.warn('Элементы карусели не найдены. Проверьте классы HTML.');
        return;
    }

    const cards = carousel.querySelectorAll('.feature-card');
    if (cards.length === 0) {
        console.warn('Карточки в карусели не найдены.');
        return;
    }

    const cardWidth = cards[0].offsetWidth;
    const gap = parseInt(getComputedStyle(carousel).gap) || 20; // Получаем gap или используем 20px по умолчанию
    const visibleCards = 3; // Сколько карточек видно одновременно
    let currentScroll = 0;
    const scrollAmount = cardWidth + gap; // На сколько смещать за один клик
    // Максимальное смещение, чтобы последние visibleCards карточек были видны
    const maxScroll = (cards.length - visibleCards) * scrollAmount;

    function updateArrows() {
        arrowLeft.style.opacity = currentScroll <= 0 ? '0.5' : '1';
        arrowLeft.style.pointerEvents = currentScroll <= 0 ? 'none' : 'auto';
        arrowRight.style.opacity = currentScroll >= maxScroll ? '0.5' : '1';
        arrowRight.style.pointerEvents = currentScroll >= maxScroll ? 'none' : 'auto';
    }

    arrowLeft.addEventListener('click', () => {
        currentScroll -= scrollAmount;
        if (currentScroll < 0) {
            currentScroll = 0;
        }
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        updateArrows();
    });

    arrowRight.addEventListener('click', () => {
        currentScroll += scrollAmount;
        if (currentScroll > maxScroll) {
            currentScroll = maxScroll;
        }
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        updateArrows();
    });

    // Инициализация состояния стрелок
    updateArrows();

    // Drag to scroll functionality
    let isDown = false;
    let startX;
    let scrollLeft;

    wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        wrapper.classList.add('active-drag'); // Можно добавить класс для стилизации при перетаскивании
        startX = e.pageX - wrapper.offsetLeft;
        scrollLeft = currentScroll; // Используем текущее смещение карусели
    });

    wrapper.addEventListener('mouseleave', () => {
        if (!isDown) return;
        isDown = false;
        wrapper.classList.remove('active-drag');
        // Snap to nearest card after drag ends
        const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
        currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
        carousel.style.transition = 'transform 0.3s ease-out'; // Плавное доведение
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        updateArrows();
        setTimeout(() => {
            carousel.style.transition = 'transform 0.5s ease-in-out'; // Возвращаем основную анимацию
        }, 300);
    });

    wrapper.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        wrapper.classList.remove('active-drag');
        // Snap to nearest card after drag ends
        const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
        currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
        carousel.style.transition = 'transform 0.3s ease-out';
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        updateArrows();
        setTimeout(() => {
            carousel.style.transition = 'transform 0.5s ease-in-out';
        }, 300);
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 1.5; // Умножитель для скорости перетаскивания
        let newScroll = scrollLeft - walk;
        
        // Ограничиваем прокрутку в пределах min/max
        newScroll = Math.max(0, Math.min(newScroll, maxScroll + (visibleCards > 1 ? scrollAmount / 2 : 0 ) )); // Небольшой оверскролл разрешен при драге

        carousel.style.transition = 'none'; // Убираем transition во время перетаскивания
        carousel.style.transform = `translateX(-${newScroll}px)`;
        currentScroll = newScroll; // Обновляем currentScroll для mouseup/mouseleave
        // Стрелки можно не обновлять во время mousemove для производительности,
        // они обновятся по mouseup/mouseleave
    });

});

document.addEventListener('DOMContentLoaded', function () {
    const galaxyCarousel = document.querySelector('.galaxy-carousel');
    const galaxyWrapper = document.querySelector('.galaxy-carousel-wrapper');
    const arrowLeftGalaxy = document.querySelector('.galaxy-arrow-left');
    const arrowRightGalaxy = document.querySelector('.galaxy-arrow-right');
    const currentStepTitleElement = document.querySelector('.galaxy-step-current-title');
    const stepIndicatorButtonText = document.querySelector('.galaxy-step-number-text');

    if (!galaxyCarousel || !arrowLeftGalaxy || !arrowRightGalaxy || !currentStepTitleElement || !stepIndicatorButtonText || !galaxyWrapper) {
        console.warn('Элементы карусели "Галактика" не найдены. Проверьте классы HTML.');
        return;
    }

    const galaxyCards = galaxyCarousel.querySelectorAll('.galaxy-step-card');
    if (galaxyCards.length === 0) {
        console.warn('Карточки в карусели "Галактика" не найдены.');
        return;
    }

    let currentGalaxyIndex = 0;
    const totalGalaxyCards = galaxyCards.length;

    function updateGalaxyCarousel() {
        // Смещаем карусель
        galaxyCarousel.style.transform = `translateX(-${currentGalaxyIndex * 100}%)`;

        // Обновляем заголовок и номер шага
        const currentCardData = galaxyCards[currentGalaxyIndex].querySelector('.galaxy-step-data');
        if (currentCardData) {
            currentStepTitleElement.textContent = currentCardData.dataset.stepTitle || 'Заголовок шага';
            stepIndicatorButtonText.textContent = `${currentCardData.dataset.stepNumber || ''} ШАГ`;
        }
        
        // Обновляем активный класс для карточки (если нужно для стилизации)
        galaxyCards.forEach((card, index) => {
            card.classList.toggle('active-step', index === currentGalaxyIndex);
        });

        // Обновляем состояние стрелок
        arrowLeftGalaxy.classList.toggle('disabled', currentGalaxyIndex === 0);
        arrowRightGalaxy.classList.toggle('disabled', currentGalaxyIndex === totalGalaxyCards - 1);
    }

    arrowLeftGalaxy.addEventListener('click', () => {
        if (currentGalaxyIndex > 0) {
            currentGalaxyIndex--;
            updateGalaxyCarousel();
        }
    });

    arrowRightGalaxy.addEventListener('click', () => {
        if (currentGalaxyIndex < totalGalaxyCards - 1) {
            currentGalaxyIndex++;
            updateGalaxyCarousel();
        }
    });

    // Drag to scroll/swipe functionality for galaxy carousel
    let galaxyIsDown = false;
    let galaxyStartX;
    let galaxyScrollLeft;
    let galaxyWalked = 0; // Для определения, был ли это свайп или клик

    galaxyWrapper.addEventListener('mousedown', (e) => {
        galaxyIsDown = true;
        galaxyWrapper.classList.add('active-drag');
        galaxyStartX = e.pageX - galaxyWrapper.offsetLeft;
        galaxyScrollLeft = galaxyCarousel.style.transform ? parseFloat(galaxyCarousel.style.transform.replace('translateX(', '').replace('%)', '')) : 0;
        galaxyWalked = 0;
        galaxyCarousel.style.transition = 'none'; // Убираем transition для плавного перетаскивания
    });

    galaxyWrapper.addEventListener('mouseleave', () => {
        if (!galaxyIsDown) return;
        galaxyIsDown = false;
        galaxyWrapper.classList.remove('active-drag');
        galaxyCarousel.style.transition = 'transform 0.5s ease-in-out'; // Возвращаем анимацию
        
        // Snap to card based on swipe direction and distance
        const cardWidthPercent = 100; // Каждая карточка 100% ширины
        const threshold = cardWidthPercent / 4; // Порог для свайпа (25% ширины карточки)

        if (galaxyWalked < -threshold) { // Свайп влево (к следующей карточке)
            if (currentGalaxyIndex < totalGalaxyCards - 1) {
                currentGalaxyIndex++;
            }
        } else if (galaxyWalked > threshold) { // Свайп вправо (к предыдущей карточке)
            if (currentGalaxyIndex > 0) {
                currentGalaxyIndex--;
            }
        }
        updateGalaxyCarousel(); // Обновляем карусель (с анимацией snap)
    });

    galaxyWrapper.addEventListener('mouseup', () => {
        if (!galaxyIsDown) return;
        galaxyIsDown = false;
        galaxyWrapper.classList.remove('active-drag');
        galaxyCarousel.style.transition = 'transform 0.5s ease-in-out';

        const cardWidthPercent = 100;
        const threshold = cardWidthPercent / 4;

        if (galaxyWalked < -threshold) {
            if (currentGalaxyIndex < totalGalaxyCards - 1) {
                currentGalaxyIndex++;
            }
        } else if (galaxyWalked > threshold) {
            if (currentGalaxyIndex > 0) {
                currentGalaxyIndex--;
            }
        }
        updateGalaxyCarousel();
    });

    galaxyWrapper.addEventListener('mousemove', (e) => {
        if (!galaxyIsDown) return;
        e.preventDefault();
        const x = e.pageX - galaxyWrapper.offsetLeft;
        const walk = x - galaxyStartX;
        galaxyWalked = walk; // Обновляем пройденное расстояние

        // Переводим walk (в пикселях) в проценты от ширины контейнера
        const walkPercent = (walk / galaxyWrapper.offsetWidth) * 100;
        let newTransform = galaxyScrollLeft + walkPercent;

        // Ограничиваем перетаскивание, чтобы не уйти слишком далеко
        const minTransform = -( (totalGalaxyCards -1) * 100 + 20 ); // - (кол-во карточек -1 ) * 100% - 20% оверскролл
        const maxTransform = 20; // +20% оверскролл
        newTransform = Math.max(minTransform, Math.min(maxTransform, newTransform));

        galaxyCarousel.style.transform = `translateX(${newTransform}%)`;
    });

    // Инициализация карусели
    updateGalaxyCarousel();
});

document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.success-stories-carousel');
    const wrapper = document.querySelector('.success-stories-carousel-outer'); // Обертка вокруг самой карусели
    const arrowLeft = document.querySelector('.success-stories-arrow-left');
    const arrowRight = document.querySelector('.success-stories-arrow-right');

    if (!carousel || !arrowLeft || !arrowRight || !wrapper) {
        console.warn('Элементы карусели "Истории успеха" не найдены. Проверьте классы HTML.');
        return;
    }

    const cards = carousel.querySelectorAll('.success-story-card');
    if (cards.length === 0) {
        console.warn('Карточки в карусели "Истории успеха" не найдены.');
        return;
    }

    const cardWidth = cards[0].offsetWidth;
    const gap = parseInt(getComputedStyle(carousel).gap) || 20;
    const visibleCards = 3; // По макету видно 3 карточки
    let currentScroll = 0;
    const scrollAmount = cardWidth + gap;
    const maxScroll = (cards.length - visibleCards) * scrollAmount;

    function updateArrows() {
        arrowLeft.classList.toggle('disabled', currentScroll <= 0);
        arrowRight.classList.toggle('disabled', currentScroll >= maxScroll);
    }

    arrowLeft.addEventListener('click', () => {
        if (currentScroll > 0) {
            currentScroll -= scrollAmount;
            if (currentScroll < 0) currentScroll = 0;
            carousel.style.transform = `translateX(-${currentScroll}px)`;
            updateArrows();
        }
    });

    arrowRight.addEventListener('click', () => {
        if (currentScroll < maxScroll) {
            currentScroll += scrollAmount;
            if (currentScroll > maxScroll) currentScroll = maxScroll;
            carousel.style.transform = `translateX(-${currentScroll}px)`;
            updateArrows();
        }
    });

    updateArrows();

    // Drag to scroll functionality
    let isDown = false;
    let startX;
    let scrollLeft;

    wrapper.addEventListener('mousedown', (e) => {
        isDown = true;
        wrapper.classList.add('active-drag');
        startX = e.pageX - wrapper.offsetLeft;
        scrollLeft = currentScroll;
        carousel.style.transition = 'none'; // Отключаем анимацию на время перетаскивания
    });

    wrapper.addEventListener('mouseleave', () => {
        if (!isDown) return;
        isDown = false;
        wrapper.classList.remove('active-drag');
        carousel.style.transition = 'transform 0.5s ease-in-out'; // Возвращаем анимацию
        // Snap to nearest card
        const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
        currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        updateArrows();
    });

    wrapper.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        wrapper.classList.remove('active-drag');
        carousel.style.transition = 'transform 0.5s ease-in-out';
        // Snap to nearest card
        const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
        currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
        carousel.style.transform = `translateX(-${currentScroll}px)`;
        updateArrows();
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 1.5; // Множитель скорости
        let newTransform = scrollLeft - walk;
        
        // Ограничиваем прокрутку, чтобы не выходить за пределы слишком сильно во время перетаскивания
        const overscroll = scrollAmount / 2; // Максимальный оверскролл при перетаскивании
        currentScroll = Math.max(-overscroll, Math.min(newTransform, maxScroll + overscroll));
        carousel.style.transform = `translateX(-${currentScroll}px)`; 
        // Обновляем currentScroll напрямую, чтобы mouseup/mouseleave использовали актуальное значение
        // Стрелки не обновляем здесь для производительности, они обновятся при mouseup/mouseleave
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Existing FAQ JS code from faq.js, adapted for main_temp.js

    const accordionCategories = document.querySelectorAll('.faq-accordion-category');
    const questionItems = document.querySelectorAll('.faq-question-item, .faq-question-category');
    const faqAnswerTitle = document.getElementById('faqAnswerTitle');
    const faqAnswerBody = document.getElementById('faqAnswerBody');
    
    // Предполагаем, что изображения chevron_down.svg и bluearrow.svg 
    // уже доступны по путям, указанным в HTML через {% static %}
    // Для JS нам не нужно хранить эти пути отдельно, если они корректно указаны в src у img.

    let faqData = {};
    try {
        const faqDataElement = document.getElementById('faqDataContainer'); // Используем новый ID
        if (faqDataElement) {
            faqData = JSON.parse(faqDataElement.textContent);
        } else {
            console.warn('FAQ data element (faqDataContainer) not found. FAQ will not work.');
        }
    } catch (error) {
        console.error('Error parsing FAQ data:', error);
    }

    // Аккордеоны
    accordionCategories.forEach(category => {
        const header = category.querySelector('.faq-accordion-header');
        const content = category.querySelector('.faq-accordion-content');
        const icon = header ? header.querySelector('.faq-chevron-icon') : null;

        if (header) {
            header.addEventListener('click', () => {
                const isOpen = category.classList.contains('open');
                
                // Логика закрытия других аккордеонов (можно упростить или оставить как есть из faq.js)
                // Для простоты, пока оставим базовый toggle, или можно использовать логику из оригинального faq.js
                // если она не конфликтует и хорошо работает.
                // Текущая логика из faq.js довольно сложная, попробуем её сохранить, но протестировать.

                if (!category.classList.contains('nested') && !category.parentElement.classList.contains('faq-accordion-content')) {
                    accordionCategories.forEach(otherCategory => {
                        if (otherCategory !== category && !otherCategory.classList.contains('nested') && !otherCategory.parentElement.classList.contains('faq-accordion-content')) {
                            otherCategory.classList.remove('open');
                            const otherContent = otherCategory.querySelector('.faq-accordion-content');
                            if (otherContent) otherContent.style.display = 'none';
                            const otherIcon = otherCategory.querySelector('.faq-chevron-icon');
                            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                        }
                    });
                } else if (category.classList.contains('nested')) {
                    const parentContent = category.closest('.faq-accordion-content');
                    if (parentContent) {
                        const siblingNestedAccordions = parentContent.querySelectorAll('.faq-accordion-category.nested');
                        siblingNestedAccordions.forEach(sibling => {
                            if (sibling !== category) {
                                sibling.classList.remove('open');
                                const siblingContent = sibling.querySelector('.faq-accordion-content');
                                if (siblingContent) siblingContent.style.display = 'none';
                                const siblingIcon = sibling.querySelector('.faq-chevron-icon');
                                if (siblingIcon) siblingIcon.style.transform = 'rotate(0deg)';
                            }
                        });
                    }
                }

                if (isOpen) {
                    category.classList.remove('open');
                    if (content) content.style.display = 'none';
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    category.classList.add('open');
                    if (content) content.style.display = 'flex'; // Используем flex как в CSS
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            });
        }
    });

    // Обработка кликов по вопросам
    questionItems.forEach(item => {
        item.addEventListener('click', function () {
            const questionId = this.dataset.questionId;

            questionItems.forEach(qItem => qItem.classList.remove('active'));
            this.classList.add('active');

            if (faqData[questionId] && faqAnswerTitle && faqAnswerBody) {
                faqAnswerTitle.textContent = faqData[questionId].title;
                
                let answerHTML = faqData[questionId].answer;
                // Заменяем " + "{% static ... %} + " на прямые пути, если они статичны
                // или убеждаемся, что Django правильно их рендерит в JSON блоке.
                // В HTML мы оставили {% static %}, Django должен их обработать при рендере страницы.
                // JS не должен пытаться сам обработать {% static %}.
                // Строки вида " + "{% static ... %} + " в JSON были ошибкой при копировании, удалим их.
                // Они должны быть просто строками с тегами {% static %}, которые Django обработает.
                // Пример: "<a href='#'><img src='{% static \'path/to/img.svg\' %}'></a>"
                // После рендеринга Django это станет: "<a href='#'><img src='/static/path/to/img.svg'></a>"
                // Поэтому JS может просто вставлять этот HTML.

                faqAnswerBody.innerHTML = answerHTML;
            } else {
                if (!faqData[questionId]) console.warn(`No data found for question ID: ${questionId}`);
                if (!faqAnswerTitle) console.warn('faqAnswerTitle element not found');
                if (!faqAnswerBody) console.warn('faqAnswerBody element not found');
            }
        });
    });

    // Открываем первый активный вопрос и его родительские аккордеоны при загрузке
    // Это может быть первый элемент с классом .faq-question-category.active или .faq-question-item.active
    const initiallyActiveItem = document.querySelector('.faq-question-category.active, .faq-question-item.active');
    if (initiallyActiveItem) {
        initiallyActiveItem.click(); 

        let parent = initiallyActiveItem.closest('.faq-accordion-category');
        while (parent) {
            if (!parent.classList.contains('open')) {
                const header = parent.querySelector('.faq-accordion-header');
                if (header) { 
                    // Вместо header.click() чтобы не триггерить всю логику закрытия других,
                    // просто откроем текущий.
                    parent.classList.add('open');
                    const content = parent.querySelector('.faq-accordion-content');
                    if (content) content.style.display = 'flex';
                    const icon = header.querySelector('.faq-chevron-icon');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                } else {
                     parent.classList.add('open');
                     const content = parent.querySelector('.faq-accordion-content');
                     if(content) content.style.display = 'flex';
                }
            }
            parent = parent.parentElement.closest('.faq-accordion-category');
        }
    }
});
