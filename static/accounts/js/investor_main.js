// This is a placeholder for JavaScript code for the main_temp page.
// We can add functionality here later if needed.

document.addEventListener('DOMContentLoaded', function () {
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
