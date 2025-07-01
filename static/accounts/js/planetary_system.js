// НОВАЯ ПЛАНЕТАРНАЯ СИСТЕМА - РАБОЧАЯ ВЕРСИЯ ИЗ ДЕМО
// Планеты движутся по орбитам, всегда повернуты к камере

(function() {
  'use strict';

  // Поиск скрипта с данными
  const dataScript = document.getElementById('planetary-system-data')
                    || document.getElementById('planetary-data')
                    || document.getElementById('planetary-investments-data')
                    || document.getElementById('planetary-startups-data');

  if (!dataScript) {
    console.warn('[NewPlanetary] JSON-скрипт с данными не найден');
    return;
  }

  let data;
  try {
    data = JSON.parse(dataScript.textContent);
  } catch (e) {
    console.error('[NewPlanetary] Ошибка парсинга данных:', e);
    return;
  }

  // Извлекаем данные из разных возможных структур
  const planetsData = data.planetsData || data.planets || [];
  const directionsData = data.directionsData || data.directions || [];
  const selectedGalaxy = data.selectedGalaxy || '';
  const logoData = { image: data.logoImage || (data.logo ? data.logo.image : '') };
  const urls = data.urls || {};

  console.log('[NewPlanetary] Загружены данные:', { planetsData, directionsData, selectedGalaxy });

  // Новые DOM элементы
  const planets = document.querySelectorAll('.new_planetary_planet');
  const planetOrientations = document.querySelectorAll('.new_planetary_planet_orientation');
  const orbits = document.querySelectorAll('.new_planetary_orbit');
  const infoCard = document.getElementById('new_planetary_info_card');
  const planetImage = document.getElementById('new_planetary_planet_image');
  const startupName = document.getElementById('new_planetary_startup_name');
  const startupRating = document.getElementById('new_planetary_startup_rating');
  const startupProgress = document.getElementById('new_planetary_startup_progress');
  const startupFunding = document.getElementById('new_planetary_startup_funding');
  const startupInvestors = document.getElementById('new_planetary_startup_investors');
  const startupDescription = document.getElementById('new_planetary_startup_description');
  const closeCard = document.getElementById('new_planetary_close_card');
  const moreDetails = document.getElementById('new_planetary_more_details');
  const solarSystem = document.getElementById('new_planetary_solar_system');
  const scene = document.getElementById('new_planetary_scene');
  const galaxy = document.getElementById('new_planetary_galaxy');
  const sunContainer = document.getElementById('new_planetary_sun_container');
  const allStartupsBtn = document.querySelector('.new_planetary_all_startups_button');

  // Fallback изображения планет
  const fallbackScript = document.getElementById('new_planetary_fallback_images');
  let fallbackImages = { round: [], ring: [] };
  if (fallbackScript) {
    try {
      fallbackImages = JSON.parse(fallbackScript.textContent);
    } catch(e) {
      console.warn('[NewPlanetary] Не удалось загрузить fallback изображения');
    }
  }

  // Настройка логотипа
  if (sunContainer && logoData.image) {
    const sunLogo = document.getElementById('new_planetary_sun_logo');
    if (sunLogo) {
      sunLogo.src = logoData.image;
    }
  }

  // Переменные для анимации
  const planetObjects = [];
  let isPaused = false;
  let pausedTime = 0;
  let lastInteractionTime = Date.now();
  const inactivityTimeout = 10000;
  let isReturningToCenter = false;

  // Переменные для управления камерой
  let isDragging = false;
  let startX = 0, startY = 0;
  let offsetX = 0, offsetY = 0;
  let scale = 1;

  // Угол наклона галактики из демо версии
  const galaxyTiltAngle = 47; // градусы
  const planetCompensation = -45; // компенсация наклона для планет

  // Инициализация планет - РАБОЧАЯ ЛОГИКА ИЗ ДЕМО
  function initializePlanets() {
    planets.forEach((planet, index) => {
      const orbit = planet.closest('.new_planetary_orbit');
      const planetOrientation = planet.closest('.new_planetary_planet_orientation');
      
      if (!orbit || !planetOrientation) {
        console.warn(`[NewPlanetary] Орбита или ориентация не найдены для планеты ${index}`);
        return;
      }

      // Получаем размеры из CSS
      const orbitSizeStr = getComputedStyle(orbit).getPropertyValue('--orbit-size').trim();
      const orbitTimeStr = getComputedStyle(orbit).getPropertyValue('--orbit-time').trim();
      const planetSizeStr = getComputedStyle(planet).getPropertyValue('--planet-size').trim();
      
      const orbitSize = parseFloat(orbitSizeStr.replace('px', '')) || 300;
      const orbitTime = parseFloat(orbitTimeStr.replace('s', '')) || 60;
      const planetSize = parseFloat(planetSizeStr.replace('px', '')) || 60;

      // Генерируем случайный начальный угол и скорость для каждой планеты
      const initialAngle = Math.random() * 360;
      const speedFactor = 0.8 + Math.random() * 0.4;

      // Установка изображения планеты
      setupPlanetImage(planet, index);

      // Обработчик клика
      setupPlanetClick(planet, index);

      // Сохраняем данные планеты
      planetObjects.push({
        element: planet,
        orientation: planetOrientation,
        orbit: orbit,
        orbitSize: orbitSize,
        orbitTime: orbitTime,
        angle: initialAngle,
        speedFactor: speedFactor,
        startTime: Date.now() - Math.random() * orbitTime * 1000,
        size: planetSize
      });

      console.log(`[NewPlanetary] Планета ${index}: орбита ${orbitSize}px, время ${orbitTime}s`);
    });

    console.log(`[NewPlanetary] Инициализировано ${planetObjects.length} планет`);
  }

  // Настройка изображения планеты
  function setupPlanetImage(planet, index) {
    const id = planet.getAttribute('data-id');
    let planetData = planetsData.find(p => p.id == id || p.startup_id == id);
    
    if (!planetData && planetsData[index]) {
      planetData = planetsData[index];
    }

    console.log(`[NewPlanetary] Настройка планеты ${index}, ID: ${id}, данные:`, planetData);

    // Устанавливаем изображение планеты
    let planetImageUrl = null;
    
    if (planetData) {
      // Пробуем различные поля для изображения
      planetImageUrl = planetData.planet_image 
                      || planetData.image 
                      || planetData.logo 
                      || planetData.avatar
                      || (planetData.startup && planetData.startup.planet_image)
                      || (planetData.startup && planetData.startup.image);
    }

    // Если нет изображения в данных, используем fallback
    if (!planetImageUrl && fallbackImages.round.length > 0) {
      planetImageUrl = fallbackImages.round[index % fallbackImages.round.length];
    }

    // Устанавливаем изображение как background-image
    if (planetImageUrl) {
      planet.style.backgroundImage = `url(${planetImageUrl})`;
      console.log(`[NewPlanetary] Планета ${index}: установлено изображение ${planetImageUrl}`);
    } else {
      console.warn(`[NewPlanetary] Планета ${index}: изображение не найдено`);
    }

    // Установка атрибута направления
    if (planetData && planetData.direction) {
      planet.dataset.direction = planetData.direction;
    }
    
    // Сохраняем данные планеты в атрибуте для быстрого доступа
    if (planetData) {
      planet.dataset.planetData = JSON.stringify(planetData);
    }
  }

  // Обработчик клика по планете
  function setupPlanetClick(planet, index) {
    planet.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const id = planet.getAttribute('data-id');
      let planetData = null;
      
      // Ищем данные планеты по разным полям
      if (id) {
        planetData = planetsData.find(p => p.id == id || p.startup_id == id);
      }
      
      // Если не нашли по ID, берем по индексу
      if (!planetData && planetsData[index]) {
        planetData = planetsData[index];
      }

      console.log(`[NewPlanetary] Клик по планете ${index}, ID: ${id}, найдены данные:`, planetData);

      // Заполняем карточку данными
      if (planetData && (planetData.name || planetData.startup_name)) {
        fillInfoCard(planetData, planet);
      } else {
        console.warn(`[NewPlanetary] Данные не найдены для планеты ${index}, используем fallback`);
        fillInfoCardFallback(planet, index);
      }

      // Активируем планету
      planets.forEach(p => p.classList.remove('active'));
      planet.classList.add('active');
      
      // Показываем карточку
      if (infoCard) {
        infoCard.style.display = 'block';
      }
      
      // Приостанавливаем анимацию
      if (!isPaused) {
        isPaused = true;
        pausedTime = Date.now();
      }
      
      lastInteractionTime = Date.now();
    });
  }

  // Заполнение карточки данными
  function fillInfoCard(planetData, planet) {
    const name = planetData.name || planetData.startup_name || 'Неизвестный стартап';
    const rating = planetData.rating || '4.5';
    const funding = planetData.funding || planetData.goal || '1,000,000₽';
    const investors = planetData.investors_count || '25';
    const description = planetData.description || planetData.short_description || 'Описание стартапа';
    
    // Изображение для карточки
    let cardImageUrl = planetData.planet_image 
                      || planetData.image 
                      || planetData.logo 
                      || planetData.avatar;
    
    if (!cardImageUrl && fallbackImages.round.length > 0) {
      const index = [...planets].indexOf(planet);
      cardImageUrl = fallbackImages.round[index % fallbackImages.round.length];
    }

    if (startupName) startupName.textContent = name;
    if (startupRating) startupRating.textContent = `★★★★☆ (${rating}/5)`;
    if (startupFunding) startupFunding.textContent = `Цель: ${funding}`;
    if (startupInvestors) startupInvestors.textContent = `Инвесторов: ${investors}`;
    if (startupDescription) startupDescription.textContent = description;
    if (planetImage && cardImageUrl) {
      planetImage.style.backgroundImage = `url(${cardImageUrl})`;
    }
  }

  // Fallback заполнение карточки
  function fillInfoCardFallback(planet, index) {
    const fallbackNames = ['Технологический стартап', 'Инновационный проект', 'Перспективная идея', 'Растущий бизнес'];
    const name = fallbackNames[index % fallbackNames.length];
    
    if (startupName) startupName.textContent = name;
    if (startupRating) startupRating.textContent = '★★★★☆ (4.2/5)';
    if (startupFunding) startupFunding.textContent = 'Цель: 1,500,000₽';
    if (startupInvestors) startupInvestors.textContent = 'Инвесторов: 12';
    if (startupDescription) startupDescription.textContent = 'Инновационный проект с большим потенциалом роста';
    
    if (planetImage && fallbackImages.round.length > 0) {
      const imageUrl = fallbackImages.round[index % fallbackImages.round.length];
      planetImage.style.backgroundImage = `url(${imageUrl})`;
    }
  }

  // Обновление позиций планет - РАБОЧАЯ ЛОГИКА ИЗ ДЕМО
  function updatePlanets() {
    if (isPaused) {
      requestAnimationFrame(updatePlanets);
      return;
    }

    const now = Date.now();

    planetObjects.forEach((planetObj, index) => {
      if (!planetObj.orientation || !planetObj.orientation.style) {
        return;
      }

      // Вычисляем текущее положение планеты на орбите
      const elapsedSeconds = (now - planetObj.startTime) / 1000;
      const orbitTimeSeconds = planetObj.orbitTime * planetObj.speedFactor;
      const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
      const angle = planetObj.angle + progress * 360; // в градусах
      const angleRad = angle * Math.PI / 180; // в радианах
      
      // Вычисляем позицию на орбите
      const radius = planetObj.orbitSize / 2;
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius;
      
      // РАБОЧАЯ ЛОГИКА ПОЗИЦИОНИРОВАНИЯ ИЗ ДЕМО - ИСПОЛЬЗУЕМ ПРОЦЕНТЫ
      planetObj.orientation.style.left = `${50 + 50 * (x / radius)}%`;
      planetObj.orientation.style.top = `${50 + 50 * (y / radius)}%`;

      // Отладочная информация для первой планеты
      if (index === 0 && Math.floor(elapsedSeconds) % 5 === 0) {
        console.log(`[NewPlanetary] Планета ${index}: угол ${angle.toFixed(1)}°, позиция left: ${50 + 50 * (x / radius)}%, top: ${50 + 50 * (y / radius)}%`);
      }
    });

    requestAnimationFrame(updatePlanets);
  }

  // Обработчики событий
  function setupEventHandlers() {
    // Закрытие карточки
    if (closeCard) {
      closeCard.addEventListener('click', () => {
        if (infoCard) infoCard.style.display = 'none';
        planets.forEach(p => p.classList.remove('active'));
        
        if (isPaused) {
          const pauseDuration = Date.now() - pausedTime;
          planetObjects.forEach(obj => {
            obj.startTime += pauseDuration;
          });
          isPaused = false;
        }
        lastInteractionTime = Date.now();
      });
    }

    // Кнопка "Подробнее" - ИСПРАВЛЕННАЯ ССЫЛКА
    if (moreDetails) {
      moreDetails.addEventListener('click', () => {
        const activePlanet = document.querySelector('.new_planetary_planet.active');
        if (!activePlanet) return;
        
        const id = activePlanet.getAttribute('data-id');
        let planetData = planetsData.find(p => p.id == id || p.startup_id == id);
        
        if (!planetData) {
          const index = [...planets].indexOf(activePlanet);
          planetData = planetsData[index];
        }
        
        const startupId = planetData && (planetData.startup_id || planetData.id);
        if (startupId) {
          window.location.href = `/startups/${startupId}/`;
        } else {
          console.warn('[NewPlanetary] Не удалось найти ID стартапа для перехода');
          // Fallback - переход на список стартапов
          window.location.href = '/startups/';
        }
      });
    }

    // Кнопка "Все стартапы"
    if (allStartupsBtn) {
      allStartupsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/startups/';
      });
    }

    // Управление камерой (drag & zoom)
    setupCameraControls();
    
    // Обработчики категорий
    setupCategoryHandlers();
  }

  // Управление камерой
  function setupCameraControls() {
    if (!solarSystem || !scene) return;

    // Mouse drag
    solarSystem.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      solarSystem.classList.add('dragging');
      lastInteractionTime = Date.now();
      isReturningToCenter = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      offsetX += deltaX;
      offsetY += deltaY;
      
      // Ограничиваем перемещение
      offsetX = Math.max(-window.innerWidth/2, Math.min(window.innerWidth/2, offsetX));
      offsetY = Math.max(-window.innerHeight/2, Math.min(window.innerHeight/2, offsetY));
      
      updateSceneTransform();
      
      startX = e.clientX;
      startY = e.clientY;
      lastInteractionTime = Date.now();
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      solarSystem.classList.remove('dragging');
      lastInteractionTime = Date.now();
    });

    // Mouse wheel для зума
    solarSystem.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.5, Math.min(3, scale + delta));
      
      updateSceneTransform();
      lastInteractionTime = Date.now();
      isReturningToCenter = false;
    }, { passive: false });

    // Начальная трансформация
    updateSceneTransform();
  }

  // Обновление трансформации сцены
  function updateSceneTransform() {
    if (scene) {
      scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }
  }

  // Обработчики категорий
  function setupCategoryHandlers() {
    document.querySelectorAll('.new_planetary_galaxy_item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const categoryName = this.dataset.name;
        if (categoryName && categoryName !== selectedGalaxy) {
          // Используем правильный URL
          window.location.href = `${urls.planetarySystemBase || '/'}?direction=${encodeURIComponent(categoryName)}`;
        }
      });
    });
  }

  // Проверка неактивности и возврат к центру
  function checkInactivity() {
    const now = Date.now();
    if (now - lastInteractionTime >= inactivityTimeout && !isReturningToCenter && !isPaused) {
      isReturningToCenter = true;
      returnToCenter();
    }
  }

  // Возврат к центру
  function returnToCenter() {
    const duration = 2000;
    const startTime = Date.now();
    const startOffsetX = offsetX;
    const startOffsetY = offsetY;
    const startScale = scale;

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      offsetX = startOffsetX * (1 - easeProgress);
      offsetY = startOffsetY * (1 - easeProgress);
      scale = startScale + (1 - startScale) * easeProgress;

      updateSceneTransform();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isReturningToCenter = false;
      }
    }

    animate();
  }

  // Генерация дополнительных звезд
  function generateStars() {
    const starsContainer = document.querySelector('.new_planetary_stars');
    if (!starsContainer) return;

    // Создаем дополнительные слои звезд
    for (let layer = 0; layer < 3; layer++) {
      const starLayer = document.createElement('div');
      starLayer.className = 'new_planetary_star_layer';
      starLayer.style.position = 'absolute';
      starLayer.style.top = '0';
      starLayer.style.left = '0';
      starLayer.style.width = '100%';
      starLayer.style.height = '100%';
      starLayer.style.backgroundImage = 'radial-gradient(1px 1px at 50px 100px, rgba(255,255,255,0.5), transparent)';
      starLayer.style.backgroundRepeat = 'repeat';
      starLayer.style.backgroundSize = `${300 + layer * 200}px ${200 + layer * 100}px`;
      starLayer.style.animation = `new_planetary_star_scroll ${20 + layer * 10}s linear infinite`;
      starLayer.style.animationDirection = layer % 2 ? 'reverse' : 'normal';
      starsContainer.appendChild(starLayer);
    }
  }

  // Инициализация
  function init() {
    console.log('[NewPlanetary] Инициализация новой планетарной системы');
    
    // Генерируем дополнительные звезды
    generateStars();
    
    // Инициализируем планеты
    initializePlanets();
    
    // Настраиваем обработчики
    setupEventHandlers();
    
    // Запускаем анимацию
    updatePlanets();
    
    // Запускаем проверку неактивности
    setInterval(checkInactivity, 1000);
    
    console.log('[NewPlanetary] Новая планетарная система инициализирована');
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); 