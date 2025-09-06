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
  function closeAllHeaderMenus() {
    const catalogContainers = document.querySelectorAll('.catalog-dropdown-container')
    catalogContainers.forEach((cont) => {
      cont.classList.remove('open')
      const ov = cont.nextElementSibling
      if (ov && ov.classList.contains('catalog-dropdown-overlay')) ov.style.display = 'none'
    })
    document.body.classList.remove('catalog-menu-open')
    const createContainers = document.querySelectorAll('.create-dropdown-container')
    createContainers.forEach((cont) => {
      cont.classList.remove('open')
      const ov = cont.nextElementSibling
      if (ov && ov.classList.contains('create-dropdown-overlay')) ov.style.display = 'none'
    })
    document.body.classList.remove('create-menu-open')
    if (dropdownContainer) dropdownContainer.classList.remove('open')
  }
  if (dropdownButton) {
    dropdownButton.addEventListener('click', function (event) {
      event.stopPropagation()
      closeAllHeaderMenus()
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
      const hrefValue = this.getAttribute('href')
      if (hrefValue && hrefValue.startsWith('#') && hrefValue.length > 1) {
        e.preventDefault()
        const targetElement = document.querySelector(hrefValue)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })
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
  const catalogDropdownButtons = document.querySelectorAll('.catalog-dropdown-button');
  const catalogDropdownContainers = document.querySelectorAll('.catalog-dropdown-container');

  catalogDropdownButtons.forEach((button, index) => {
      const container = catalogDropdownContainers[index];
      const menu = container.querySelector('.catalog-dropdown-menu');

      if (button && menu && container) {
          button.addEventListener('click', function (event) {
          event.stopPropagation();

              closeAllHeaderMenus();
              catalogDropdownContainers.forEach(cont => {
                  cont.classList.remove('open');
                  const contOverlay = cont.nextElementSibling;
                  if (contOverlay && contOverlay.classList.contains('catalog-dropdown-overlay')) {
                      contOverlay.style.display = 'none';
                      document.body.classList.remove('catalog-menu-open');
                  }
              });
              container.classList.toggle('open');

              const overlay = container.nextElementSibling;
              if (overlay && overlay.classList.contains('catalog-dropdown-overlay')) {
                  if (container.classList.contains('open')) {
                      overlay.style.display = 'block';
                      document.body.classList.add('catalog-menu-open');
                  } else {
                      overlay.style.display = 'none';
                      document.body.classList.remove('catalog-menu-open');
                  }
              }
          });
      }
  });

  document.addEventListener('click', function (event) {
      catalogDropdownContainers.forEach(container => {
          if (container.classList.contains('open')) {
              const menu = container.querySelector('.catalog-dropdown-menu');
              const button = container.querySelector('.catalog-dropdown-button');
              const overlay = container.nextElementSibling;

              if (!menu.contains(event.target) && !button.contains(event.target)) {
                  container.classList.remove('open');
                  const overlay = container.nextElementSibling;
                  if (overlay && overlay.classList.contains('catalog-dropdown-overlay')) {
                      overlay.style.display = 'none';
                      document.body.classList.remove('catalog-menu-open');
                  }
              }
          }
      });
  });

  const catalogDropdownOverlays = document.querySelectorAll('.catalog-dropdown-overlay');
  catalogDropdownOverlays.forEach(overlay => {
      overlay.addEventListener('click', function() {
          catalogDropdownContainers.forEach(container => {
              if (container.classList.contains('open')) {
                  container.classList.remove('open');
              }
          });
          overlay.style.display = 'none';
          document.body.classList.remove('catalog-menu-open');
      });
  });

  document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
          catalogDropdownContainers.forEach(container => {
              if (container.classList.contains('open')) {
                  container.classList.remove('open');
                  const overlay = container.nextElementSibling;
                  if (overlay && overlay.classList.contains('catalog-dropdown-overlay')) {
                      overlay.style.display = 'none';
                      document.body.classList.remove('catalog-menu-open');
                  }
              }
          });

          createDropdownContainers.forEach(container => {
              if (container.classList.contains('open')) {
                  container.classList.remove('open');
                  const overlay = container.nextElementSibling;
                  if (overlay && overlay.classList.contains('create-dropdown-overlay')) {
                      overlay.style.display = 'none';
                      document.body.classList.remove('create-menu-open');
                  }
              }
          });
      }
  });

  const createDropdownButtons = document.querySelectorAll('.create-dropdown-button');
  const createDropdownContainers = document.querySelectorAll('.create-dropdown-container');

  createDropdownButtons.forEach((button, index) => {
      const container = createDropdownContainers[index];
      const menu = container.querySelector('.create-dropdown-menu');

      if (button && menu && container) {
          button.addEventListener('click', function (event) {
              event.stopPropagation();

              closeAllHeaderMenus();
              createDropdownContainers.forEach(cont => {
                  cont.classList.remove('open');
                  const contOverlay = cont.nextElementSibling;
                  if (contOverlay && contOverlay.classList.contains('create-dropdown-overlay')) {
                      contOverlay.style.display = 'none';
                      document.body.classList.remove('create-menu-open');
                  }
              });
              container.classList.toggle('open');

              const overlay = container.nextElementSibling;
              if (overlay && overlay.classList.contains('create-dropdown-overlay')) {
                  if (container.classList.contains('open')) {
                      overlay.style.display = 'block';
                      document.body.classList.add('create-menu-open');
                  } else {
                      overlay.style.display = 'none';
                      document.body.classList.remove('create-menu-open');
                  }
              }
          });
      }
  });

      document.addEventListener('click', function (event) {
      createDropdownContainers.forEach(container => {
          if (container.classList.contains('open')) {
              const menu = container.querySelector('.create-dropdown-menu');
              const button = container.querySelector('.create-dropdown-button');
              const overlay = container.nextElementSibling;

              if (!menu.contains(event.target) && !button.contains(event.target)) {
                  container.classList.remove('open');
                  const overlay = container.nextElementSibling;
                  if (overlay && overlay.classList.contains('create-dropdown-overlay')) {
                      overlay.style.display = 'none';
                      document.body.classList.remove('create-menu-open');
                  }
              }
          }
      });
  });

  const createDropdownOverlays = document.querySelectorAll('.create-dropdown-overlay');
  createDropdownOverlays.forEach(overlay => {
      overlay.addEventListener('click', function() {
          createDropdownContainers.forEach(container => {
              if (container.classList.contains('open')) {
                  container.classList.remove('open');
              }
          });
          overlay.style.display = 'none';
          document.body.classList.remove('create-menu-open');
      });
  });
})
