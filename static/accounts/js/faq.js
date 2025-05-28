document.addEventListener('DOMContentLoaded', function () {
    const accordionCategories = document.querySelectorAll('.faq-accordion-category');
    const questionItems = document.querySelectorAll('.faq-question-item, .faq-question-category');
    const faqAnswerTitle = document.getElementById('faqAnswerTitle');
    const faqAnswerBody = document.getElementById('faqAnswerBody');
    const chevronIconPath = "{% static 'accounts/images/faq/chevron_down.svg' %}"; // Store path for JS use

    let faqData = {};
    try {
        const faqDataElement = document.getElementById('faqData');
        if (faqDataElement) {
            faqData = JSON.parse(faqDataElement.textContent);
        } else {
            console.error('FAQ data element not found');
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
                // Закрыть все другие аккордеоны на том же уровне, кроме родительских
                // этого немного сложно сделать без изменения структуры или добавления классов уровней
                // Пока просто toggle
                const isOpen = category.classList.contains('open');
                
                // Закрываем все открытые аккордеоны того же уровня, если это не вложенный аккордеон
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
                     // Закрываем другие вложенные аккордеоны внутри того же родителя
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
                    if (content) content.style.display = 'flex';
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            });
        }
    });

    // Обработка кликов по вопросам
    questionItems.forEach(item => {
        item.addEventListener('click', function () {
            const questionId = this.dataset.questionId;

            // Снять класс active со всех элементов
            questionItems.forEach(qItem => qItem.classList.remove('active'));
            // Добавить класс active к текущему элементу
            this.classList.add('active');

            if (faqData[questionId] && faqAnswerTitle && faqAnswerBody) {
                faqAnswerTitle.textContent = faqData[questionId].title;
                // Для корректной вставки HTML и обработки тега {% static %}
                // необходимо заменить плейсхолдер на актуальный путь к статике.
                // Этот путь должен быть доступен JS, например, через data-атрибут или глобальную переменную.
                // Предположим, что bluearrow.svg всегда в одном месте
                const staticPath = document.body.dataset.staticBluearrowPath || '/{% static "accounts/images/faq/bluearrow.svg" %}'.replace("{% static '", "").replace("' %}", "");
                let answerHTML = faqData[questionId].answer;
                
                // Замена плейсхолдера для статики в HTML ответа
                // Обратите внимание: это упрощенная замена. Если {% static %} используется сложнее, потребуется более robust решение.
                answerHTML = answerHTML.replace(/{% static 'accounts\/images\/faq\/bluearrow.svg' %}/g, staticPath);

                faqAnswerBody.innerHTML = answerHTML;
            } else {
                if (!faqData[questionId]) console.warn(`No data found for question ID: ${questionId}`);
                if (!faqAnswerTitle) console.warn('faqAnswerTitle element not found');
                if (!faqAnswerBody) console.warn('faqAnswerBody element not found');
                // Можно отобразить сообщение по умолчанию или ошибку
                // faqAnswerTitle.textContent = "Ответ не найден";
                // faqAnswerBody.innerHTML = "<p>Пожалуйста, выберите другой вопрос.</p>";
            }
        });
    });

    // Открываем первый активный вопрос и его родительские аккордеоны при загрузке
    const initiallyActiveItem = document.querySelector('.faq-question-item.active');
    if (initiallyActiveItem) {
        // Кликаем, чтобы загрузить контент
        initiallyActiveItem.click(); 

        // Открываем родительские аккордеоны
        let parent = initiallyActiveItem.closest('.faq-accordion-category');
        while (parent) {
            if (!parent.classList.contains('open')) {
                const header = parent.querySelector('.faq-accordion-header');
                if (header) header.click(); // Симулируем клик для открытия и анимации
                else { // Если нет хедера (например, корневой элемент), просто открываем
                     parent.classList.add('open');
                     const content = parent.querySelector('.faq-accordion-content');
                     if(content) content.style.display = 'flex';
                }
            }
            parent = parent.parentElement.closest('.faq-accordion-category');
        }
    }

    // Сохраняем путь к bluearrow.svg в data-атрибут body для использования в JS
    // Это нужно сделать, если путь генерируется Django и мы хотим его использовать в JS безопасно
    // В HTML-шаблоне это может быть установлено так: <body data-static-bluearrow-path="{% static 'accounts/images/faq/bluearrow.svg' %}">
    // Здесь мы просто убедимся, что он есть, если нет, JS будет использовать заглушку, что не идеально
    if (!document.body.dataset.staticBluearrowPath) {
        // Пытаемся извлечь из одного из линков, если он уже отрисован
        const exampleLink = document.querySelector('.faq-answer-details-link img[src*="bluearrow.svg"]');
        if (exampleLink) {
            document.body.dataset.staticBluearrowPath = exampleLink.getAttribute('src');
        }
    }
});
