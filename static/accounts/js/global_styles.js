document.addEventListener('DOMContentLoaded', function () {
  document.documentElement.style.scrollBehavior = 'smooth'
  var style = document.createElement('style')
  style.textContent =
    'html { scroll-behavior: smooth; } ' +
    '* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; } ' +
    'img, video, svg { shape-rendering: geometricPrecision; image-rendering: -webkit-optimize-contrast; } ' +
    'button, .btn, input, .wave-effect { backface-visibility: hidden; -webkit-backface-visibility: hidden; }'
  document.head.appendChild(style)
  const dropdownContainer = document.querySelector(
    '.profile-dropdown-container'
  )
  const dropdownButton = document.querySelector('.profile-dropdown-button')
  if (dropdownButton) {
    dropdownButton.addEventListener('click', function (event) {
      event.stopPropagation()
      dropdownContainer.classList.toggle('open')
    })
  }
  document.addEventListener('click', function (event) {
    if (dropdownContainer && dropdownContainer.classList.contains('open')) {
      if (!dropdownContainer.contains(event.target)) {
        dropdownContainer.classList.remove('open')
      }
    }
  })
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href')
      if (targetId && targetId.length > 1) {
        e.preventDefault()
        const targetElement = document.querySelector(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
          })
        }
      }
    })
  })
  const buttons = document.querySelectorAll('.btn-effect')
  buttons.forEach((button) => {
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(1px)'
      button.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)'
    })
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(0)'
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
    })
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)'
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
    })
  })
  const catalogDropdownButton = document.querySelector('.catalog-dropdown-button');
  const catalogDropdownMenu = document.querySelector('.catalog-dropdown-menu');
  const catalogDropdownContainer = document.querySelector('.catalog-dropdown-container');
  if (catalogDropdownButton && catalogDropdownMenu && catalogDropdownContainer) {
      catalogDropdownButton.addEventListener('click', function (event) {
          event.stopPropagation();
          catalogDropdownContainer.classList.toggle('open');
      });
      document.addEventListener('click', function (event) {
          if (catalogDropdownContainer.classList.contains('open') &&
              !catalogDropdownMenu.contains(event.target) &&
              !catalogDropdownButton.contains(event.target)) {
              catalogDropdownContainer.classList.remove('open');
          }
      });
  }
})
