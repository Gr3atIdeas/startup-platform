<template>
  <div class="faq-page-wrapper">
    <div class="faq-main-container">
      <div class="faq-header-block">
        <div class="faq-title-section">
          <h1 class="faq-main-title-text">FAQ</h1>
          <p class="faq-subtitle-text">Часто <br />задаваемые вопросы</p>
        </div>
        <div class="faq-ask-question-section">
          <p class="faq-ask-question-prompt">Не нашли ответа?</p>
          <a href="/support" class="faq-ask-question-button">Задать вопрос</a>
        </div>
      </div>

      <div class="faq-content-block">
        <div class="faq-left-panel">
          <div
            class="faq-question-category"
            :class="{ active: activeQuestionId === 'what-is-great-ideas' }"
            @click="selectQuestion('what-is-great-ideas')"
          >
            Что такое «Great Ideas»?
          </div>

          <div
            class="faq-accordion-category"
            v-for="(category, c_index) in categories"
            :key="c_index"
          >
            <div class="faq-accordion-header" @click="toggleCategory(c_index)">
              <span>{{ category.title }}</span>
              <img
                src="/static/accounts/images/faq/chevron_down.svg"
                alt="toggle"
                class="faq-chevron-icon"
                :class="{ rotated: category.open }"
              />
            </div>
            <div class="faq-accordion-content" v-show="category.open">
              <div
                class="faq-accordion-category nested"
                v-for="(subCategory, s_index) in category.subCategories"
                :key="s_index"
              >
                <div
                  class="faq-accordion-header"
                  @click="toggleSubCategory(c_index, s_index)"
                >
                  <span>{{ subCategory.title }}</span>
                  <img
                    src="/static/accounts/images/faq/chevron_down.svg"
                    alt="toggle"
                    class="faq-chevron-icon"
                    :class="{ rotated: subCategory.open }"
                  />
                </div>
                <div class="faq-accordion-content" v-show="subCategory.open">
                  <div
                    class="faq-question-item"
                    v-for="question in subCategory.questions"
                    :key="question.id"
                    :data-question-id="question.id"
                    :class="{ active: activeQuestionId === question.id }"
                    @click="selectQuestion(question.id)"
                  >
                    {{ faqData[question.id]?.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-right-panel">
          <h2 class="faq-answer-title" id="faqAnswerTitle">
            {{ currentQuestion.title }}
          </h2>
          <div
            class="faq-answer-body"
            id="faqAnswerBody"
            v-html="currentQuestion.answer"
          ></div>
        </div>
        <div class="faq-custom-scrollbar-visual"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const activeQuestionId = ref('what-is-great-ideas')

const faqData = reactive({
  'what-is-great-ideas': {
    title: 'Что такое «Great Ideas»?',
    answer:
      '<p>«Great Ideas» — это маркетплейс стартапов, где стартаперы размещают свои проекты, а инвесторы исследуют их в поисках лучших идей для инвестиций или покупки.</p>',
  },
  'how-to-register': {
    title: 'Как зарегистрироваться на платформе «Great Ideas»?',
    answer:
      '<p>Зарегистрируйтесь через форму на главной странице. Подтвердите почту и заполните профиль.</p>',
  },
  'how-to-setup-profile': {
    title: 'Как правильно оформить профиль стартапа?',
    answer:
      "<p>Добавьте логотип, описание проекта, команду, презентацию и ключевые данные. <a href='#' class='faq-answer-details-link'>Узнайте больше о том, как правильно регистрировать проект <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>",
  },
  'can-edit-info': {
    title: 'Можно ли редактировать информацию после публикации?',
    answer:
      '<p>Да, вы можете редактировать информацию, но изменения будут проходить модерацию.</p>',
  },
  'franchise-types': {
    title: 'Какие виды франшиз можно размещать?',
    answer:
      "<p>Франшизы в сферах общественного питания, розничной торговли, услуг для бизнеса, образования, здоровья/красоты, IT и других. <a href='#' class='faq-answer-details-link'>Список доступных сфер <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>",
  },
  'franchise-limits': {
    title: 'Есть ли ограничения на размещение франшиз?',
    answer:
      '<p>Нельзя размещать франшизы в сферах азартных игр, MLM, финансовых пирамид, взрослого контента и запрещенных законом видов деятельности.</p>',
  },
  'franchise-requirements': {
    title: 'Какие требования для размещения франшизы?',
    answer:
      '<p>Зарегистрированный бизнес, подтвержденная бизнес-модель, финансовая отчетность, наличие сайта и маркетинговых материалов.</p>',
  },
  'franchise-verification': {
    title: 'Проверяет ли платформа франшизы перед публикацией?',
    answer:
      '<p>Да, все франшизы проходят модерацию на соответствие требованиям платформы. Однако Great Ideas не несет ответственности за финансовое состояние или успех франшизы. Инвесторам рекомендуется самостоятельно изучать и проверять проекты перед инвестированием.</p>',
  },
  'franchise-data-privacy': {
    title: 'Как защищена конфиденциальность данных франшизы?',
    answer:
      '<p>Названия компаний и чувствительные данные скрыты до подписания NDA с заинтересованным инвестором.</p>',
  },
  'how-to-get-noticed': {
    title: 'Как сделать мой стартап заметным для инвесторов?',
    answer:
      '<p>Заполните профиль максимально детально, добавьте видео-презентацию и кейсы.</p>',
  },
  'minimum-goal': {
    title: 'Что такое минимальная цель и что будет, если я её не достигну?',
    answer:
      '<p>Минимальная цель – это сумма, необходимая для запуска проекта. Если она не достигнута, инвестиции возвращаются инвесторам. (требует обсуждение с клиентом).</p>',
  },
  'attract-more-investors': {
    title: 'Как я могу привлечь больше инвесторов?',
    answer:
      '<p>Регулярно обновляйте информацию, публикуйте новости о развитии проекта, участвуйте в обсуждениях.</p>',
  },
  'how-to-sell-startup': {
    title: 'Как выставить стартап на продажу?',
    answer:
      '<p>В разделе «Создать стартап/франшизу» выберите тип «Продажа бизнеса».</p>',
  },
  'sell-part-of-company': {
    title: 'Можно ли продать только часть компании?',
    answer: '<p>Да, вы можете предложить долевую продажу.</p>',
  },
  'startup-categories-allowed': {
    title: 'Какие категории стартапов можно размещать?',
    answer:
      '<p>Технологические, электронная коммерция, инновационные продукты, гейминг, образование, креативные индустрии, наука, экология.</p>',
  },
  'startup-categories-forbidden': {
    title: 'Какие категории стартапов нельзя размещать?',
    answer:
      '<p>Контент для взрослых, финансовые пирамиды, азартные игры, нелегальная фармацевтика, политика, криптовалюты.</p>',
  },
  'required-documents': {
    title: 'Какие документы нужно предоставить?',
    answer:
      '<p>Бизнес-план, презентация, финансовая модель и юридические документы, подтверждающие право собственности.</p>',
  },
  'platform-commission': {
    title: 'Какая комиссия взимается с успешного проекта?',
    answer:
      "<p>Стандартная комиссия составляет 5% от суммы привлеченных инвестиций. <a href='#' class='faq-answer-details-link'>Узнайте больше о тарифах <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>",
  },
  'data-confidentiality-legal': {
    title: 'Как защищена конфиденциальность данных?',
    answer:
      '<p>Все данные защищены согласно политике конфиденциальности и не передаются третьим лицам без вашего согласия.</p>',
  },
  'specialists-on-platform': {
    title: 'Каких специалистов можно найти на платформе?',
    answer:
      '<p>Вы можете найти разработчиков, маркетологов, дизайнеров, юристов, финансовых консультантов и других специалистов.</p>',
  },
  'specialist-quality-check': {
    title: 'Как проверяется качество специалистов?',
    answer:
      '<p>Специалисты проходят верификацию, предоставляют портфолио и отзывы от предыдущих клиентов.</p>',
  },
  'protecting-ip': {
    title: 'Как защитить интеллектуальную собственность?',
    answer:
      '<p>Рекомендуем заключать NDA (соглашение о неразглашении) с инвесторами и специалистами перед раскрытием конфиденциальной информации.</p>',
  },
  'who-can-be-investor': {
    title: 'Кто может стать инвестором на платформе?',
    answer:
      '<p>Инвестором может стать любое физическое или юридическое лицо, прошедшее регистрацию и верификацию.</p>',
  },
  'accredited-investor-status': {
    title: 'Как подтвердить статус аккредитованного инвестора?',
    answer:
      '<p>Необходимо предоставить документы, подтверждающие ваш доход, активы или профессиональный опыт в соответствии с законодательством вашей страны.</p>',
  },
  'find-suitable-startups': {
    title: 'Как найти подходящие стартапы?',
    answer:
      "<p>Используйте фильтры по категориям, стадиям развития, сумме инвестиций и другим параметрам. <a href='#' class='faq-answer-details-link'>Перейти к поиску <img src='/static/accounts/images/faq/bluearrow.svg' alt='Перейти'></a></p>",
  },
  'request-additional-data': {
    title: 'Можно ли запросить дополнительные данные у стартапа?',
    answer:
      '<p>Да, вы можете отправить запрос на получение дополнительной информации через платформу после подписания NDA.</p>',
  },
  'investment-risks': {
    title: 'Какие риски связаны с инвестициями?',
    answer:
      '<p>Инвестиции в стартапы связаны с высоким риском, включая потерю всех вложенных средств. Рекомендуем тщательно анализировать проекты перед принятием решения.</p>',
  },
  'how-to-invest': {
    title: 'Как я могу инвестировать в стартап или франшизу?',
    answer:
      '<p>Выберите проект, изучите его и нажмите кнопку «Инвестировать». Следуйте инструкциям для перевода средств.</p>',
  },
  'investment-confirmation': {
    title: 'Как я получу подтверждение своей инвестиции?',
    answer:
      '<p>После успешного перевода средств вы получите электронное подтверждение и юридические документы, закрепляющие вашу долю.</p>',
  },
  'can-sell-investment': {
    title: 'Могу ли я продать свою инвестицию?',
    answer:
      '<p>Возможность продажи доли зависит от условий соглашения с конкретным стартапом. Некоторые проекты могут предлагать вторичный рынок для своих акций.</p>',
  },
  'commission-for-investing': {
    title: 'Есть ли комиссия за инвестирование?',
    answer:
      '<p>Для инвесторов комиссия отсутствует. Все расходы покрываются за счет комиссии с проекта, привлекшего инвестиции.</p>',
  },
  'cancel-investment': {
    title: 'Могу ли я отменить свою инвестицию?',
    answer:
      '<p>Отмена инвестиции возможна до момента закрытия раунда финансирования. После этого средства передаются стартапу.</p>',
  },
  'investment-confirmation-docs': {
    title: 'Какие документы подтверждают мою инвестицию?',
    answer:
      '<p>Вы получите договор конвертируемого займа или договор купли-продажи доли, а также выписку из реестра акционеров.</p>',
  },
  'contact-startup-founders': {
    title: 'Как я могу связаться с основателями стартапа?',
    answer:
      '<p>После выражения заинтересованности и подписания NDA вы получите доступ к контактным данным основателей.</p>',
  },
})

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
        ],
      },
      {
        title: 'Привлечение инвестиций',
        open: false,
        questions: [
          { id: 'how-to-get-noticed' },
          { id: 'minimum-goal' },
          { id: 'attract-more-investors' },
        ],
      },
      {
        title: 'Продажа стартапа или франшизы',
        open: false,
        questions: [
          { id: 'how-to-sell-startup' },
          { id: 'sell-part-of-company' },
        ],
      },
      {
        title: 'Категории стартапов',
        open: false,
        questions: [
          { id: 'startup-categories-allowed' },
          { id: 'startup-categories-forbidden' },
        ],
      },
      {
        title: 'Правовые и финансовые вопросы',
        open: false,
        questions: [
          { id: 'required-documents' },
          { id: 'platform-commission' },
          { id: 'data-confidentiality-legal' },
        ],
      },
      {
        title: 'Услуги специалистов и подрядчиков',
        open: false,
        questions: [
          { id: 'specialists-on-platform' },
          { id: 'specialist-quality-check' },
          { id: 'protecting-ip' },
        ],
      },
    ],
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
        ],
      },
      {
        title: 'Поиск и анализ стартапов, франшиз и подрядчиков',
        open: false,
        questions: [
          { id: 'find-suitable-startups' },
          { id: 'request-additional-data' },
          { id: 'investment-risks' },
        ],
      },
      {
        title: 'Инвестирование и сделки',
        open: false,
        questions: [
          { id: 'how-to-invest' },
          { id: 'investment-confirmation' },
          { id: 'can-sell-investment' },
        ],
      },
      {
        title: 'Комиссии и расходы',
        open: false,
        questions: [
          { id: 'commission-for-investing' },
          { id: 'cancel-investment' },
        ],
      },
      {
        title: 'Правовые аспекты и поддержка',
        open: false,
        questions: [
          { id: 'investment-confirmation-docs' },
          { id: 'contact-startup-founders' },
        ],
      },
    ],
  },
])

const currentQuestion = computed(() => {
  return faqData[activeQuestionId.value] || { title: '', answer: '' }
})

function selectQuestion(id) {
  activeQuestionId.value = id
}

function toggleCategory(index) {
  categories[index].open = !categories[index].open
}

function toggleSubCategory(catIndex, subCatIndex) {
  categories[catIndex].subCategories[subCatIndex].open =
    !categories[catIndex].subCategories[subCatIndex].open
}
</script>

<style scoped>
@font-face {
  font-family: 'Unbounded';
  src: url('/static/accounts/fonts/Unbounded-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Blippo-Black CY [Rus by me]';
  src: url('/static/accounts/fonts/blippo_blackcyrusbyme.otf')
    format('opentype');
  font-weight: 400;
  font-style: normal;
}

.faq-page-wrapper {
  width: 100%;
  padding-top: 20px;
  background: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.faq-main-container {
  width: 100%;
  max-width: 1303px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 55px;
  box-sizing: border-box;
  background: none !important;
  padding-bottom: 65px;
}

.faq-header-block {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none !important;
}

.faq-title-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-main-title-text {
  color: #ffef2b;
  font-family: 'Blippo-Black CY [Rus by me]', sans-serif;
  font-size: 55px;
  font-weight: 400;
  line-height: 1;
  margin: 0;
}

.faq-subtitle-text {
  color: white;
  font-family: 'Unbounded', sans-serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0;
  width: 273px;
}

.faq-ask-question-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 28px;
  padding: 24px 32px;
  width: auto;
  max-width: 364px;
}

.faq-ask-question-prompt {
  color: white;
  font-family: 'Unbounded', sans-serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
  margin: 0;
}

.faq-ask-question-button {
  padding: 12px 25px;
  border-radius: 10px;
  outline: 1px white solid;
  outline-offset: -1px;
  color: white;
  font-family: 'Unbounded', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 16px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.faq-ask-question-button:hover {
  background-color: white;
  color: #004e9f;
}

.faq-content-block {
  width: 100%;
  height: 797px;
  position: relative;
  background: #004e9f;
  box-shadow: 6px 6px 15px rgba(0, 0, 0, 0.25);
  border-radius: 20px;
  display: flex;
  overflow: hidden;
}

.faq-left-panel {
  width: 535px;
  height: calc(100% - 64px);
  padding: 32px 34px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  box-sizing: border-box;
  position: relative;
}

.faq-left-panel::-webkit-scrollbar {
  width: 5px;
}

.faq-left-panel::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.faq-left-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.34);
  border-radius: 4px;
}

.faq-left-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.faq-question-category,
.faq-accordion-header,
.faq-question-item {
  padding: 10px 24px;
  border-radius: 99px;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s,
    outline 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}


.faq-question-category {
  background: white;
  color: black;
  outline: 2px solid black;
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
}

.faq-question-category.active {
  background: #ffef2b !important;
  color: black !important;
  outline: none !important;
}


.faq-accordion-header {
  background: white;
  color: black;
  outline: 2px solid black;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.19;
}


.faq-accordion-category.nested > .faq-accordion-header {
  outline: 1px solid white;
  background: transparent;
  color: white;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.19;
}

.faq-chevron-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease-in-out;
}

.faq-accordion-category.open .faq-chevron-icon {
  transform: rotate(180deg);
}

.faq-accordion-content {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}


.faq-question-item {
  outline: 1px solid white;
  background: transparent;
  color: white;
  font-size: 12px;
  font-weight: 300;
  line-height: 1;
  justify-content: flex-start;
}

.faq-question-item.active {
  background-color: #ffef2b !important;
  color: black !important;
  outline: none !important;
}


.faq-question-category:hover,
.faq-accordion-header:hover {
  background-color: #f0f0f0;
}

.faq-question-item:hover,
.faq-accordion-category.nested > .faq-accordion-header:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.faq-right-panel {
  width: calc(100% - 535px);
  height: 100%;
  padding: 32px;
  background: white;
  border-radius: 0 20px 20px 0;
  box-shadow: -4px 0px 6px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  overflow-y: auto;
  color: black;
}

.faq-answer-title {
  color: #2353d9;
  font-family: 'Unbounded', sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  margin: 0 0 24px 0;
}

.faq-answer-body {
  font-family: 'Unbounded', sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 1.5;
  color: #333;
}
.faq-answer-body p {
  margin: 0 0 1em 0;
}

:deep(.faq-answer-details-link) {
  color: #2353d9;
  text-decoration: underline;
  font-weight: 400;
}

:deep(.faq-answer-details-link img) {
  display: none;
}

.faq-right-panel::-webkit-scrollbar {
  width: 5px;
}

.faq-right-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.faq-right-panel::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.faq-right-panel::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
