// This is a placeholder for JavaScript code for the main_temp page.
// We can add functionality here later if needed.

document.addEventListener('DOMContentLoaded', function () {
  // --- Features Carousel (Почему выбирают нас?) ---
  const featuresCarousel = document.querySelector('.features-carousel')
  const featuresWrapper = document.querySelector('.features-carousel-wrapper')
  const featuresArrowLeft = document.querySelector('.arrow-left-control')
  const featuresArrowRight = document.querySelector('.arrow-right-control')

  if (
    featuresCarousel &&
    featuresWrapper &&
    featuresArrowLeft &&
    featuresArrowRight
  ) {
    const featureCards = featuresCarousel.querySelectorAll('.feature-card')
    if (featureCards.length > 0) {
      const cardWidth = featureCards[0].offsetWidth
      const gap = parseInt(getComputedStyle(featuresCarousel).gap) || 20
      const visibleCards = 3
      let currentCardIndex = 0
      const scrollAmount = cardWidth + gap
      const totalCards = featureCards.length
      const maxCardIndex = Math.max(0, totalCards - visibleCards)

      function updateFeaturesControls() {
        featuresArrowLeft.classList.toggle('disabled', currentCardIndex === 0)
        featuresArrowRight.classList.toggle(
          'disabled',
          currentCardIndex >= maxCardIndex
        )
      }

      let carouselInnerContainer = featuresCarousel.querySelector(
        '.featured1-carousel-inner'
      )
      if (!carouselInnerContainer) {
        carouselInnerContainer = document.createElement('div')
        carouselInnerContainer.classList.add('featured1-carousel-inner')
        while (featuresCarousel.firstChild) {
          carouselInnerContainer.appendChild(featuresCarousel.firstChild)
        }
        featuresCarousel.appendChild(carouselInnerContainer)
        carouselInnerContainer.style.display = 'flex'
        carouselInnerContainer.style.gap = `${gap}px`
      }

      featuresArrowLeft.addEventListener('click', () => {
        if (currentCardIndex > 0) {
          currentCardIndex--
          carouselInnerContainer.style.transform =
            'translateX(-' + currentCardIndex * scrollAmount + 'px)'
          updateFeaturesControls()
        }
      })

      featuresArrowRight.addEventListener('click', () => {
        if (currentCardIndex < maxCardIndex) {
          currentCardIndex++
          carouselInnerContainer.style.transform =
            'translateX(-' + currentCardIndex * scrollAmount + 'px)'
          updateFeaturesControls()
        }
      })

      updateFeaturesControls()

      let isDownFeatures = false
      let startXFeatures
      let scrollLeftFeatures_draggable

      featuresWrapper.addEventListener('mousedown', (e) => {
        isDownFeatures = true
        featuresWrapper.classList.add('active-drag')
        startXFeatures = e.pageX - featuresWrapper.offsetLeft
        scrollLeftFeatures_draggable = currentCardIndex * scrollAmount
        if (carouselInnerContainer)
          carouselInnerContainer.style.transition = 'none'
      })

      function handleDragEnd() {
        if (!isDownFeatures) return
        isDownFeatures = false
        featuresWrapper.classList.remove('active-drag')
        if (carouselInnerContainer)
          carouselInnerContainer.style.transition = 'transform 0.3s ease-out'

        const currentTransform = parseFloat(
          getComputedStyle(carouselInnerContainer).transform.split(',')[4] || 0
        )
        currentCardIndex = Math.round(-currentTransform / scrollAmount)
        currentCardIndex = Math.max(0, Math.min(currentCardIndex, maxCardIndex))

        if (carouselInnerContainer)
          carouselInnerContainer.style.transform =
            'translateX(-' + currentCardIndex * scrollAmount + 'px)'
        updateFeaturesControls()
        setTimeout(() => {
          if (carouselInnerContainer)
            carouselInnerContainer.style.transition =
              'transform 0.5s ease-in-out'
        }, 300)
      }

      featuresWrapper.addEventListener('mouseleave', handleDragEnd)
      featuresWrapper.addEventListener('mouseup', handleDragEnd)

      featuresWrapper.addEventListener('mousemove', (e) => {
        if (!isDownFeatures || !carouselInnerContainer) return
        e.preventDefault()
        const x = e.pageX - featuresWrapper.offsetLeft
        const walk = (x - startXFeatures) * 1.5
        let newScrollVal = scrollLeftFeatures_draggable - walk

        const overScrollDragLimit = scrollAmount / 2
        const minPossibleTransform =
          -(maxCardIndex * scrollAmount) - overScrollDragLimit
        const maxPossibleTransform = overScrollDragLimit

        newScrollVal = Math.max(
          minPossibleTransform,
          Math.min(newScrollVal, maxPossibleTransform)
        )
        carouselInnerContainer.style.transform =
          'translateX(-' + newScrollVal + 'px)'
      })
    } else {
      // console.warn('Карточки в карусели "Почему выбирают нас?" не найдены.');
    }
  } else {
    // console.warn('Элементы карусели "Почему выбирают нас?" не найдены.');
  }

  // --- Galaxy Carousel (Как работает наша галактика?) ---
  const galaxyCarousel = document.querySelector('.galaxy-carousel')
  const galaxyWrapper = document.querySelector('.galaxy-carousel-wrapper')
  const arrowLeftGalaxy = document.querySelector('.galaxy-arrow-left')
  const arrowRightGalaxy = document.querySelector('.galaxy-arrow-right')
  const currentStepTitleElement = document.querySelector(
    '.galaxy-step-current-title'
  )
  const stepIndicatorButtonText = document.querySelector(
    '.galaxy-step-number-text'
  )

  if (
    galaxyCarousel &&
    galaxyWrapper &&
    arrowLeftGalaxy &&
    arrowRightGalaxy &&
    currentStepTitleElement &&
    stepIndicatorButtonText
  ) {
    const galaxyCards = galaxyCarousel.querySelectorAll('.galaxy-step-card')
    if (galaxyCards.length > 0) {
      let currentGalaxyIndex = 0
      const totalGalaxyCards = galaxyCards.length
      let galaxyAutoplayInterval = null

      function updateGalaxyCarousel() {
        galaxyCards.forEach((card, index) => {
          card.classList.toggle('active-step', index === currentGalaxyIndex)
        })

        const currentCardData =
          galaxyCards[currentGalaxyIndex].querySelector('.galaxy-step-data')
        if (currentCardData) {
          currentStepTitleElement.textContent =
            currentCardData.dataset.stepTitle || 'Заголовок шага'
          stepIndicatorButtonText.textContent =
            (currentCardData.dataset.stepNumber || '') + '  ШАГ'
        }
      }

      function advanceSlide(direction) {
        if (direction === 'next') {
          currentGalaxyIndex = (currentGalaxyIndex + 1) % totalGalaxyCards
        } else {
          currentGalaxyIndex =
            (currentGalaxyIndex - 1 + totalGalaxyCards) % totalGalaxyCards
        }
        updateGalaxyCarousel()
      }

      function resetAutoplay() {
        clearInterval(galaxyAutoplayInterval)
        galaxyAutoplayInterval = setInterval(() => {
          advanceSlide('next')
        }, 10000) // 10 seconds
      }

      arrowLeftGalaxy.addEventListener('click', () => {
        advanceSlide('prev')
        resetAutoplay()
      })

      arrowRightGalaxy.addEventListener('click', () => {
        advanceSlide('next')
        resetAutoplay()
      })

      // Stop autoplay on hover for better UX
      galaxyWrapper.addEventListener('mouseenter', () =>
        clearInterval(galaxyAutoplayInterval)
      )
      galaxyWrapper.addEventListener('mouseleave', () => resetAutoplay())

      updateGalaxyCarousel()
      resetAutoplay()
    } else {
      // console.warn('Карточки в карусели "Галактика" не найдены.');
    }
  } else {
    // console.warn('Элементы карусели "Галактика" не найдены.');
  }

  // --- Success Stories Carousel ---
  const successCarousel = document.querySelector('.success-stories-carousel')
  const successContainer = document.querySelector(
    '.success-stories-carousel-container-with-arrows'
  )
  const successArrowLeft = document.querySelector('.success-stories-arrow-left')
  const successArrowRight = document.querySelector(
    '.success-stories-arrow-right'
  )

  if (
    successCarousel &&
    successContainer &&
    successArrowLeft &&
    successArrowRight
  ) {
    const successInner = successCarousel.querySelector(
      '.featured8-carousel-inner'
    )
    const successCards = successInner
      ? successInner.querySelectorAll('.success-story-card')
      : []

    if (successCards.length > 0) {
      const cardWidth = successCards[0].offsetWidth
      const gap = parseInt(getComputedStyle(successInner).gap) || 25
      const scrollAmount = cardWidth + gap
      const totalCards = successCards.length
      const carouselWidth = successCarousel.offsetWidth
      const visibleCards = Math.floor(carouselWidth / scrollAmount)
      const maxCardIndex = Math.max(0, totalCards - visibleCards)
      let currentCardIndex = 0

      const iconLeftInactive = successContainer.dataset.iconLeftInactive
      const iconRightActive = successContainer.dataset.iconRightActive
      // Assuming the active left and inactive right icons follow a naming convention
      const iconLeftActive = iconLeftInactive.replace('left', 'right') // Heuristic
      const iconRightInactive = iconRightActive.replace('right', 'left') // Heuristic

      function updateSuccessControls() {
        // Left Arrow Logic
        if (currentCardIndex > 0) {
          successArrowLeft.src = iconRightActive // Active left is yellow, like active right
          successArrowLeft.classList.remove('disabled')
        } else {
          successArrowLeft.src = iconLeftInactive // Inactive left is grey
          successArrowLeft.classList.add('disabled')
        }

        // Right Arrow Logic
        if (currentCardIndex >= maxCardIndex) {
          successArrowRight.src = iconLeftInactive // Inactive right is grey, like inactive left
          successArrowRight.classList.add('disabled')
        } else {
          successArrowRight.src = iconRightActive // Active right is yellow
          successArrowRight.classList.remove('disabled')
        }
      }

      successArrowLeft.addEventListener('click', () => {
        if (currentCardIndex > 0) {
          currentCardIndex--
          successInner.style.transform = `translateX(-${currentCardIndex * scrollAmount}px)`
          updateSuccessControls()
        }
      })

      successArrowRight.addEventListener('click', () => {
        if (currentCardIndex < maxCardIndex) {
          currentCardIndex++
          successInner.style.transform = `translateX(-${currentCardIndex * scrollAmount}px)`
          updateSuccessControls()
        }
      })

      updateSuccessControls()

      // Optional: Recalculate on window resize
      window.addEventListener('resize', () => {
        const newCarouselWidth = successCarousel.offsetWidth
        const newVisibleCards = Math.floor(newCarouselWidth / scrollAmount)
        const newMaxCardIndex = Math.max(0, totalCards - newVisibleCards)

        if (currentCardIndex > newMaxCardIndex) {
          currentCardIndex = newMaxCardIndex
          successInner.style.transform = `translateX(-${currentCardIndex * scrollAmount}px)`
        }
        updateSuccessControls()
      })
    } else {
      console.warn('Карточки в карусели "Истории успеха" не найдены.')
    }
  } else {
    console.warn('Элементы карусели "Истории успеха" не найдены.')
  }

  // Блок скрипта для sticky эффекта был здесь и теперь удален.
})
