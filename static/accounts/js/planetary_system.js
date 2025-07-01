// Планетарная система - 2D версия с исправленным позиционированием
// Планеты круглые с изображениями, орбиты эллиптические

(function() {
  'use strict';

  // Поиск скрипта с данными
  const dataScript = document.getElementById('planetary-system-data')
                    || document.getElementById('planetary-data')
                    || document.getElementById('planetary-investments-data')
                    || document.getElementById('planetary-startups-data');

  if (!dataScript) {
    console.warn('[Planetary] JSON-скрипт с данными не найден');
    return;
  }

  let data;
  try {
    data = JSON.parse(dataScript.textContent);
  } catch (e) {
    console.error('[Planetary] Ошибка парсинга данных:', e);
    return;
  }

  // Извлекаем данные из разных возможных структур
  const planetsData = data.planetsData || data.planets || [];
  const directionsData = data.directionsData || data.directions || [];
  const selectedGalaxy = data.selectedGalaxy || '';
  const logoData = { image: data.logoImage || (data.logo ? data.logo.image : '') };
  const urls = data.urls || {};

  console.log('[Planetary] Загружены данные:', { planetsData, directionsData, selectedGalaxy });
  console.log('[Planetary] Количество планет:', planetsData.length);
  console.log('[Planetary] Первая планета:', planetsData[0]);
  console.log('[Planetary] Структура всех данных планет:', planetsData);

  // DOM элементы
  const planets = document.querySelectorAll('.planet');
  const orbits = document.querySelectorAll('.orbit');
  const infoCard = document.getElementById('info-card');
  const planetImage = document.getElementById('planet-image');
  const startupName = document.getElementById('startup-name');
  const startupRating = document.getElementById('startup-rating');
  const startupProgress = document.getElementById('startup-progress');
  const startupFunding = document.getElementById('startup-funding');
  const startupInvestors = document.getElementById('startup-investors');
  const startupDescription = document.getElementById('startup-description');
  const closeCard = document.getElementById('close-card');
  const moreDetails = document.getElementById('more-details');
  const solarSystem = document.getElementById('solar-system');
  const scene = document.getElementById('scene');
  const galaxy = document.getElementById('galaxy');
  const logoElement = document.getElementById('logo');
  const allStartupsBtn = document.querySelector('.all-startups-button');

  // Fallback изображения планет
  const fallbackScript = document.getElementById('planetary-fallback-images');
  let fallbackImages = { round: [], ring: [] };
  if (fallbackScript) {
    try {
      fallbackImages = JSON.parse(fallbackScript.textContent);
    } catch(e) {
      console.warn('[Planetary] Не удалось загрузить fallback изображения');
    }
  }

  // Настройка логотипа
  if (logoElement && logoData.image) {
    const sunText = logoElement.querySelector('.sun-text');
    if (sunText) {
      sunText.src = logoData.image;
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
  let scale = 0.8;

  // Инициализация планет - ИСПРАВЛЕННАЯ ВЕРСИЯ
  function initializePlanets() {
    planets.forEach((planet, index) => {
      const orbit = planet.closest('.orbit');
      const planetOrientation = planet.closest('.planet-orientation');
      
      if (!orbit || !planetOrientation) {
        console.warn(`[Planetary] Орбита или ориентация не найдены для планеты ${index}`);
        return;
      }

      // Получаем размеры из CSS
      const orbitSizeStr = getComputedStyle(orbit).getPropertyValue('--orbit-size').trim();
      const orbitTimeStr = getComputedStyle(orbit).getPropertyValue('--orbit-time').trim();
      const planetSizeStr = getComputedStyle(planet).getPropertyValue('--planet-size').trim();
      
      const orbitSize = parseFloat(orbitSizeStr.replace('px', '')) || 300;
      const orbitTime = parseFloat(orbitTimeStr.replace('s', '')) || 60;
      const planetSize = parseFloat(planetSizeStr.replace('px', '')) || 60;

      // Случайный начальный угол для каждой планеты
      const initialAngle = Math.random() * 360;

      // Варьируем скорость орбиты
      const speedFactor = 0.8 + Math.random() * 0.4;

      // Установка изображения планеты - ВОЗВРАЩАЕМ ИЗОБРАЖЕНИЯ
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
        initialAngle: initialAngle,
        speedFactor: speedFactor,
        startTime: Date.now(),
        size: planetSize
      });

      console.log(`[Planetary] Планета ${index}: орбита ${orbitSize}px, время ${orbitTime}s`);
    });

    console.log(`[Planetary] Инициализировано ${planetObjects.length} планет`);
  }

  // Настройка изображения планеты - ВОЗВРАЩАЕМ ИЗОБРАЖЕНИЯ
  function setupPlanetImage(planet, index) {
    const id = planet.getAttribute('data-id');
    let planetData = planetsData.find(p => p.id == id || p.startup_id == id);
    
    if (!planetData && planetsData[index]) {
      planetData = planetsData[index];
    }

    console.log(`[Planetary] Настройка планеты ${index}, ID: ${id}, данные:`, planetData);

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
      console.log(`[Planetary] Планета ${index}: установлено изображение ${planetImageUrl}`);
    } else {
      console.warn(`[Planetary] Планета ${index}: изображение не найдено`);
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

      console.log(`[Planetary] Клик по планете ${index}, ID: ${id}, найдены данные:`, planetData);

      // Заполняем карточку данными
      if (planetData && (planetData.name || planetData.startup_name)) {
        fillInfoCard(planetData, planet);
      } else {
        console.warn(`[Planetary] Данные не найдены для планеты ${index}, используем fallback`);
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

  // Заполнение карточки информации о стартапе
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

  // Обновление позиций планет - ТОЧНАЯ ПРИВЯЗКА К ОРБИТАМ
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

      // Вычисляем текущую позицию на орбите
      const elapsed = (now - planetObj.startTime) / 1000;
      const period = planetObj.orbitTime * planetObj.speedFactor;
      const progress = (elapsed % period) / period;
      const currentAngle = planetObj.initialAngle + (progress * 360);
      
      // Преобразуем в радианы
      const angleRad = (currentAngle * Math.PI) / 180;
      
      // ТОЧНЫЙ РАСЧЕТ РАДИУСА: 
      // Радиус должен быть точно равен половине размера орбиты минус половина размера планеты
      // чтобы центр планеты был на линии орбиты, а не край планеты
      const orbitRadius = planetObj.orbitSize / 2;
      const planetRadius = planetObj.size / 2;
      
      // Центр планеты должен быть на линии орбиты
      const effectiveRadius = orbitRadius;

      // Получаем коэффициент сжатия орбиты из CSS
      const orbitCompression = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--orbit-compression')) || 0.6;

      // Вычисляем позицию центра планеты точно на линии орбиты
      const x = Math.cos(angleRad) * effectiveRadius;
      const y = Math.sin(angleRad) * effectiveRadius * orbitCompression;

      // ТОЧНОЕ позиционирование: 
      // planet-orientation позиционирован в центре орбиты
      // Сдвигаем его так, чтобы центр планеты был точно на линии орбиты
      planetObj.orientation.style.transform = `translate(${x}px, ${y}px)`;
      
      // Отладочная информация для первой планеты
      if (index === 0 && Math.floor(elapsed) % 5 === 0) {
        console.log(`[Planetary] Планета ${index}: угол ${currentAngle.toFixed(1)}°, орбита ${orbitRadius}px, планета ${planetRadius}px, позиция (${x.toFixed(1)}px, ${y.toFixed(1)}px)`);
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

    // Кнопка "Подробнее"
    if (moreDetails) {
      moreDetails.addEventListener('click', () => {
        const activePlanet = document.querySelector('.planet.active');
        if (!activePlanet) return;
        
        const id = activePlanet.getAttribute('data-id');
        let planetData = planetsData.find(p => p.id == id || p.startup_id == id);
        
        if (!planetData) {
          const index = [...planets].indexOf(activePlanet);
          planetData = planetsData[index];
        }
        
        const startupId = planetData && (planetData.startup_id || planetData.id);
        if (startupId) {
          window.location.href = `/startup/${startupId}/`;
        } else {
          console.warn('[Planetary] Не удалось найти ID стартапа для перехода');
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
      solarSystem.style.cursor = 'grabbing';
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
      solarSystem.style.cursor = 'grab';
      lastInteractionTime = Date.now();
    });

    // Mouse wheel для зума
    solarSystem.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.3, Math.min(2.0, scale + delta));
      
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
    document.querySelectorAll('.galaxy-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const categoryName = this.dataset.name;
        if (categoryName && categoryName !== selectedGalaxy) {
          // Построение URL в зависимости от контекста
          let newUrl;
          if (urls.planetarySystemBase) {
            newUrl = `${urls.planetarySystemBase}?direction=${encodeURIComponent(categoryName)}`;
          } else {
            newUrl = `${window.location.pathname}?direction=${encodeURIComponent(categoryName)}`;
          }
          window.location.href = newUrl;
        }
      });
    });
  }

  // Проверка неактивности и возврат к центру
  function checkInactivity() {
    if (Date.now() - lastInteractionTime > inactivityTimeout && !isReturningToCenter && !isPaused) {
      isReturningToCenter = true;
      returnToCenter();
    }
    setTimeout(checkInactivity, 1000);
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
      scale = startScale + (0.8 - startScale) * easeProgress;

      updateSceneTransform();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isReturningToCenter = false;
      }
    }

    animate();
  }

  // Генерация звезд
  function generateStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    // Создаем дополнительные слои звезд
    for (let layer = 0; layer < 3; layer++) {
      const starLayer = document.createElement('div');
      starLayer.className = 'star-layer';
      starLayer.style.position = 'absolute';
      starLayer.style.top = '0';
      starLayer.style.left = '0';
      starLayer.style.width = '100%';
      starLayer.style.height = '100%';
      starLayer.style.backgroundImage = 'radial-gradient(1px 1px at 50px 100px, rgba(255,255,255,0.5), transparent)';
      starLayer.style.backgroundRepeat = 'repeat';
      starLayer.style.backgroundSize = `${300 + layer * 200}px ${200 + layer * 100}px`;
      starLayer.style.animation = `star-scroll ${20 + layer * 10}s linear infinite`;
      starLayer.style.animationDirection = layer % 2 ? 'reverse' : 'normal';
      starsContainer.appendChild(starLayer);
    }
  }

  // Инициализация
  function init() {
    console.log('[Planetary] Инициализация планетарной системы');
    
    // Генерируем звезды
    generateStars();
    
    // Инициализируем планеты
    initializePlanets();
    
    // Настраиваем обработчики
    setupEventHandlers();
    
    // Запускаем анимацию
    updatePlanets();
    
    // Запускаем проверку неактивности
    checkInactivity();
    
    console.log('[Planetary] Планетарная система инициализирована');
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); 