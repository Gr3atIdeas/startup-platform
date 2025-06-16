document.addEventListener('DOMContentLoaded', function () {
  const dataElement = document.getElementById('planetary-system-data')
  if (!dataElement) {
    console.error('Data element #planetary-system-data not found!')
    return
  }
  const config = JSON.parse(dataElement.textContent)

  try {
    // Передаём информацию о пользователе из config
    const isAuthenticated = config.isAuthenticated
    const isStartuper = config.isStartuper
    console.log('User context from config:', { isAuthenticated, isStartuper })

    // Формируем объект startups из config.planetsData
    const startups = {}
    if (config.planetsData) {
      config.planetsData.forEach((planet) => {
        startups[planet.id] = planet
      })
    }
    console.log('Startups data from config:', startups)

    const planets = document.querySelectorAll('.planet')
    const infoCard = document.getElementById('info-card')
    const planetImage = document.getElementById('planet-image')
    const startupName = document.getElementById('startup-name')
    const startupRating = document.getElementById('startup-rating')
    const startupProgress = document.getElementById('startup-progress')
    const startupFunding = document.getElementById('startup-funding')
    const startupInvestors = document.getElementById('startup-investors')
    const startupDescription = document.getElementById('startup-description')
    const closeCard = document.getElementById('close-card')
    const moreDetails = document.getElementById('more-details')
    const solarSystem = document.getElementById('solar-system')
    const scene = document.getElementById('scene')
    const galaxyElement = document.getElementById('galaxy') // Renamed to avoid conflict with galaxy variable/parameter
    const galaxySelector = document.getElementById('galaxy-selector')
    const galaxyList = document.getElementById('galaxy-list')

    console.log('Found planets:', planets.length)
    console.log('infoCard:', infoCard)
    console.log('solarSystem:', solarSystem)
    console.log('galaxySelector:', galaxySelector)

    let currentStartupID = null
    const galaxyTiltAngle = 45
    let lastTime = 0
    let isPaused = false
    let pausedTime = 0
    let lastInteractionTime = Date.now()
    const inactivityTimeout = 10000
    let isReturningToCenter = false
    let isDragging = false
    let startX_drag, startY_drag // Renamed to avoid conflict
    let offsetX = 0
    let offsetY = 0
    let scale = 1

    planets.forEach((planet) => {
      console.log('Processing planet:', planet)
      const randomAngle = Math.random() * 360
      planet.parentElement.parentElement.style.setProperty(
        '--random-angle',
        `${randomAngle}deg`
      )
      const randomSpeedFactor = 0.8 + Math.random() * 0.4
      planet.parentElement.parentElement.style.setProperty(
        '--random-speed-factor',
        randomSpeedFactor
      )
      const id = planet.getAttribute('data-id')
      console.log(`Planet ID: ${id}, Startup data:`, startups[id])

      if (startups[id] && startups[id].image) {
        const img = new Image()
        img.src = startups[id].image
        img.onload = () => {
          console.log(`Image loaded for startup ${id}: ${startups[id].image}`)
        }
        img.onerror = () => {
          console.error(
            `Failed to load image for startup ${id}: ${startups[id].image}`
          )
          planet.style.backgroundImage = `url('https://via.placeholder.com/150')`
        }
      } else if (id !== 'create-startup') {
        // Don't error for special planets if they lack image in startups object
        console.warn(`No image data for planet ${id} or startup data missing.`)
        planet.style.backgroundImage = `url('https://via.placeholder.com/150')`
      }

      planet.addEventListener('click', (e) => {
        console.log(`Planet clicked: ${id}`)
        e.stopPropagation()
        if (id === 'create-startup') {
          console.log('Clicked on create-startup planet')
          if (isAuthenticated && isStartuper) {
            window.location.href = config.urls.createStartup
          } else if (!isAuthenticated) {
            window.location.href = config.urls.register
          }
          return
        }

        const startup = startups[id]
        if (!startup) {
          console.error('Startup data not found for id:', id)
          return
        }
        console.log('Startup data:', startup)

        planetImage.style.backgroundImage = `url('${startup.image}')`
        startupName.textContent = startup.name
        startupRating.textContent = `Рейтинг ${startup.rating} | Комментариев: ${startup.comment_count || 0}`
        startupProgress.innerHTML = `
                    <div class="progress-bar-visual">
                      <div class="progress-animation-container" style="width: ${startup.progress};">
                        <div class="progress-planets"></div>
                      </div>
                      <span class="progress-percentage">${startup.progress}</span>
                    </div>`
        startupFunding.innerHTML = `
                    <strong>Направление:</strong> ${startup.direction}<br>
                    <div class="funding-goal-container-figma">
                      <span class="funding-goal-text-figma">Цель финансирования: ${startup.funding_goal}</span>
                    </div>` // Corrected to funding_goal from startup.funding if that's the correct field from context
        startupInvestors.innerHTML = `
                    <div class="investor-count-container-figma">
                      <i class="fas fa-users investor-icon-figma"></i>
                      <span class="investor-count-text-figma">${startup.investors}</span>
                    </div>`
        startupDescription.innerHTML = `
                    <div class="progress-bar">
                      ${startup.investment_type && startup.investment_type !== 'Не указано' ? `<button>${startup.investment_type}</button>` : ''}
                    </div>
                    <div class="startup-short-description">${startup.description}</div>`
        currentStartupID = startup.startup_id
        console.log('Current Startup ID:', currentStartupID)
        planets.forEach((p) => p.classList.remove('active'))
        planet.classList.add('active')
        infoCard.style.display = 'block'
        isPaused = true
        pausedTime = Date.now()
        lastInteractionTime = Date.now()
      })
    })

    if (closeCard) {
      closeCard.addEventListener('click', () => {
        console.log('Close card clicked')
        infoCard.style.display = 'none'
        planets.forEach((p) => p.classList.remove('active'))
        if (isPaused) {
          const pauseDuration = Date.now() - pausedTime
          planetObjects.forEach((planetObj) => {
            planetObj.startTime += pauseDuration
          })
          isPaused = false
          console.log('Resuming planet rotation')
        }
        lastInteractionTime = Date.now()
      })
    }

    if (moreDetails) {
      moreDetails.addEventListener('click', () => {
        console.log('More details clicked')
        if (currentStartupID) {
          window.location.href = `/startups/${currentStartupID}/`
        } else {
          console.error(
            'Startup ID не найден для перехода на страницу стартапа'
          )
        }
        infoCard.style.display = 'none'
        planets.forEach((p) => p.classList.remove('active'))
        if (isPaused) {
          const pauseDuration = Date.now() - pausedTime
          planetObjects.forEach((planetObj) => {
            planetObj.startTime += pauseDuration
          })
          isPaused = false
          console.log('Resuming planet rotation after more details')
        }
        lastInteractionTime = Date.now()
      })
    }

    if (solarSystem) {
      solarSystem.addEventListener('mousedown', (e) => {
        console.log('Solar system mousedown')
        e.preventDefault()
        const rect = solarSystem.getBoundingClientRect()
        startX_drag = e.clientX - rect.left
        startY_drag = e.clientY - rect.top
        isDragging = true
        solarSystem.classList.add('dragging')
        lastInteractionTime = Date.now()
        isReturningToCenter = false
      })

      solarSystem.addEventListener('wheel', (e) => {
        console.log('Solar system wheel')
        e.preventDefault()
        const rect = solarSystem.getBoundingClientRect()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        scale = Math.max(0.5, Math.min(3, scale + delta))
        if (scene)
          scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`
        lastInteractionTime = Date.now()
        isReturningToCenter = false
      })
    }

    document.addEventListener('mousemove', (e) => {
      if (solarSystem && isDragging) {
        // Check if solarSystem exists
        const rect = solarSystem.getBoundingClientRect()
        const deltaX = e.clientX - rect.left - startX_drag
        const deltaY = e.clientY - rect.top - startY_drag
        offsetX += deltaX
        offsetY += deltaY
        const maxX = rect.width / 2 / scale
        const maxY = rect.height / 2 / scale
        offsetX = Math.max(-maxX, Math.min(maxX, offsetX))
        offsetY = Math.max(-maxY, Math.min(maxY, offsetY))
        if (scene)
          scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`
        startX_drag = e.clientX - rect.left
        startY_drag = e.clientY - rect.top
        lastInteractionTime = Date.now()
      }
    })

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false
        if (solarSystem) solarSystem.classList.remove('dragging') // Check if solarSystem exists
        lastInteractionTime = Date.now()
        console.log('Dragging ended')
      }
    })

    // Инициализация объектов планет
    const planetObjects = []
    if (planets.length > 0) {
      planets.forEach((planet) => {
        const id = planet.getAttribute('data-id')
        const startupData = startups[id]
        if (!startupData) {
          console.warn(`No startup data for planet with id: ${id}`)
          return
        }
        planetObjects.push({
          element: planet.parentElement.parentElement, // target the orbit element
          angle: parseFloat(
            getComputedStyle(planet.parentElement.parentElement).getPropertyValue(
              '--random-angle'
            )
          ),
          speedFactor: parseFloat(
            getComputedStyle(planet.parentElement.parentElement).getPropertyValue(
              '--random-speed-factor'
            )
          ),
          startTime: Date.now(),
        })
      })
    } else {
      console.warn('No planets found to initialize.')
    }

    // Добавим функцию для автоматического возврата в центр
    function checkInactivity() {
      if (
        !isDragging &&
        !isPaused &&
        Date.now() - lastInteractionTime > inactivityTimeout &&
        !isReturningToCenter
      ) {
        console.log('Inactivity detected, returning to center')
        isReturningToCenter = true
        animateReturn(0)
      }
    }

    function animateReturn(timestamp) {
      if (!isReturningToCenter) return;
      const duration = 1000; // 1 second for return animation
      const progress = Math.min(timestamp / duration, 1);

      const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress));

      const currentOffsetX = offsetX * (1 - easedProgress);
      const currentOffsetY = offsetY * (1 - easedProgress);
      const currentScale = scale + (1 - scale) * easedProgress;

      if (scene) {
        scene.style.transform = `translate(-50%, -50%) translate(${currentOffsetX}px, ${currentOffsetY}px) scale(${currentScale})`;
      }

      if (progress < 1) {
        requestAnimationFrame(animateReturn);
      } else {
        offsetX = 0;
        offsetY = 0;
        scale = 1;
        isReturningToCenter = false;
        if (scene) {
          scene.style.transform = 'translate(-50%, -50%) translate(0px, 0px) scale(1)';
        }
      }
    }

    // Функция для обновления вращения планет
    function updatePlanets() {
      if (isPaused) return; // Не обновляем, если пауза

      const currentTime = Date.now();
      planetObjects.forEach(planetObj => {
        const elapsedTime = currentTime - planetObj.startTime;
        // Убедимся, что orbit_time существует и является числом
        const orbit_time = startups[planetObj.element.querySelector('.planet').dataset.id]?.orbit_time;
        if (typeof orbit_time !== 'number' || orbit_time <= 0) {
          // console.warn(`Invalid or zero orbit_time for planet`, planetObj.element);
          return; // Пропускаем эту планету, если время орбиты невалидно
        }
        const angle = (360 * elapsedTime / (orbit_time * 1000)) % 360;
        planetObj.element.style.transform = `rotateZ(${angle}deg)`;
      });
    }

    function animate(currentTime) {
      if (!lastTime) {
        lastTime = currentTime
      }
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      if (!isPaused) {
        updatePlanets(currentTime)
      }

      // Only return to center if not dragging and inactive
      if (
        !isDragging &&
        Date.now() - lastInteractionTime > inactivityTimeout &&
        !isReturningToCenter
      ) {
        isReturningToCenter = true
        animateReturn(0)
      }

      requestAnimationFrame(animate)
    }

    function checkInactivity() {
      if (
        !isDragging &&
        !isPaused &&
        Date.now() - lastInteractionTime > inactivityTimeout &&
        !isReturningToCenter
      ) {
        isReturningToCenter = true
        animateReturn(0) // Start the return animation
      }
    }
    // Start inactivity check loop
    setInterval(checkInactivity, 2000)

    // Запускаем анимацию
    if (galaxyElement) {
      // Check if galaxyElement is not null
      animate(0)
    }

    // Функционал для селектора галактик
    if (galaxySelector) {
      galaxySelector.addEventListener('click', () => {
        galaxyList.classList.toggle('active')
      })

      document.addEventListener('click', (e) => {
        if (
          !galaxySelector.contains(e.target) &&
          !galaxyList.contains(e.target)
        ) {
          galaxyList.classList.remove('active')
        }
      })

      function selectGalaxy(galaxyName) {
        // Устанавливаем GET-параметр и перезагружаем страницу
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('galaxy', galaxyName)
        window.location.href = currentUrl.toString()
      }

      // Добавляем обработчики на элементы списка
      const galaxyItems = galaxyList.querySelectorAll('li')
      galaxyItems.forEach((item) => {
        item.addEventListener('click', () => {
          const galaxyName = item.getAttribute('data-galaxy')
          console.log(`Galaxy selected: ${galaxyName}`)
          selectGalaxy(galaxyName)
        })
      })

      function smoothScroll() {
        const targetElement = document.getElementById('solar-system-section')
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
          })
        }
      }
    }
  } catch (error) {
    console.error('Error in planetary_system.js execution:', error)
  }
})
