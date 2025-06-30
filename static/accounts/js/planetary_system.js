// Планетарная система - 2D версия
// Планеты всегда смотрят в камеру без наклона

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

  // Инициализация планет
  function initializePlanets() {
    // Счетчики для равномерного распределения планет по орбитам
    const orbitCounters = new Map();
    const orbitBaseAngles = new Map();

    planets.forEach((planet, index) => {
      const orbit = planet.closest('.orbit');
      const planetOrientation = planet.closest('.planet-orientation');
      
      if (!orbit || !planetOrientation) {
        console.warn(`[Planetary] Орбита или ориентация не найдены для планеты ${index}`);
        return;
      }

      // Получаем размеры орбиты
      const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size')) || 
                       parseFloat(getComputedStyle(orbit).width) || 300;
      const orbitTime = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-time')) || 60;

      // Равномерное распределение планет по орбите
      if (!orbitCounters.has(orbit)) {
        orbitCounters.set(orbit, 0);
        orbitBaseAngles.set(orbit, Math.random() * 360);
      }

      const planetIndex = orbitCounters.get(orbit);
      orbitCounters.set(orbit, planetIndex + 1);
      
      const planetsInOrbit = orbit.querySelectorAll('.planet-orientation').length;
      const baseAngle = orbitBaseAngles.get(orbit);
      const angleOffset = (360 / planetsInOrbit) * planetIndex;
      const initialAngle = baseAngle + angleOffset;

      // Случайная скорость
      const speedFactor = 0.8 + Math.random() * 0.4;

      // Установка изображения планеты
      setupPlanetImage(planet, index);

      // Обработчик клика
      setupPlanetClick(planet, index);

      // Случайный размер планеты
      const planetSize = 50 + Math.random() * 40; // 50-90px
      planet.style.setProperty('--planet-size', `${planetSize}px`);

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
    });

    console.log(`[Planetary] Инициализировано ${planetObjects.length} планет`);
  }

  // Настройка изображения планеты
  function setupPlanetImage(planet, index) {
    const id = planet.getAttribute('data-id');
    let planetData = planetsData.find(p => p.id == id);
    
    if (!planetData && planetsData[index]) {
      planetData = planetsData[index];
    }

    if (planetData && planetData.image) {
      planet.style.backgroundImage = `url('${planetData.image}')`;
    } else {
      // Fallback изображение
      const useRing = Math.random() < 0.3;
      const imageArray = useRing ? fallbackImages.ring : fallbackImages.round;
      
      if (imageArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * imageArray.length);
        planet.style.backgroundImage = `url('${imageArray[randomIndex]}')`;
      }
    }

    // Установка атрибута направления
    if (planetData && planetData.direction) {
      planet.dataset.direction = planetData.direction;
    }
  }

  // Обработчик клика по планете
  function setupPlanetClick(planet, index) {
    planet.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const id = planet.getAttribute('data-id');
      let planetData = planetsData.find(p => p.id == id);
      
      if (!planetData && planetsData[index]) {
        planetData = planetsData[index];
      }

      // Заполняем карточку данными
      if (planetData) {
        fillInfoCard(planetData, planet);
      } else {
        fillInfoCardFallback(planet);
      }

      // Активируем планету
      planets.forEach(p => p.classList.remove('active'));
      planet.classList.add('active');
      
      // Показываем карточку
      if (infoCard) {
        infoCard.style.display = 'block';
      }

      // Ставим анимацию на паузу
      isPaused = true;
      pausedTime = Date.now();
      lastInteractionTime = Date.now();
    });
  }

  // Заполнение карточки данными
  function fillInfoCard(planetData, planet) {
    if (planetImage) {
      const bg = getComputedStyle(planet).backgroundImage;
      planetImage.style.backgroundImage = bg !== 'none' ? bg : `url('${planetData.image}')`;
    }
    
    if (startupName) startupName.textContent = planetData.name || 'Название не указано';
    if (startupRating) startupRating.textContent = `Рейтинг ${planetData.rating || '0'}/5`;
    if (startupProgress) startupProgress.textContent = planetData.progress || '0%';
    if (startupFunding) startupFunding.textContent = `Цель: ${planetData.funding_goal || 'Не указана'}`;
    if (startupInvestors) startupInvestors.textContent = `Инвесторов: ${planetData.investors || 0}`;
    if (startupDescription) startupDescription.textContent = planetData.description || 'Описание не указано';
  }

  // Fallback заполнение карточки
  function fillInfoCardFallback(planet) {
    if (planetImage) {
      const bg = getComputedStyle(planet).backgroundImage;
      planetImage.style.backgroundImage = bg !== 'none' ? bg : 'linear-gradient(#3a7bd5,#3a6073)';
    }
    
    if (startupName) startupName.textContent = 'Скоро здесь будет стартап';
    if (startupRating) startupRating.textContent = '';
    if (startupProgress) startupProgress.textContent = '';
    if (startupFunding) startupFunding.textContent = '';
    if (startupInvestors) startupInvestors.textContent = '';
    if (startupDescription) startupDescription.textContent = 'Ожидаем загрузку данных...';
  }

  // Основная функция анимации планет
  function updatePlanets() {
    if (isPaused) {
      requestAnimationFrame(updatePlanets);
      return;
    }

    const now = Date.now();

    planetObjects.forEach(planetObj => {
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
      const radius = planetObj.orbitSize / 2;

      // Вычисляем позицию на орбите (2D без наклона)
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius;

      // Позиционируем планету относительно центра орбиты (плоская орбита)
      const leftPercent = 50 + (x / radius) * 50;
      const topPercent = 50 + (y / radius) * 50;

      planetObj.orientation.style.left = `${leftPercent}%`;
      planetObj.orientation.style.top = `${topPercent}%`;
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
        let planetData = planetsData.find(p => p.id == id);
        
        if (!planetData) {
          const index = [...planets].indexOf(activePlanet);
          planetData = planetsData[index];
        }
        
        if (planetData && planetData.startup_id) {
          window.location.href = `/startup/${planetData.startup_id}/`;
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
  }

  // Возврат к центру
  function returnToCenter() {
    const startOffsetX = offsetX;
    const startOffsetY = offsetY;
    const startScale = scale;
    const targetScale = 0.8;
    const duration = 2000;
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      offsetX = startOffsetX * (1 - easing);
      offsetY = startOffsetY * (1 - easing);
      scale = startScale + (targetScale - startScale) * easing;

      updateSceneTransform();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isReturningToCenter = false;
      }
    }

    animate();
  }

  // Генерация звёзд (опционально)
  function generateStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    // Удаляем существующие динамические звёзды
    starsContainer.querySelectorAll('.star').forEach(star => star.remove());

    // Создаём новые звёзды
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.position = 'absolute';
      star.style.width = '2px';
      star.style.height = '2px';
      star.style.backgroundColor = 'white';
      star.style.borderRadius = '50%';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.opacity = 0.3 + Math.random() * 0.7;
      star.style.animation = `twinkle ${2 + Math.random() * 3}s infinite`;
      
      starsContainer.appendChild(star);
    }
  }

  // Инициализация
  function init() {
    console.log('[Planetary] Инициализация планетарной системы...');
    
    initializePlanets();
    setupEventHandlers();
    generateStars();
    
    // Запускаем анимацию
    updatePlanets();
    
    // Запускаем проверку неактивности
    setInterval(checkInactivity, 1000);
    
    console.log('[Planetary] Планетарная система инициализирована');
  }

  // Стили для анимации мерцания звёзд
  if (!document.getElementById('planetary-star-styles')) {
    const style = document.createElement('style');
    style.id = 'planetary-star-styles';
    style.textContent = `
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Запускаем инициализацию после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); 