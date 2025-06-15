// V2 FINAL - Strukturiert und korrigiert
document.addEventListener('DOMContentLoaded', () => {
  // --- НАСТРОЙКИ И ПЕРЕМЕННЫЕ ---
  const pageDataElement = document.getElementById('page-data')
  if (!pageDataElement) {
    console.error('Critical Error: #page-data element not found.')
    return
  }

  const csrfToken = pageDataElement.dataset.csrfToken
  const startupId = pageDataElement.dataset.startupId
  const isUserAuthenticated = pageDataElement.dataset.isUserAuthenticated === 'true'
  const hasUserVoted = pageDataElement.dataset.hasUserVoted === 'true'
  const loadSimilarUrl = pageDataElement.dataset.loadSimilarUrl
  const findOrCreateChatUrl = pageDataElement.dataset.findOrCreateChatUrl
  const chatRedirectUrl = pageDataElement.dataset.chatRedirectUrl
  const startupOwnerId = pageDataElement.dataset.startupOwnerId

  // --- ОБЪЯВЛЕНИЕ ФУНКЦИЙ ---

  /**
   * Обновляет финансовые показатели стартапа на странице.
   * @param {number} newInvestorsCount - Новое количество инвесторов.
   * @param {number} newCurrentAmount - Новая собранная сумма.
   */
  function updateStartupFinancials(newInvestorsCount, newCurrentAmount) {
    const investorsCountElement = document.getElementById('investors-count')
    const currentAmountElement = document.getElementById('current-amount')
    const progressBar = document.getElementById('startup-progress-bar')
    const goalAmount = progressBar ? parseFloat(progressBar.getAttribute('aria-valuemax')) : 0

    if (investorsCountElement) {
      investorsCountElement.textContent = newInvestorsCount
    }

    if (currentAmountElement) {
      currentAmountElement.textContent = `€${newCurrentAmount.toLocaleString('de-DE')}`
    }

    if (progressBar && goalAmount > 0) {
      const newPercentage = (newCurrentAmount / goalAmount) * 100
      progressBar.style.width = `${newPercentage}%`
      progressBar.setAttribute('aria-valuenow', newCurrentAmount)
      progressBar.textContent = `${Math.round(newPercentage)}%`
    }
  }
  
  /**
   * Обновляет все прогресс-бары с анимацией на странице.
   * @param {HTMLElement} parentElement - Родительский элемент для поиска прогресс-баров.
   */
  function updateAnimatedProgressBars(parentElement) {
    if (!parentElement) return;
    const progressBars = parentElement.querySelectorAll('.progress-bar-animated')
    progressBars.forEach((bar) => {
      const value = bar.getAttribute('aria-valuenow')
      const max = bar.getAttribute('aria-valuemax')
      if (value && max) {
        const percentage = (parseFloat(value) / parseFloat(max)) * 100
        bar.style.width = `${percentage}%`
      }
    })
  }
  
  /**
   * Обновляет отображение звезд рейтинга для заданного контейнера.
   * @param {string} containerSelector - CSS-селектор контейнера звезд.
   * @param {number} rating - Рейтинг для отображения.
   */
  function updateRatingDisplay(containerSelector, rating) {
    const container = document.querySelector(containerSelector)
    if (!container) {
      return
    }

    const icons = container.querySelectorAll('.icon-filled')
    const ratingValue = parseFloat(rating)

    icons.forEach((icon, index) => {
      const iconValue = index + 1
      if (iconValue <= ratingValue) {
        icon.style.width = '100%'
      } else if (iconValue - 1 < ratingValue && ratingValue < iconValue) {
        const percentage = (ratingValue - Math.floor(ratingValue)) * 100
        icon.style.width = `${percentage}%`
      } else {
        icon.style.width = '0%'
      }
    })
  }

  /**
   * Инициализирует отображение и интерактивность звезд рейтинга.
   */
  function setupRatingStars() {
    const ratingDisplayContainer = '.rating-stars[data-rating]'
    const mainRatingElement = document.querySelector(ratingDisplayContainer)
    if (mainRatingElement) {
        const rating = parseFloat(mainRatingElement.dataset.rating.replace(',', '.') || '0')
        updateRatingDisplay(ratingDisplayContainer, rating)
    }

    document.querySelectorAll('.comment-card').forEach((card, cardIndex) => {
      const commentRatingContainer = card.querySelector('.comment-rating')
      if (commentRatingContainer?.dataset.rating !== undefined) {
        const rating = parseFloat(commentRatingContainer.dataset.rating.replace(',', '.')) || 0
        updateRatingDisplay(`.comment-card:nth-of-type(${cardIndex + 1}) .comment-rating`, rating)
      }
    })

    document.querySelectorAll('.similar-card .similar-card-rating[data-rating]').forEach(container => {
      const rating = parseFloat(container.dataset.rating.replace(',', '.')) || 0
      const parentLink = container.closest('.similar-card')?.getAttribute('href')
      if (parentLink) {
        updateRatingDisplay(`.similar-card[href="${parentLink}"] .similar-card-rating`, rating)
      }
    })

    const overallRatingStars = document.querySelector('.overall-rating-stars')
    if (overallRatingStars) {
      const rating = parseFloat(overallRatingStars.dataset.rating.replace(',', '.')) || 0
      updateRatingDisplay('.overall-rating-stars', rating)
    }

    const interactiveStarsContainer = document.querySelector('.rating-stars[data-interactive="true"]')
    if (isUserAuthenticated && !hasUserVoted && interactiveStarsContainer) {
      const iconContainers = interactiveStarsContainer.querySelectorAll('.rating-icon-container[data-value]')
      
      iconContainers.forEach(iconContainer => {
        iconContainer.style.cursor = 'pointer'

        iconContainer.addEventListener('click', function () {
          const rating = this.getAttribute('data-value')
          fetch(`/vote-startup/${startupId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            body: `rating=${rating}`,
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) location.reload()
            else alert(data.error || 'Ошибка при голосовании')
          })
          .catch(() => alert('Произошла ошибка сети при голосовании'))
        })

        iconContainer.addEventListener('mouseover', function () {
          const value = parseInt(this.getAttribute('data-value'))
          iconContainers.forEach((otherIcon, otherIndex) => {
            otherIcon.querySelector('.icon-filled').style.width = otherIndex < value ? '100%' : '0%'
          })
        })

        iconContainer.addEventListener('mouseout', () => {
          const currentRatingString = interactiveStarsContainer.getAttribute('data-rating')?.replace(',', '.') || '0'
          const currentRating = parseFloat(currentRatingString)
          updateRatingDisplay('.rating-stars[data-interactive="true"]', currentRating)
        })
      })
    }
  }

  /**
   * Настраивает модальные окна и их содержимое.
   */
  function setupModals() {
    ['changeOwnerModal', 'addInvestorModal', 'reportModal'].forEach(modalId => {
      const modalElement = document.getElementById(modalId)
      if (!modalElement) return

      const searchInput = modalElement.querySelector('input[type="search"]')
      const resultsContainer = modalElement.querySelector('.search-results')
      const form = modalElement.querySelector('form')
      const hiddenInput = form ? form.querySelector('input[name="user_id"], input[name="investor_id"]') : null

      if (searchInput && resultsContainer) {
        searchInput.addEventListener('input', () => {
          const query = searchInput.value
          if (query.length < 2) {
            resultsContainer.innerHTML = ''
            return
          }
          fetch(`/search_suggestions/?q=${query}`)
            .then(res => res.json())
            .then(data => {
              resultsContainer.innerHTML = ''
              if (data.users && data.users.length > 0) {
                data.users.forEach(user => {
                  const item = document.createElement('a')
                  item.href = '#'
                  item.className = 'list-group-item list-group-item-action'
                  item.textContent = `${user.first_name} ${user.last_name} (${user.email})`
                  item.addEventListener('click', e => {
                    e.preventDefault()
                    searchInput.value = item.textContent
                    if (hiddenInput) hiddenInput.value = user.id
                    resultsContainer.innerHTML = ''
                  })
                  resultsContainer.appendChild(item)
                })
              } else {
                resultsContainer.innerHTML = '<li class="list-group-item">Пользователи не найдены.</li>'
              }
            })
        })
      }
    })
  }

  /**
   * Настраивает логику для комментариев (показать/скрыть).
   */
  function setupComments() {
    const showMoreBtn = document.querySelector('.show-more-comments')
    const hideBtn = document.querySelector('.hide-comments-button')
    const comments = document.querySelectorAll('.comment-card')
    const initialCount = 5

    if (comments.length <= initialCount) {
      if(showMoreBtn) showMoreBtn.style.display = 'none'
      if(hideBtn) hideBtn.style.display = 'none'
      return
    }

    comments.forEach((comment, index) => {
      if(index >= initialCount) comment.classList.add('hidden')
    })
    if(hideBtn) hideBtn.style.display = 'none'
    if(showMoreBtn) showMoreBtn.style.display = 'inline-flex'

    showMoreBtn?.addEventListener('click', function() {
      comments.forEach(c => c.classList.remove('hidden'))
      this.style.display = 'none'
      if(hideBtn) hideBtn.style.display = 'inline-flex'
    })

    hideBtn?.addEventListener('click', function() {
      comments.forEach((c, i) => { if(i >= initialCount) c.classList.add('hidden') })
      this.style.display = 'none'
      if(showMoreBtn) showMoreBtn.style.display = 'inline-flex'
    })
  }

  /**
   * Настраивает логику для похожих стартапов (загрузка).
   */
  function setupSimilarStartups() {
    const showMoreBtn = document.querySelector('.action-button.show-more-similar')
    const grid = document.querySelector('.similar-startups-grid')

    showMoreBtn?.addEventListener('click', function() {
      this.textContent = 'Загрузка...'
      this.disabled = true

      fetch(loadSimilarUrl)
        .then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.text(); })
        .then(html => {
          grid.querySelectorAll('.similar-card:not(.show-more-placeholder)').forEach(c => c.remove())
          grid.querySelector('.show-more-placeholder')?.insertAdjacentHTML('beforebegin', html)
          // Re-initialize ratings for new cards
          document.querySelectorAll('.similar-card .similar-card-rating[data-rating]').forEach(container => {
            const rating = parseFloat(container.dataset.rating.replace(',', '.')) || 0
            const parentLink = container.closest('.similar-card')?.getAttribute('href')
            if (parentLink) {
              updateRatingDisplay(`.similar-card[href="${parentLink}"] .similar-card-rating`, rating)
            }
          })
          this.innerHTML = '<i class="fas fa-redo"></i> Показать еще'
          this.disabled = false
        })
        .catch(() => {
          alert('Не удалось загрузить похожие стартапы.')
          this.innerHTML = '<i class="fas fa-redo"></i> Показать еще'
          this.disabled = false
        })
    })
  }

  /**
   * Настраивает логику для кнопки "Чат".
   */
  function setupChatButtons() {
    document.getElementById('start-chat-button')?.addEventListener('click', function(e) {
      e.preventDefault()
      fetch(findOrCreateChatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ 'user2_id': startupOwnerId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.chat_id) {
          window.location.href = `${chatRedirectUrl}?chat_id=${data.chat_id}`
        } else {
          alert(data.error || 'Не удалось создать или найти чат.')
        }
      })
      .catch(() => alert('Произошла ошибка при создании чата.'))
    })
  }

  /**
   * Обрезает длинный текст в описании.
   */
  function setupTruncateText() {
    const descriptionBlock = document.querySelector('.startup-description-full')
    if (!descriptionBlock) return;

    const fullText = descriptionBlock.innerHTML
    const limit = 500
    
    if (fullText.length > limit) {
      const shortText = fullText.substring(0, limit)
      descriptionBlock.innerHTML = `
        <div class="truncated-text">
          ${shortText}...
          <a href="#" class="read-more-link" style="color: var(--accent-color); font-weight: 500;">Читать дальше</a>
        </div>
        <div class="full-text" style="display: none;">
          ${fullText}
          <a href="#" class="read-less-link" style="color: var(--accent-color); font-weight: 500;">Свернуть</a>
        </div>
      `

      descriptionBlock.querySelector('.read-more-link').addEventListener('click', e => {
        e.preventDefault()
        descriptionBlock.querySelector('.truncated-text').style.display = 'none'
        descriptionBlock.querySelector('.full-text').style.display = 'block'
      })

      descriptionBlock.querySelector('.read-less-link').addEventListener('click', e => {
        e.preventDefault()
        descriptionBlock.querySelector('.truncated-text').style.display = 'block'
        descriptionBlock.querySelector('.full-text').style.display = 'none'
      })
    }
  }

  /**
   * Настраивает обработчики для удаления инвестиций.
   */
  function setupInvestmentDeletion() {
    document.getElementById('investors-list')?.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('delete-investment-btn')) {
            e.preventDefault()
            const button = e.target
            const url = button.dataset.url
            if (confirm('Вы уверены, что хотите удалить эту инвестицию?')) {
                fetch(url, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        button.closest('.list-group-item').remove()
                        updateStartupFinancials(data.investors_count, data.current_amount)
                    } else {
                        alert(data.error || 'Не удалось удалить инвестицию.')
                    }
                })
                .catch(() => alert('Произошла сетевая ошибка.'))
            }
        }
    })
  }

  /**
   * Инициализация GLightbox для галереи.
   */
  function setupLightbox() {
    if (typeof GLightbox !== 'undefined') {
      GLightbox({ selector: '.glightbox' })
    }
  }

  // --- ВЫЗОВ ФУНКЦИЙ ---
  updateAnimatedProgressBars(document.body)
  setupRatingStars()
  setupModals()
  setupComments()
  setupSimilarStartups()
  setupChatButtons()
  setupTruncateText()
  setupInvestmentDeletion()
  setupLightbox()
})
