function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

document.addEventListener('DOMContentLoaded', function () {
  const pageDataElement = document.querySelector('.startup-detail-page')
  if (!pageDataElement) {
    console.error('Не удалось найти основной элемент .startup-detail-page')
    return
  }

  const startupId = pageDataElement.dataset.startupId
  const startupTitle = pageDataElement.dataset.startupTitle
  const isUserAuthenticated =
    pageDataElement.dataset.userAuthenticated === 'true'
  const hasUserVoted = pageDataElement.dataset.userHasVoted === 'true'
  const csrfTokenInput = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  )
  const csrfToken = csrfTokenInput
    ? csrfTokenInput.value
    : getCookie('csrftoken')

  if (!startupId) {
    console.error('Startup ID не найден в data-атрибутах.')
  }

  // Функция для обновления отображения рейтинга (метод наложения)
  function updateRatingDisplay(containerSelector, rating) {
    console.log(
      `[updateRatingDisplay] Called for selector: "${containerSelector}", rating: ${rating}`
    )
    const starsContainer = document.querySelector(containerSelector)
    if (!starsContainer) {
      console.error(
        `[updateRatingDisplay] Container not found for selector: "${containerSelector}"`
      )
      return
    }

    const iconContainers = starsContainer.querySelectorAll(
      '.rating-icon-container'
    )
    console.log(
      `[updateRatingDisplay] Found ${iconContainers.length} icon containers within "${containerSelector}"`
    )
    const ratingValue = parseFloat(rating) || 0
    const fullStars = Math.floor(ratingValue)
    const partialPercentage = (ratingValue - fullStars) * 100

    iconContainers.forEach((container, index) => {
      const filledIcon = container.querySelector('.icon-filled')
      if (!filledIcon) {
        console.warn(
          `[updateRatingDisplay] Filled icon not found in container ${index + 1} for selector "${containerSelector}"`
        )
        return
      }

      let fillWidth = '0%'
      if (index < fullStars) {
        fillWidth = '100%'
      } else if (index === fullStars && partialPercentage > 0) {
        fillWidth = `${partialPercentage}%`
      }
      console.log(
        `[updateRatingDisplay] Setting width ${fillWidth} for icon ${index + 1} in "${containerSelector}"`
      )
      filledIcon.style.width = fillWidth
    })
  }

  // Функция для анимации прогресс-бара
  function updateAnimatedProgressBars(containerElement) {
    if (!containerElement) return
    const visualContainers = containerElement.querySelectorAll(
      '.progress-bar-visual'
    )

    visualContainers.forEach((container) => {
      const animationContainer = container.querySelector(
        '.progress-animation-container'
      )
      const percentageSpan = container.querySelector('.progress-percentage')

      if (animationContainer && percentageSpan) {
        const textContent = percentageSpan.textContent || '0%'
        const progressPercentValue = parseInt(textContent, 10) || 0

        setTimeout(() => {
          animationContainer.style.width = progressPercentValue + '%'
        }, 100)
      } else {
        if (!animationContainer)
          console.error(
            'Animation container (.progress-animation-container) not found in:',
            container
          )
        if (!percentageSpan)
          console.error(
            'Progress text span (.progress-percentage) not found in:',
            container
          )
      }
    })
  }

  // Вызываем функцию анимации прогресс-бара
  const startupDetailPage = document.querySelector('.startup-detail-page')
  updateAnimatedProgressBars(startupDetailPage)

  // Отображение начального рейтинга
  const ratingDisplayContainer = '.rating-stars[data-rating]'
  const ratingCommentsSelector = '.comment-rating'

  const mainRatingElement = document.querySelector(ratingDisplayContainer)
  if (mainRatingElement) {
    const initialRatingRaw = mainRatingElement.getAttribute('data-rating')
    console.log(`[Main Rating] Raw data-rating: "${initialRatingRaw}"`)
    const ratingStringForJs = initialRatingRaw
      ? initialRatingRaw.replace(',', '.')
      : '0'
    const initialRating = parseFloat(ratingStringForJs)
    console.log(`[Main Rating] Parsed rating value: ${initialRating}`)
    updateRatingDisplay(ratingDisplayContainer, initialRating)
  } else {
    console.error(
      '[Main Rating] Rating container not found with selector:',
      ratingDisplayContainer
    )
  }

  const commentCards = document.querySelectorAll('.comment-card')
  commentCards.forEach((card, cardIndex) => {
    const commentRatingContainer = card.querySelector(ratingCommentsSelector)
    if (
      commentRatingContainer &&
      commentRatingContainer.dataset.rating !== undefined
    ) {
      const commentRatingValue =
        parseFloat(commentRatingContainer.dataset.rating.replace(',', '.')) || 0
      const uniqueCommentSelector = `.comment-card:nth-child(${cardIndex + 1}) ${ratingCommentsSelector}`
      updateRatingDisplay(uniqueCommentSelector, commentRatingValue)
    }
  })

  const similarRatingContainers = document.querySelectorAll(
    '.similar-card .similar-card-rating[data-rating]'
  )
  console.log(
    `Found ${similarRatingContainers.length} similar startup rating containers.`
  )
  similarRatingContainers.forEach((container) => {
    const ratingStringRaw = container.dataset.rating
    console.log(
      `[Similar Rating] Raw data-rating: "${ratingStringRaw}" for container:`,
      container
    )
    const ratingStringForJs = ratingStringRaw
      ? ratingStringRaw.replace(',', '.')
      : '0'
    const similarRatingValue = parseFloat(ratingStringForJs) || 0
    console.log(
      `[Similar Rating] Processing similar startup card. Parsed rating: ${similarRatingValue}`
    )

    const parentLink = container.closest('.similar-card')
    let uniqueSimilarSelector = null
    if (parentLink && parentLink.getAttribute('href')) {
      uniqueSimilarSelector = `.similar-card[href="${parentLink.getAttribute('href')}"] .similar-card-rating`
    } else {
      console.warn(
        'Could not find unique href for similar card, using less specific selector'
      )
      uniqueSimilarSelector = `.similar-card-rating[data-rating="${ratingStringRaw}"]`
    }
    console.log(`Using selector: ${uniqueSimilarSelector}`)
    if (uniqueSimilarSelector) {
      updateRatingDisplay(uniqueSimilarSelector, similarRatingValue)
    }
  })

  const overallRatingStarsElement = document.querySelector(
    '.overall-rating-stars'
  )
  if (overallRatingStarsElement) {
    const overallRatingRaw =
      overallRatingStarsElement.getAttribute('data-rating')
    const overallRatingStringForJs = overallRatingRaw
      ? overallRatingRaw.replace(',', '.')
      : '0'
    const overallRating = parseFloat(overallRatingStringForJs)
    updateRatingDisplay('.overall-rating-stars', overallRating)
  }

  // Логика "Показать еще" / "Скрыть" для комментариев
  const showMoreCommentsBtn = document.querySelector('.show-more-comments')
  const hideCommentsBtn = document.querySelector('.hide-comments-button')
  const commentsToShow = 5

  if (
    showMoreCommentsBtn &&
    hideCommentsBtn &&
    commentCards.length > commentsToShow
  ) {
    showMoreCommentsBtn.addEventListener('click', function () {
      commentCards.forEach((comment, index) => {
        if (index >= commentsToShow) {
          comment.classList.remove('hidden')
        }
      })
      this.style.display = 'none'
      hideCommentsBtn.style.display = 'inline-flex'
    })

    hideCommentsBtn.addEventListener('click', function () {
      commentCards.forEach((comment, index) => {
        if (index >= commentsToShow) {
          comment.classList.add('hidden')
        }
      })
      this.style.display = 'none'
      showMoreCommentsBtn.style.display = 'inline-flex'
    })
  } else if (showMoreCommentsBtn) {
    showMoreCommentsBtn.style.display = 'none'
  }

  // Логика голосования и эффект наведения
  const interactiveStarsContainer = document.querySelector(
    '.rating-stars[data-interactive="true"]'
  )
  if (isUserAuthenticated && !hasUserVoted && interactiveStarsContainer) {
    const iconContainers = interactiveStarsContainer.querySelectorAll(
      '.rating-icon-container[data-value]'
    )
    iconContainers.forEach((iconContainer) => {
      iconContainer.style.cursor = 'pointer'

      // Обработчик клика для голосования
      iconContainer.addEventListener('click', function () {
        const rating = this.getAttribute('data-value')

        if (!csrfToken) {
          console.error('CSRF токен не найден для голосования.')
          alert(
            'Ошибка: Не удалось выполнить действие. Попробуйте перезагрузить страницу.'
          )
          return
        }
        if (!startupId) {
          console.error('Startup ID не найден для голосования.')
          alert('Ошибка: Не удалось определить стартап.')
          return
        }

        fetch(`/vote-startup/${startupId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: `rating=${rating}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              const starsContainerElement = this.closest('.rating-stars')
              if (starsContainerElement) {
                starsContainerElement.removeAttribute('data-interactive')
                starsContainerElement.setAttribute(
                  'data-rating',
                  data.average_rating
                )
                updateRatingDisplay(
                  '.rating-stars[data-rating]',
                  data.average_rating
                )

                starsContainerElement
                  .querySelectorAll('.rating-icon-container')
                  .forEach((container) => {
                    container.removeAttribute('data-value')
                    container.style.cursor = 'default'
                  })

                const ratingValueElement =
                  document.querySelector('.rating-label')
                if (ratingValueElement) {
                  ratingValueElement.textContent = `Рейтинг ${data.average_rating.toFixed(1)}/5`
                }

                const commentAvgRating = document.querySelector(
                  '.average-rating-value'
                )
                if (commentAvgRating) {
                  commentAvgRating.textContent = data.average_rating.toFixed(1)
                }

                const overallRatingStars = document.querySelector(
                  '.overall-rating-stars'
                )
                if (overallRatingStars) {
                  overallRatingStars.setAttribute(
                    'data-rating',
                    data.average_rating
                  )
                  updateRatingDisplay(
                    '.overall-rating-stars',
                    data.average_rating
                  )
                }
              }
            } else {
              alert(data.error || 'Ошибка при голосовании')
            }
          })
          .catch((error) => {
            console.error('Ошибка fetch при голосовании:', error)
            alert('Произошла ошибка сети при голосовании')
          })
      })

      // Обработчик наведения для подсветки
      iconContainer.addEventListener('mouseover', function () {
        const value = parseInt(this.getAttribute('data-value'))
        iconContainers.forEach((otherIcon, otherIndex) => {
          const iconFilled = otherIcon.querySelector('.icon-filled')
          if (otherIndex < value) {
            iconFilled.style.width = '100%'
          } else {
            iconFilled.style.width = '0%'
          }
        })
      })

      // Обработчик ухода мыши (возвращаем текущий рейтинг)
      iconContainer.addEventListener('mouseout', function () {
        const currentRating =
          parseFloat(interactiveStarsContainer.getAttribute('data-rating')) || 0
        iconContainers.forEach((otherIcon, otherIndex) => {
          const iconFilled = otherIcon.querySelector('.icon-filled')
          const value = otherIndex + 1
          if (value <= Math.floor(currentRating)) {
            iconFilled.style.width = '100%'
          } else if (value - 1 < currentRating && currentRating < value) {
            const percentage = (currentRating - Math.floor(currentRating)) * 100
            iconFilled.style.width = `${percentage}%`
          } else {
            iconFilled.style.width = '0%'
          }
        })
      })
    })
  }

  // Инициализация GLightbox
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
          options: [0.5, 1, 1.25, 1.5],
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
            2160: '4K',
            1440: 'HD',
            1080: 'HD',
            720: 'HD',
            576: 'SD',
            480: 'SD',
          },
        },
      },
    })
    console.log('GLightbox initialized with Plyr v3.6.12 and speed options')
  } else {
    console.error(
      'GLightbox is not defined. Check if the library is loaded correctly.'
    )
  }

  // Логика переключения табов
  const tabContainer = document.querySelector('.tab-navigation')
  const contentSections = document.querySelectorAll('.content-section')
  const tabButtons = document.querySelectorAll('.tab-button')

  if (tabContainer && contentSections.length > 0 && tabButtons.length > 0) {
    tabContainer.addEventListener('click', function (event) {
      const clickedButton = event.target.closest('.tab-button')
      if (clickedButton) {
        const targetId = clickedButton.dataset.target
        if (!targetId) return

        tabButtons.forEach((button) => {
          button.classList.remove('active')
        })
        clickedButton.classList.add('active')

        contentSections.forEach((section) => {
          if (section.id === targetId) {
            section.classList.add('active')
          } else {
            section.classList.remove('active')
          }
        })
      }
    })
  }

  // Обработчик для "Показать еще" похожие стартапы
  const showMoreSimilarBtn = document.querySelector(
    '.action-button.show-more-similar'
  )
  const similarGrid = document.querySelector('.similar-startups-grid')

  if (showMoreSimilarBtn && similarGrid) {
    showMoreSimilarBtn.addEventListener('click', function () {
      this.textContent = 'Загрузка...'
      this.disabled = true

      const loadSimilarUrl = pageDataElement.dataset.loadSimilarUrl
      if (!loadSimilarUrl) {
        console.error(
          'URL для загрузки похожих стартапов не найден в data-атрибуте!'
        )
        this.innerHTML = '<i class="fas fa-redo"></i> Показать еще'
        this.disabled = false
        alert('Произошла ошибка конфигурации.')
        return
      }

      fetch(loadSimilarUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.text()
        })
        .then((html) => {
          const currentCards = similarGrid.querySelectorAll(
            '.similar-card:not(.show-more-placeholder)'
          )
          currentCards.forEach((card) => card.remove())

          const placeholder = similarGrid.querySelector(
            '.show-more-placeholder'
          )
          if (placeholder) {
            placeholder.insertAdjacentHTML('beforebegin', html)
          } else {
            similarGrid.innerHTML += html
          }

          const newCards = similarGrid.querySelectorAll(
            '.similar-card:not(.show-more-placeholder)'
          )
          newCards.forEach((card, cardIndex) => {
            const similarRatingContainer = card.querySelector(
              '.similar-card-rating'
            )
            if (
              similarRatingContainer &&
              similarRatingContainer.dataset.rating !== undefined
            ) {
              const ratingStringRaw = similarRatingContainer.dataset.rating
              const ratingStringForJs = ratingStringRaw
                ? ratingStringRaw.replace(',', '.')
                : '0'
              const similarRatingValue = parseFloat(ratingStringForJs) || 0
              updateRatingDisplay(
                `.similar-card[href="${card.getAttribute('href')}"] .similar-card-rating`,
                similarRatingValue
              )
            }
          })

          this.innerHTML = '<i class="fas fa-redo"></i> Показать еще'
          this.disabled = false
        })
        .catch((error) => {
          console.error('Ошибка при загрузке похожих стартапов:', error)
          this.innerHTML = '<i class="fas fa-redo"></i> Показать еще'
          this.disabled = false
          alert('Не удалось загрузить похожие стартапы.')
        })
    })
  }

  // Обработчик для ссылки "Комментарии"
  const commentsLink = document.querySelector(
    '.comments-link[href="#comments-section"]'
  )
  const commentsTabButton = document.querySelector(
    '.tab-button[data-target="comments-section"]'
  )
  const commentsSection = document.getElementById('comments-section')

  if (commentsLink && commentsTabButton && commentsSection) {
    commentsLink.addEventListener('click', function (event) {
      event.preventDefault()

      if (!commentsTabButton.classList.contains('active')) {
        commentsTabButton.click()
      }

      if (window.getComputedStyle(commentsSection).display !== 'none') {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        const tabContentContainer = document.querySelector(
          '.tab-content-container'
        )
        if (tabContentContainer) {
          const activeSection = tabContentContainer.querySelector(
            '.content-section.active'
          )
          if (activeSection) activeSection.classList.remove('active')
        }
        commentsSection.classList.add('active')
        setTimeout(() => {
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    })
  }

  // Функция debounce для ограничения частоты запросов
  function debounce(func, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }

  // Обработчик кнопки "Сменить владельца"
  const changeOwnerButtons = document.querySelectorAll('.change-owner-button')
  changeOwnerButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const modal = new bootstrap.Modal(
        document.getElementById('changeOwnerModal')
      )
      modal.show()

      const searchInput = document.getElementById('userSearchInput')
      const searchResults = document.getElementById('userSearchResults')

      // Поиск пользователей с debounce
      const debouncedSearch = debounce(function (query) {
        if (query.length < 2) {
          searchResults.innerHTML = ''
          return
        }

        fetch(`/search-suggestions/?q=${encodeURIComponent(query)}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
          .then((response) => response.json())
          .then((data) => {
            searchResults.innerHTML = ''
            if (data.suggestions.length === 0) {
              searchResults.innerHTML =
                '<li class="list-group-item">Пользователи не найдены</li>'
              return
            }
            data.suggestions.forEach((user) => {
              const li = document.createElement('li')
              li.classList.add('list-group-item')
              li.textContent = user
              li.dataset.userId = user.user_id
              li.addEventListener('click', function () {
                const confirmModal = new bootstrap.Modal(
                  document.getElementById('confirmChangeOwnerModal')
                )
                document.getElementById('newOwnerName').textContent = user
                document.getElementById('newOwnerId').value = user.user_id
                modal.hide()
                confirmModal.show()
              })
              searchResults.appendChild(li)
            })
          })
          .catch((error) => {
            console.error('Ошибка поиска:', error)
            searchResults.innerHTML =
              '<li class="list-group-item">Ошибка поиска</li>'
          })
      }, 300)

      searchInput.addEventListener('input', function () {
        debouncedSearch(this.value.trim())
      })
    })
  })

  // Подтверждение смены владельца
  const confirmChangeOwnerBtn = document.querySelector('.confirm-change-owner')
  if (confirmChangeOwnerBtn) {
    confirmChangeOwnerBtn.addEventListener('click', function () {
      const newOwnerId = document.getElementById('newOwnerId').value

      fetch(`/change_owner/${startupId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCookie('csrftoken'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: `new_owner_id=${newOwnerId}`,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert('Владелец успешно изменён!')
            location.reload()
          } else {
            alert(
              data.error ||
                'Произошла ошибка при смене владельца. Проверьте данные и попробуйте снова.'
            )
          }
        })
        .catch((error) => {
          console.error('Ошибка:', error)
          alert(
            'Произошла ошибка сети при смене владельца. Проверьте соединение и попробуйте снова.'
          )
        })
    })
  }

  // Обработчик кнопки "Добавить инвестора"
  const addInvestorButtons = document.querySelectorAll('.add-investor-button')
  addInvestorButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const modal = new bootstrap.Modal(
        document.getElementById('addInvestorModal')
      )
      modal.show()

      const investorSearchInput = document.getElementById('investorSearchInput')
      const investorSearchResults = document.getElementById(
        'investorSearchResults'
      )
      const investmentAmountInput = document.getElementById('investmentAmount')
      const addInvestmentButton = document.getElementById('addInvestmentButton')
      let selectedInvestorId = null

      // Загрузка списка текущих инвесторов
      fetch(`/get_investors/${startupId}/`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const investorsList = document.getElementById('currentInvestorsList')
          investorsList.innerHTML = ''
          if (data.investors.length === 0) {
            investorsList.innerHTML = '<p>Инвесторы отсутствуют.</p>'
            return
          }
          data.investors.forEach((investor) => {
            const div = document.createElement('div')
            div.classList.add('investor-item')
            div.innerHTML = `
                        <span>${investor.name} (ID: ${investor.user_id})</span>
                        <div>
                            <input type="number" value="${investor.amount}" data-user-id="${investor.user_id}">
                            <button class="action-button edit-investment-btn">Изменить</button>
                            <button class="action-button delete-investment-btn" style="background-color: var(--danger-red); margin-left: 5px;">Удалить</button>
                        </div>
                    `
            investorsList.appendChild(div)

            // Обработчик изменения суммы
            div
              .querySelector('.edit-investment-btn')
              .addEventListener('click', function () {
                const newAmount = div.querySelector('input').value
                const confirmModal = new bootstrap.Modal(
                  document.getElementById('confirmEditInvestmentModal')
                )
                document.getElementById('editInvestorName').textContent =
                  investor.name
                document.getElementById('editInvestmentAmount').textContent =
                  newAmount
                document.getElementById('editInvestorId').value =
                  investor.user_id
                confirmModal.show()
              })

            // Обработчик удаления инвестиции
            div
              .querySelector('.delete-investment-btn')
              .addEventListener('click', function () {
                const confirmModal = new bootstrap.Modal(
                  document.getElementById('confirmDeleteInvestmentModal')
                )
                document.getElementById('deleteInvestorName').textContent =
                  investor.name
                document.getElementById('deleteInvestmentAmount').textContent =
                  investor.amount
                document.getElementById('deleteInvestorId').value =
                  investor.user_id
                confirmModal.show()
              })
          })
        })
        .catch((error) => {
          console.error('Ошибка загрузки инвесторов:', error)
          const investorsList = document.getElementById('currentInvestorsList')
          investorsList.innerHTML = '<p>Ошибка загрузки инвесторов.</p>'
        })

      // Поиск пользователей с debounce
      const debouncedInvestorSearch = debounce(function (query) {
        if (query.length < 2) {
          investorSearchResults.innerHTML = ''
          return
        }

        fetch(`/search-suggestions/?q=${encodeURIComponent(query)}`, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
          .then((response) => response.json())
          .then((data) => {
            investorSearchResults.innerHTML = ''
            if (data.suggestions.length === 0) {
              investorSearchResults.innerHTML =
                '<li class="list-group-item">Пользователи не найдены</li>'
              return
            }
            data.suggestions.forEach((user) => {
              const li = document.createElement('li')
              li.classList.add('list-group-item')
              li.textContent = user
              li.dataset.userId = user.user_id
              li.addEventListener('click', function () {
                selectedInvestorId = user.user_id
                investorSearchInput.value = user
                investorSearchResults.innerHTML = ''
                addInvestmentButton.disabled =
                  !investmentAmountInput.value || !selectedInvestorId
              })
              investorSearchResults.appendChild(li)
            })
          })
          .catch((error) => {
            console.error('Ошибка поиска:', error)
            investorSearchResults.innerHTML =
              '<li class="list-group-item">Ошибка поиска</li>'
          })
      }, 300)

      investorSearchInput.addEventListener('input', function () {
        debouncedInvestorSearch(this.value.trim())
      })

      // Валидация суммы
      investmentAmountInput.addEventListener('input', function () {
        addInvestmentButton.disabled = !this.value || !selectedInvestorId
      })

      // Добавление инвестиции
      addInvestmentButton.addEventListener('click', function () {
        const amount = investmentAmountInput.value
        fetch(`/add_investor/${startupId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: `user_id=${selectedInvestorId}&amount=${amount}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              alert('Инвестор успешно добавлен!')
              location.reload()
            } else {
              alert(
                data.error ||
                  'Ошибка при добавлении инвестора. Проверьте данные и попробуйте снова.'
              )
            }
          })
          .catch((error) => {
            console.error('Ошибка:', error)
            alert(
              'Произошла ошибка сети при добавлении инвестора. Проверьте соединение и попробуйте снова.'
            )
          })
      })
    })
  })

  // Подтверждение редактирования инвестиции
  const confirmEditInvestmentBtn = document.querySelector(
    '.confirm-edit-investment'
  )
  if (confirmEditInvestmentBtn) {
    confirmEditInvestmentBtn.addEventListener('click', function () {
      const userId = document.getElementById('editInvestorId').value
      const newAmount = document.getElementById(
        'editInvestmentAmount'
      ).textContent

      fetch(`/edit_investment/${startupId}/${userId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCookie('csrftoken'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: `amount=${newAmount}`,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert('Сумма инвестиции успешно изменена!')
            location.reload()
          } else {
            alert(
              data.error ||
                'Ошибка при изменении суммы. Проверьте данные и попробуйте снова.'
            )
          }
        })
        .catch((error) => {
          console.error('Ошибка:', error)
          alert(
            'Произошла ошибка сети при изменении суммы. Проверьте соединение и попробуйте снова.'
          )
        })
    })
  }

  // Подтверждение удаления инвестиции
  const confirmDeleteInvestmentBtn = document.querySelector(
    '.confirm-delete-investment'
  )
  if (confirmDeleteInvestmentBtn) {
    confirmDeleteInvestmentBtn.addEventListener('click', function () {
      const userId = document.getElementById('deleteInvestorId').value

      fetch(`/delete_investment/${startupId}/${userId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCookie('csrftoken'),
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert('Инвестиция успешно удалена!')
            location.reload()
          } else {
            alert(
              data.error ||
                'Ошибка при удалении инвестиции. Проверьте данные и попробуйте снова.'
            )
          }
        })
        .catch((error) => {
          console.error('Ошибка:', error)
          alert(
            'Произошла ошибка сети при удалении инвестиции. Проверьте соединение и попробуйте снова.'
          )
        })
    })
  }
})
