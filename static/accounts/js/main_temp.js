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
