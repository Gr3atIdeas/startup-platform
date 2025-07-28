document.addEventListener('DOMContentLoaded', function () {
  const accordionCategories = document.querySelectorAll(
    '.faq-accordion-category'
  )
  const questionItems = document.querySelectorAll(
    '.faq-question-item, .faq-question-category'
  )
  const faqAnswerTitle = document.getElementById('faqAnswerTitle')
  const faqAnswerBody = document.getElementById('faqAnswerBody')
  let faqData = {}
  try {
    const faqDataElement = document.getElementById('faqData')
    if (faqDataElement) {
      faqData = JSON.parse(faqDataElement.textContent)
    } else {
      console.error('FAQ data element not found')
    }
  } catch (error) {
    console.error('Error parsing FAQ data:', error)
  }
  accordionCategories.forEach((category) => {
    const header = category.querySelector('.faq-accordion-header')
    const content = category.querySelector('.faq-accordion-content')
    const icon = header ? header.querySelector('.faq-chevron-icon') : null
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = category.classList.contains('open')
        if (
          !category.classList.contains('nested') &&
          !category.parentElement.classList.contains('faq-accordion-content')
        ) {
          accordionCategories.forEach((otherCategory) => {
            if (
              otherCategory !== category &&
              !otherCategory.classList.contains('nested') &&
              !otherCategory.parentElement.classList.contains(
                'faq-accordion-content'
              )
            ) {
              otherCategory.classList.remove('open')
              const otherContent = otherCategory.querySelector(
                '.faq-accordion-content'
              )
              if (otherContent) otherContent.style.display = 'none'
              const otherIcon = otherCategory.querySelector('.faq-chevron-icon')
              if (otherIcon) otherIcon.style.transform = 'rotate(0deg)'
            }
          })
        } else if (category.classList.contains('nested')) {
          const parentContent = category.closest('.faq-accordion-content')
          if (parentContent) {
            const siblingNestedAccordions = parentContent.querySelectorAll(
              '.faq-accordion-category.nested'
            )
            siblingNestedAccordions.forEach((sibling) => {
              if (sibling !== category) {
                sibling.classList.remove('open')
                const siblingContent = sibling.querySelector(
                  '.faq-accordion-content'
                )
                if (siblingContent) siblingContent.style.display = 'none'
                const siblingIcon = sibling.querySelector('.faq-chevron-icon')
                if (siblingIcon) siblingIcon.style.transform = 'rotate(0deg)'
              }
            })
          }
        }
        if (isOpen) {
          category.classList.remove('open')
          if (content) content.style.display = 'none'
          if (icon) icon.style.transform = 'rotate(0deg)'
        } else {
          category.classList.add('open')
          if (content) content.style.display = 'flex'
          if (icon) icon.style.transform = 'rotate(180deg)'
        }
      })
    }
  })
  questionItems.forEach((item) => {
    item.addEventListener('click', function () {
      const questionId = this.dataset.questionId
      questionItems.forEach((qItem) => qItem.classList.remove('active'))
      this.classList.add('active')
      if (faqData[questionId] && faqAnswerTitle && faqAnswerBody) {
        faqAnswerTitle.textContent = faqData[questionId].title
        faqAnswerBody.innerHTML = faqData[questionId].answer
      } else {
        if (!faqData[questionId])
          console.warn(`No data found for question ID: ${questionId}`)
        if (!faqAnswerTitle) console.warn('faqAnswerTitle element not found')
        if (!faqAnswerBody) console.warn('faqAnswerBody element not found')
      }
    })
  })
  const initiallyActiveItem = document.querySelector(
    '.faq-question-item.active, .faq-question-category.active'
  )
  if (initiallyActiveItem) {
    initiallyActiveItem.click()
    let parent = initiallyActiveItem.closest('.faq-accordion-category')
    while (parent) {
      if (!parent.classList.contains('open')) {
        const header = parent.querySelector('.faq-accordion-header')
        if (header)
          header.click()
        else {
          parent.classList.add('open')
          const content = parent.querySelector('.faq-accordion-content')
          if (content) content.style.display = 'flex'
        }
      }
      parent = parent.parentElement.closest('.faq-accordion-category')
    }
  }
})
