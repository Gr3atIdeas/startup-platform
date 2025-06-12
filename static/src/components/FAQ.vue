<template>
    <div class="faq-page-wrapper">
      <div class="faq-main-container">
        <div class="faq-header-block">
          <div class="faq-title-section">
            <h1 class="faq-main-title-text">FAQ</h1>
            <p class="faq-subtitle-text">Часто <br>задаваемые вопросы</p>
          </div>
          <div class="faq-ask-question-section">
            <p class="faq-ask-question-prompt">Не нашли ответа?</p>
            <a href="/support" class="faq-ask-question-button">Задать вопрос</a>
          </div>
        </div>
  
        <div class="faq-content-block">
          <div class="faq-left-panel">
            <div class="faq-question-category" 
                 :class="{ active: activeQuestionId === 'what-is-great-ideas' }" 
                 @click="selectQuestion('what-is-great-ideas')">
              Что такое «Great Ideas»?
            </div>
  
            <div class="faq-accordion-category" v-for="(category, c_index) in categories" :key="c_index">
              <div class="faq-accordion-header" @click="toggleCategory(c_index)">
                <span>{{ category.title }}</span>
                <img src="/static/accounts/images/faq/chevron_down.svg" alt="toggle" class="faq-chevron-icon" :class="{ 'rotated': category.open }">
              </div>
              <div class="faq-accordion-content" v-show="category.open">
                <div class="faq-accordion-category nested" v-for="(subCategory, s_index) in category.subCategories" :key="s_index">
                  <div class="faq-accordion-header" @click="toggleSubCategory(c_index, s_index)">
                    <span>{{ subCategory.title }}</span>
                    <img src="/static/accounts/images/faq/chevron_down.svg" alt="toggle" class="faq-chevron-icon" :class="{ 'rotated': subCategory.open }">
                  </div>
                  <div class="faq-accordion-content" v-show="subCategory.open">
                    <div class="faq-question-item" 
                         v-for="question in subCategory.questions" 
                         :key="question.id" 
                         :data-question-id="question.id" 
                         :class="{ active: activeQuestionId === question.id }"
                         @click="selectQuestion(question.id)">
                         {{ faqData[question.id]?.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <div class="faq-right-panel">
            <h2 class="faq-answer-title" id="faqAnswerTitle">{{ currentQuestion.title }}</h2>
            <div class="faq-answer-body" id="faqAnswerBody" v-html="currentQuestion.answer"></div>
          </div>
          <div class="faq-custom-scrollbar-visual"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed } from 'vue';
  
  const activeQuestionId = ref('what-is-great-ideas');
  
  const faqData = reactive({
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
          "answer": "<p>Бизнес-план, презентация, финансовая модель и юридические документы, подтверждающие право собственности.</p>"
      },
      "platform-commission": {
          "title": "Какая комиссия взимается с успешного проекта?",
          "answer": "<p>Стандартная комиссия составляет 5% от суммы привлеченных инвестиций. <a href='#' class='faq-answer-details-link'>Узнайте больше о тарифах <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
      },
      "data-confidentiality-legal": {
          "title": "Как защищена конфиденциальность данных?",
          "answer": "<p>Все данные защищены согласно политике конфиденциальности и не передаются третьим лицам без вашего согласия.</p>"
      },
      "specialists-on-platform": {
          "title": "Каких специалистов можно найти на платформе?",
          "answer": "<p>Вы можете найти разработчиков, маркетологов, дизайнеров, юристов, финансовых консультантов и других специалистов.</p>"
      },
      "specialist-quality-check": {
          "title": "Как проверяется качество специалистов?",
          "answer": "<p>Специалисты проходят верификацию, предоставляют портфолио и отзывы от предыдущих клиентов.</p>"
      },
      "protecting-ip": {
          "title": "Как защитить интеллектуальную собственность?",
          "answer": "<p>Рекомендуем заключать NDA (соглашение о неразглашении) с инвесторами и специалистами перед раскрытием конфиденциальной информации.</p>"
      },
      "who-can-be-investor": {
          "title": "Кто может стать инвестором на платформе?",
          "answer": "<p>Инвестором может стать любое физическое или юридическое лицо, прошедшее регистрацию и верификацию.</p>"
      },
      "accredited-investor-status": {
          "title": "Как подтвердить статус аккредитованного инвестора?",
          "answer": "<p>Необходимо предоставить документы, подтверждающие ваш доход, активы или профессиональный опыт в соответствии с законодательством вашей страны.</p>"
      },
      "find-suitable-startups": {
          "title": "Как найти подходящие стартапы?",
          "answer": "<p>Используйте фильтры по категориям, стадиям развития, сумме инвестиций и другим параметрам. <a href='#' class='faq-answer-details-link'>Перейти к поиску <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>"
      },
      "request-additional-data": {
          "title": "Можно ли запросить дополнительные данные у стартапа?",
          "answer": "<p>Да, вы можете отправить запрос на получение дополнительной информации через платформу после подписания NDA.</p>"
      },
      "investment-risks": {
          "title": "Какие риски связаны с инвестициями?",
          "answer": "<p>Инвестиции в стартапы связаны с высоким риском, включая потерю всех вложенных средств. Рекомендуем тщательно анализировать проекты перед принятием решения.</p>"
      },
      "how-to-invest": {
          "title": "Как я могу инвестировать в стартап или франшизу?",
          "answer": "<p>Выберите проект, изучите его и нажмите кнопку «Инвестировать». Следуйте инструкциям для перевода средств.</p>"
      },
      "investment-confirmation": {
          "title": "Как я получу подтверждение своей инвестиции?",
          "answer": "<p>После успешного перевода средств вы получите электронное подтверждение и юридические документы, закрепляющие вашу долю.</p>"
      },
      "can-sell-investment": {
          "title": "Могу ли я продать свою инвестицию?",
          "answer": "<p>Возможность продажи доли зависит от условий соглашения с конкретным стартапом. Некоторые проекты могут предлагать вторичный рынок для своих акций.</p>"
      },
      "commission-for-investing": {
          "title": "Есть ли комиссия за инвестирование?",
          "answer": "<p>Для инвесторов комиссия отсутствует. Все расходы покрываются за счет комиссии с проекта, привлекшего инвестиции.</p>"
      },
      "cancel-investment": {
          "title": "Могу ли я отменить свою инвестицию?",
          "answer": "<p>Отмена инвестиции возможна до момента закрытия раунда финансирования. После этого средства передаются стартапу.</p>"
      },
      "investment-confirmation-docs": {
          "title": "Какие документы подтверждают мою инвестицию?",
          "answer": "<p>Вы получите договор конвертируемого займа или договор купли-продажи доли, а также выписку из реестра акционеров.</p>"
      },
      "contact-startup-founders": {
          "title": "Как я могу связаться с основателями стартапа?",
          "answer": "<p>После выражения заинтересованности и подписания NDA вы получите доступ к контактным данным основателей.</p>"
      }
  });
  
  const categories = reactive([
      { 
          title: 'Для стартаперов и владельцев франшиз', 
          open: true,
          subCategories: [
              { 
                  title: 'Создание и ведение профиля стартапа', 
                  open: true,
                  questions: [
                      { id: 'how-to-register' },
                      { id: 'how-to-setup-profile' },
                      { id: 'can-edit-info' },
                      { id: 'franchise-types' },
                      { id: 'franchise-limits' },
                      { id: 'franchise-requirements' },
                      { id: 'franchise-verification' },
                      { id: 'franchise-data-privacy' },
                  ]
              },
              {
                  title: 'Привлечение инвестиций',
                  open: false,
                  questions: [
                      { id: 'how-to-get-noticed' },
                      { id: 'minimum-goal' },
                      { id: 'attract-more-investors' },
                  ]
              },
              {
                  title: 'Продажа стартапа или франшизы',
                  open: false,
                  questions: [
                      { id: 'how-to-sell-startup' },
                      { id: 'sell-part-of-company' },
                  ]
              },
              {
                  title: 'Категории стартапов',
                  open: false,
                  questions: [
                      { id: 'startup-categories-allowed' },
                      { id: 'startup-categories-forbidden' },
                  ]
              },
              {
                  title: 'Правовые и финансовые вопросы',
                  open: false,
                  questions: [
                      { id: 'required-documents' },
                      { id: 'platform-commission' },
                      { id: 'data-confidentiality-legal' },
                  ]
              },
              {
                  title: 'Услуги специалистов и подрядчиков',
                  open: false,
                  questions: [
                      { id: 'specialists-on-platform' },
                      { id: 'specialist-quality-check' },
                      { id: 'protecting-ip' },
                  ]
              },
          ]
      },
      { 
          title: 'Для инвесторов', 
          open: false,
          subCategories: [
              { 
                  title: 'Регистрация и настройка профиля', 
                  open: false,
                  questions: [
                      { id: 'who-can-be-investor' },
                      { id: 'accredited-investor-status' },
                  ]
              },
              {
                  title: 'Поиск и анализ стартапов, франшиз и подрядчиков',
                  open: false,
                  questions: [
                      { id: 'find-suitable-startups' },
                      { id: 'request-additional-data' },
                      { id: 'investment-risks' },
                  ]
              },
              {
                  title: 'Инвестирование и сделки',
                  open: false,
                  questions: [
                      { id: 'how-to-invest' },
                      { id: 'investment-confirmation' },
                      { id: 'can-sell-investment' },
                  ]
              },
              {
                  title: 'Комиссии и расходы',
                  open: false,
                  questions: [
                      { id: 'commission-for-investing' },
                      { id: 'cancel-investment' },
                  ]
              },
              {
                  title: 'Правовые аспекты и поддержка',
                  open: false,
                  questions: [
                      { id: 'investment-confirmation-docs' },
                      { id: 'contact-startup-founders' },
                  ]
              }
          ]
      },
  ]);
  
  const currentQuestion = computed(() => {
    return faqData[activeQuestionId.value] || { title: '', answer: '' };
  });
  
  function selectQuestion(id) {
    activeQuestionId.value = id;
  }
  
  function toggleCategory(index) {
    categories[index].open = !categories[index].open;
  }
  
  function toggleSubCategory(catIndex, subCatIndex) {
    categories[catIndex].subCategories[subCatIndex].open = !categories[catIndex].subCategories[subCatIndex].open;
  }
  
  </script>
  
  <style scoped>
  /* Copied from static/accounts/css/faq.css */
  .faq-page-wrapper {
      background: #141414;
      padding: 20px;
      font-family: 'Golos', sans-serif;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
  }
  
  .faq-main-container {
      background: #232323;
      border-radius: 10px;
      padding: 30px;
      width: 100%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
  }
  
  .faq-header-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
  }
  
  .faq-title-section .faq-main-title-text {
      font-size: 24px;
      font-weight: 700;
      color: #8A2BE2; /* Violet */
      margin: 0;
  }
  
  .faq-title-section .faq-subtitle-text {
      font-size: 16px;
      color: #ccc;
      margin: 5px 0 0;
  }
  
  .faq-ask-question-section {
      text-align: right;
  }
  
  .faq-ask-question-prompt {
      font-size: 14px;
      color: #ccc;
      margin: 0 0 10px;
  }
  
  .faq-ask-question-button {
      background: #8A2BE2;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: 700;
      transition: background-color 0.3s;
  }
  
  .faq-ask-question-button:hover {
      background: #7B1FA2;
  }
  
  .faq-content-block {
      display: flex;
      gap: 20px;
  }
  
  .faq-left-panel, .faq-right-panel {
      background: #1A1A1A;
      padding: 20px;
      border-radius: 8px;
  }
  
  .faq-left-panel {
      flex: 1;
      overflow-y: auto;
      max-height: 600px;
  }
  
  .faq-right-panel {
      flex: 2;
      display: flex;
      flex-direction: column;
  }
  
  .faq-question-category, .faq-accordion-header, .faq-question-item {
      cursor: pointer;
      padding: 10px;
      border-bottom: 1px solid #333;
      transition: background-color 0.3s;
  }
  
  .faq-question-category.active, .faq-question-item.active {
      background-color: #8A2BE2;
      color: #fff;
  }
  
  .faq-accordion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
  }
  
  .faq-chevron-icon {
      transition: transform 0.3s;
  }
  
  .faq-chevron-icon.rotated {
      transform: rotate(180deg);
  }
  
  .faq-accordion-content {
      padding-left: 20px;
  }
  
  .faq-answer-title {
      font-size: 20px;
      font-weight: 700;
      color: #8A2BE2;
      margin: 0 0 20px;
  }
  
  .faq-answer-body p {
      font-size: 16px;
      line-height: 1.6;
      color: #ccc;
  }
  
  .faq-answer-details-link {
      color: #8A2BE2;
      text-decoration: none;
      font-weight: 700;
  }
  
  .faq-answer-details-link img {
      margin-left: 5px;
  }
  </style>