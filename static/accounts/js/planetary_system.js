// УЛЬТРА НОВАЯ ПЛАНЕТАРНАЯ СИСТЕМА - РАБОЧАЯ ВЕРСИЯ ИЗ ДЕМО
// Планеты движутся по орбитам, всегда повернуты к камере

(function() {
  'use strict';

  // ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
  let ultraNewPlanetaryStartupsData = [];
  let ultraNewPlanetaryDirectionsData = [];
  let ultraNewPlanetarySelectedGalaxy = '';
  let ultraNewPlanetaryCurrentGalaxyIndex = 0;
  let ultraNewPlanetaryAnimationId = null;
  let ultraNewPlanetaryMouseX = 0;
  let ultraNewPlanetaryMouseY = 0;
  let ultraNewPlanetaryDragSpeed = 0.001;
  let ultraNewPlanetaryUrls = {};
  let ultraNewPlanetaryIsAuthenticated = false;
  let ultraNewPlanetaryIsStartuper = false;
  let ultraNewPlanetaryLogoImage = '';
  let ultraNewPlanetaryFallbackImages = {
    round: [
      'https://placehold.co/100x100/FF6B6B/FFFFFF?text=P1',
      'https://placehold.co/100x100/4ECDC4/FFFFFF?text=P2',
      'https://placehold.co/100x100/45B7D1/FFFFFF?text=P3',
      'https://placehold.co/100x100/96CEB4/FFFFFF?text=P4',
      'https://placehold.co/100x100/FECA57/FFFFFF?text=P5',
      'https://placehold.co/100x100/FF9FF3/FFFFFF?text=P6'
    ]
  };

  // ПЕРЕМЕННЫЕ ДЛЯ ИНТЕРАКТИВНОСТИ ГАЛАКТИКИ
  let ultraNewPlanetaryGalaxyScale = 1;
  let ultraNewPlanetaryGalaxyX = 0;
  let ultraNewPlanetaryGalaxyY = 0;
  let ultraNewPlanetaryIsDragging = false;
  let ultraNewPlanetaryLastMouseX = 0;
  let ultraNewPlanetaryLastMouseY = 0;
  
  // ЛИМИТЫ ДЛЯ ИНТЕРАКТИВНОСТИ
  const ultraNewPlanetaryMinScale = 0.3;
  const ultraNewPlanetaryMaxScale = 2.5;
  const ultraNewPlanetaryMaxOffset = 500;

  // ПЕРЕМЕННЫЕ ДЛЯ КАТЕГОРИЙ
  let ultraNewPlanetaryCategoriesVisible = 0; // Индекс первой видимой категории
  let ultraNewPlanetaryCategoriesTotal = 0; // Общее количество категорий
  const ultraNewPlanetaryCategoriesPerPage = 7; // Показываем 7 категорий

  // ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ DOM
  document.addEventListener('DOMContentLoaded', function() {
    initializeUltraNewPlanetarySystem();
  });

  // ОСНОВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ
  function initializeUltraNewPlanetarySystem() {
    try {
      loadUltraNewPlanetarySystemData();
      loadUltraNewPlanetaryFallbackImages();
      setupUltraNewPlanetarySystem();
      startUltraNewPlanetaryAnimation();
    } catch (error) {
      console.warn('Ultra New Planetary System initialization error:', error);
    }
  }

  // ЗАГРУЗКА ДАННЫХ ИЗ HTML
  function loadUltraNewPlanetarySystemData() {
    const scriptElement = document.getElementById('planetary-system-data');
    if (scriptElement) {
      const data = JSON.parse(scriptElement.textContent);
      ultraNewPlanetaryStartupsData = data.planetsData || [];
      ultraNewPlanetaryDirectionsData = data.directionsData || [];
      ultraNewPlanetarySelectedGalaxy = data.selectedGalaxy || '';
      ultraNewPlanetaryUrls = data.urls || {};
      ultraNewPlanetaryIsAuthenticated = data.isAuthenticated || false;
      ultraNewPlanetaryIsStartuper = data.isStartuper || false;
      ultraNewPlanetaryLogoImage = data.logoImage || '';
      

    }
  }

  // ЗАГРУЗКА РЕЗЕРВНЫХ ИЗОБРАЖЕНИЙ
  function loadUltraNewPlanetaryFallbackImages() {
    const fallbackScript = document.getElementById('ultra_new_planetary_fallback_images');
    if (fallbackScript) {
      try {
        ultraNewPlanetaryFallbackImages = JSON.parse(fallbackScript.textContent);
      } catch (error) {
        console.warn('Fallback images loading error:', error);
      }
    }
  }

  // НАСТРОЙКА ПЛАНЕТАРНОЙ СИСТЕМЫ
  function setupUltraNewPlanetarySystem() {
    const container = document.querySelector('.ultra_new_planetary_system_wrapper');
    if (!container) return;

    setupUltraNewPlanetaryMouseEvents();
    setupUltraNewPlanetaryControls();
    setupUltraNewPlanetaryGalaxySelector();
    loadUltraNewPlanetaryGalaxy();
  }

  // НАСТРОЙКА СОБЫТИЙ МЫШИ
  function setupUltraNewPlanetaryMouseEvents() {
    const solarSystem = document.getElementById('ultra_new_planetary_solar_system');
    if (!solarSystem) return;

    // Обычное отслеживание мыши
    solarSystem.addEventListener('mousemove', function(e) {
      const rect = solarSystem.getBoundingClientRect();
      ultraNewPlanetaryMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ultraNewPlanetaryMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      // Перетаскивание галактики
      if (ultraNewPlanetaryIsDragging) {
        const deltaX = e.clientX - ultraNewPlanetaryLastMouseX;
        const deltaY = e.clientY - ultraNewPlanetaryLastMouseY;
        
        ultraNewPlanetaryGalaxyX += deltaX;
        ultraNewPlanetaryGalaxyY += deltaY;
        
        // Ограничиваем перемещение
        ultraNewPlanetaryGalaxyX = Math.max(-ultraNewPlanetaryMaxOffset, Math.min(ultraNewPlanetaryMaxOffset, ultraNewPlanetaryGalaxyX));
        ultraNewPlanetaryGalaxyY = Math.max(-ultraNewPlanetaryMaxOffset, Math.min(ultraNewPlanetaryMaxOffset, ultraNewPlanetaryGalaxyY));
        
        updateUltraNewPlanetaryGalaxyTransform();
        
        ultraNewPlanetaryLastMouseX = e.clientX;
        ultraNewPlanetaryLastMouseY = e.clientY;
      }
    });

    // Начало перетаскивания (только не на планетах)
    solarSystem.addEventListener('mousedown', function(e) {
      // Проверяем, что клик не по планете
      if (e.target.classList.contains('ultra_new_planetary_planet')) {
        return; // Не запускаем драг если кликнули по планете
      }
      
      ultraNewPlanetaryIsDragging = true;
      ultraNewPlanetaryLastMouseX = e.clientX;
      ultraNewPlanetaryLastMouseY = e.clientY;
      solarSystem.style.cursor = 'grabbing';
      e.preventDefault();
    });

    // Окончание перетаскивания
    document.addEventListener('mouseup', function() {
      if (ultraNewPlanetaryIsDragging) {
        ultraNewPlanetaryIsDragging = false;
        solarSystem.style.cursor = 'grab';
      }
    });

    // Зум колесом мыши
    solarSystem.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      const zoomSpeed = 0.1;
      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      
      ultraNewPlanetaryGalaxyScale += delta;
      ultraNewPlanetaryGalaxyScale = Math.max(ultraNewPlanetaryMinScale, Math.min(ultraNewPlanetaryMaxScale, ultraNewPlanetaryGalaxyScale));
      
      updateUltraNewPlanetaryGalaxyTransform();
    });

    // Сброс при двойном клике
    solarSystem.addEventListener('dblclick', function(e) {
      e.preventDefault();
      resetUltraNewPlanetaryGalaxyTransform();
    });
  }

  // ОБНОВЛЕНИЕ ТРАНСФОРМАЦИИ ГАЛАКТИКИ
  function updateUltraNewPlanetaryGalaxyTransform() {
    const galaxy = document.getElementById('ultra_new_planetary_galaxy');
    if (!galaxy) return;

    galaxy.style.setProperty('--ultra_new_planetary_galaxy_scale', ultraNewPlanetaryGalaxyScale);
    galaxy.style.setProperty('--ultra_new_planetary_galaxy_x', ultraNewPlanetaryGalaxyX + 'px');
    galaxy.style.setProperty('--ultra_new_planetary_galaxy_y', ultraNewPlanetaryGalaxyY + 'px');
  }

  // СБРОС ТРАНСФОРМАЦИИ ГАЛАКТИКИ
  function resetUltraNewPlanetaryGalaxyTransform() {
    ultraNewPlanetaryGalaxyScale = 1;
    ultraNewPlanetaryGalaxyX = 0;
    ultraNewPlanetaryGalaxyY = 0;
    updateUltraNewPlanetaryGalaxyTransform();
  }

  // НАСТРОЙКА ЭЛЕМЕНТОВ УПРАВЛЕНИЯ
  function setupUltraNewPlanetaryControls() {
    // Кнопка полноэкранного режима
    const fullscreenBtn = document.getElementById('ultra_new_planetary_fullscreen_btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', toggleUltraNewPlanetaryFullscreen);
    }

    // Кнопка "Все стартапы"
    const allStartupsBtn = document.querySelector('.ultra_new_planetary_all_startups_button');
    if (allStartupsBtn) {
      allStartupsBtn.addEventListener('click', function() {
        window.location.href = '/startups/';
      });
    }

    // Кнопки навигации категорий
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        changeUltraNewPlanetaryCategory(-1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        changeUltraNewPlanetaryCategory(1);
      });
    }

    // Закрытие модального окна
    const modalClose = document.getElementById('ultra_new_planetary_modal_close');
    const modal = document.getElementById('ultra_new_planetary_modal');

    if (modalClose) {
      modalClose.addEventListener('click', hideUltraNewPlanetaryModal);
    }

    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          hideUltraNewPlanetaryModal();
        }
      });
    }

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideUltraNewPlanetaryModal();
      }
    });
  }

  // НАСТРОЙКА СЕЛЕКТОРА ГАЛАКТИК
  function setupUltraNewPlanetaryGalaxySelector() {
    const galaxyItems = document.querySelectorAll('.ultra_new_planetary_galaxy_item');
    galaxyItems.forEach(function(item) {
      item.addEventListener('click', function() {
        const galaxyName = this.getAttribute('data-name');
        selectUltraNewPlanetaryGalaxy(galaxyName);
      });
    });
    
    // Инициализируем отображение категорий
    const allCategories = document.querySelectorAll('.ultra_new_planetary_galaxy_item');
    ultraNewPlanetaryCategoriesTotal = allCategories.length;
    updateUltraNewPlanetaryCategoriesDisplay();
  }

  // ВЫБОР ГАЛАКТИКИ
  function selectUltraNewPlanetaryGalaxy(galaxyName) {
    ultraNewPlanetarySelectedGalaxy = galaxyName;
    updateUltraNewPlanetaryGalaxyUI();
    
    // Перезагружаем страницу с фильтром категории
    const currentUrl = new URL(window.location);
    if (galaxyName && galaxyName !== 'Все') {
      currentUrl.searchParams.set('direction', galaxyName);
    } else {
      currentUrl.searchParams.delete('direction');
    }
    window.location.href = currentUrl.toString();
  }

  // ОБНОВЛЕНИЕ UI СЕЛЕКТОРА ГАЛАКТИК
  function updateUltraNewPlanetaryGalaxyUI() {
    const galaxyItems = document.querySelectorAll('.ultra_new_planetary_galaxy_item');
    galaxyItems.forEach(function(item) {
      if (item.getAttribute('data-name') === ultraNewPlanetarySelectedGalaxy) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  // СМЕНА ГАЛАКТИКИ НАВИГАЦИОННЫМИ КНОПКАМИ
  function changeUltraNewPlanetaryGalaxy(direction) {
    if (ultraNewPlanetaryDirectionsData.length === 0) return;

    ultraNewPlanetaryCurrentGalaxyIndex += direction;
    
    if (ultraNewPlanetaryCurrentGalaxyIndex >= ultraNewPlanetaryDirectionsData.length) {
      ultraNewPlanetaryCurrentGalaxyIndex = 0;
    } else if (ultraNewPlanetaryCurrentGalaxyIndex < 0) {
      ultraNewPlanetaryCurrentGalaxyIndex = ultraNewPlanetaryDirectionsData.length - 1;
    }

    const newGalaxy = ultraNewPlanetaryDirectionsData[ultraNewPlanetaryCurrentGalaxyIndex];
    if (newGalaxy) {
      selectUltraNewPlanetaryGalaxy(newGalaxy.direction_name);
    }
  }

  // ЗАГРУЗКА ГАЛАКТИКИ
  function loadUltraNewPlanetaryGalaxy() {
    // Используем данные из Django views
    const currentStartups = ultraNewPlanetaryStartupsData || [];
    

    
    updateUltraNewPlanetaryPlanets(currentStartups);
    startUltraNewPlanetaryAnimation();
  }

  // ОБНОВЛЕНИЕ ПЛАНЕТ
  function updateUltraNewPlanetaryPlanets(startups) {
    const planets = document.querySelectorAll('.ultra_new_planetary_planet');
    
    planets.forEach(function(planet, index) {
      // Сначала очищаем все обработчики и данные
      const cleanPlanet = clearUltraNewPlanetaryPlanetData(planet);
      
      const startup = startups[index];
      if (startup && startup.id) {
        setupUltraNewPlanetaryPlanet(cleanPlanet, startup, index);
      } else {
        setupUltraNewPlanetaryEmptyPlanet(cleanPlanet, index);
      }
    });
    
    // ИНИЦИАЛИЗАЦИЯ ПЛАНЕТАРНЫХ ОБЪЕКТОВ КАК В V8.HTML
    initializeUltraNewPlanetaryObjects();
  }

  // ОЧИСТКА ДАННЫХ ПЛАНЕТЫ
  function clearUltraNewPlanetaryPlanetData(planet) {
    // Клонируем элемент для удаления всех обработчиков
    const newPlanet = planet.cloneNode(true);
    planet.parentNode.replaceChild(newPlanet, planet);
    
    // Удаляем данные
    newPlanet.removeAttribute('data-startup-id');
    newPlanet.removeAttribute('data-startup-data');
    
    return newPlanet;
  }

  // НАСТРОЙКА ПЛАНЕТЫ С ДАННЫМИ
  function setupUltraNewPlanetaryPlanet(planet, startup, index) {
    if (!planet || !startup) return;

    // Установка изображения
    const imageUrl = startup.planet_image || getUltraNewPlanetaryFallbackImage(index);
    planet.style.backgroundImage = `url(${imageUrl})`;
    
    // Установка данных
    planet.setAttribute('data-startup-id', startup.id || 0);
    planet.setAttribute('data-startup-name', startup.name || 'Пустая орбита');
    planet.setAttribute('data-startup-data', JSON.stringify(startup));
    
    // Обработчик клика
    planet.addEventListener('click', function() {
      showUltraNewPlanetaryModal(startup, imageUrl);
    });
    
    // Стили для активной планеты
    planet.style.cursor = 'pointer';
    planet.style.opacity = '1';
  }

  // НАСТРОЙКА ПУСТОЙ ПЛАНЕТЫ
  function setupUltraNewPlanetaryEmptyPlanet(planet, index) {
    if (!planet) return;

    // Установка изображения-заглушки
    const imageUrl = getUltraNewPlanetaryFallbackImage(index);
    planet.style.backgroundImage = `url(${imageUrl})`;
    
    // Установка данных по умолчанию
    const emptyStartup = {
      id: 0,
      name: 'Свободная орбита',
      description: 'Эта орбита пока свободна. Здесь может появиться ваш стартап!',
      rating: '0',
      voters_count: '0',
      comment_count: '0',
      direction: 'Не определена',
      funding_goal: 'Не определена',
      valuation: 'Не определена',
      investors: '0',
      progress: 0
    };
    
    planet.setAttribute('data-startup-id', '0');
    planet.setAttribute('data-startup-name', 'Свободная орбита');
    planet.setAttribute('data-startup-data', JSON.stringify(emptyStartup));
    
    // Обработчик клика для пустой планеты
    planet.addEventListener('click', function() {
      showUltraNewPlanetaryModal(emptyStartup, imageUrl);
    });
    
    // Стили для неактивной планеты
    planet.style.cursor = 'pointer';
    planet.style.opacity = '0.6';
  }

  // ПОЛУЧЕНИЕ РЕЗЕРВНОГО ИЗОБРАЖЕНИЯ
  function getUltraNewPlanetaryFallbackImage(index) {
    const images = ultraNewPlanetaryFallbackImages.round || [];
    return images[index % images.length] || 'https://placehold.co/100x100/333/FFF?text=P';
  }

  // ПОКАЗ МОДАЛЬНОГО ОКНА
  function showUltraNewPlanetaryModal(startup, planetImageUrl) {
    const modal = document.getElementById('ultra_new_planetary_modal');
    if (!modal) return;

    // Заполнение данных
    const nameElement = document.getElementById('ultra_new_planetary_modal_name');
    const ratingElement = document.getElementById('ultra_new_planetary_modal_rating');
    const commentsElement = document.getElementById('ultra_new_planetary_modal_comments_count');
    const categoryElement = document.getElementById('ultra_new_planetary_modal_category');
    const progressElement = document.getElementById('ultra_new_planetary_modal_progress');
    const descriptionElement = document.getElementById('ultra_new_planetary_modal_description');
    const fundingAmountElement = document.getElementById('ultra_new_planetary_modal_funding_amount');
    const valuationAmountElement = document.getElementById('ultra_new_planetary_modal_valuation_amount');
    const investorsCountElement = document.getElementById('ultra_new_planetary_modal_investors_count');
    const planetImageElement = document.getElementById('ultra_new_planetary_modal_planet_img');
    const detailsBtn = document.getElementById('ultra_new_planetary_modal_details_btn');
    const investmentBtn = document.getElementById('ultra_new_planetary_modal_investment_btn');

    // Заполнение текстовых данных
    if (nameElement) nameElement.textContent = startup.name || 'Без названия';
    if (ratingElement) ratingElement.textContent = `Рейтинг ${startup.rating || '0'}/5 (${startup.voters_count || '0'})`;
    if (commentsElement) commentsElement.textContent = startup.comment_count || '0';
    if (categoryElement) categoryElement.textContent = startup.direction || 'Не указана';
    if (descriptionElement) descriptionElement.textContent = startup.description || 'Описание отсутствует';
    if (fundingAmountElement) fundingAmountElement.textContent = startup.funding_goal || 'Не определена';
    if (valuationAmountElement) valuationAmountElement.textContent = startup.valuation || 'Не определена';
    if (investorsCountElement) investorsCountElement.textContent = `Инвестировало (${startup.investors || '0'})`;

    // Установка изображения планеты
    if (planetImageElement) {
      planetImageElement.src = planetImageUrl || getUltraNewPlanetaryFallbackImage(0);
    }

    // Прогресс-бар
    if (progressElement) {
      const progressPercent = startup.progress || 0;
      progressElement.style.background = `linear-gradient(90deg, #31D2C6 0%, #31D2C6 ${progressPercent}%, #E0E0E0 ${progressPercent}%, #E0E0E0 100%)`;
    }

    // Кнопка "Подробнее"
    if (detailsBtn) {
      detailsBtn.onclick = function() {
        if (startup.id && startup.id !== 0) {
          window.location.href = `/startups/${startup.id}/`;
        } else {
          // Для пустых орбит показываем сообщение
          alert('Эта орбита пока свободна. Здесь пока нет стартапа для просмотра.');
        }
      };
    }

    // Кнопка инвестирования
    if (investmentBtn) {
      investmentBtn.onclick = function() {
        if (startup.id && startup.id !== 0) {
          window.location.href = `/invest/${startup.id}/`;
        } else {
          // Для пустых орбит показываем сообщение
          alert('Эта орбита пока свободна. Здесь пока нет стартапа для инвестирования.');
        }
      };
    }

    // Показ модального окна
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
  }

  // СКРЫТИЕ МОДАЛЬНОГО ОКНА
  function hideUltraNewPlanetaryModal() {
    const modal = document.getElementById('ultra_new_planetary_modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Возвращаем скролл страницы
    }
  }

  // ПОЛНОЭКРАННЫЙ РЕЖИМ
  function toggleUltraNewPlanetaryFullscreen() {
    const container = document.querySelector('.ultra_new_planetary_system_wrapper');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(function(err) {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // АНИМАЦИЯ ПЛАНЕТ
  function startUltraNewPlanetaryAnimation() {
    function animate() {
      updateUltraNewPlanetaryPlanetsPosition();
      ultraNewPlanetaryAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  // ОСТАНОВКА АНИМАЦИИ
  function stopUltraNewPlanetaryAnimation() {
    if (ultraNewPlanetaryAnimationId) {
      cancelAnimationFrame(ultraNewPlanetaryAnimationId);
      ultraNewPlanetaryAnimationId = null;
    }
  }

  // ОЧИСТКА ПРИ ВЫГРУЗКЕ СТРАНИЦЫ
  window.addEventListener('beforeunload', function() {
    stopUltraNewPlanetaryAnimation();
  });

  // СМЕНА КАТЕГОРИИ НАВИГАЦИОННЫМИ КНОПКАМИ
  function changeUltraNewPlanetaryCategory(direction) {
    // Получаем все элементы категорий
    const visibleCategories = document.querySelectorAll('#ultra_new_planetary_galaxy_list .ultra_new_planetary_galaxy_item:not(.ultra_new_planetary_hidden_categories .ultra_new_planetary_galaxy_item)');
    const hiddenCategories = document.querySelectorAll('.ultra_new_planetary_hidden_categories .ultra_new_planetary_galaxy_item');
    const allCategories = [...visibleCategories, ...hiddenCategories];
    
    if (allCategories.length === 0) return;

    // Обновляем индекс
    ultraNewPlanetaryCategoriesVisible += direction;
    
    // Проверяем границы
    const maxVisible = Math.max(0, allCategories.length - ultraNewPlanetaryCategoriesPerPage);
    if (ultraNewPlanetaryCategoriesVisible < 0) {
      ultraNewPlanetaryCategoriesVisible = 0;
    } else if (ultraNewPlanetaryCategoriesVisible > maxVisible) {
      ultraNewPlanetaryCategoriesVisible = maxVisible;
    }
    
    // Обновляем отображение категорий
    updateUltraNewPlanetaryCategoriesDisplay();
  }

  // ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ КАТЕГОРИЙ
  function updateUltraNewPlanetaryCategoriesDisplay() {
    const galaxyList = document.getElementById('ultra_new_planetary_galaxy_list');
    const hiddenContainer = document.querySelector('.ultra_new_planetary_hidden_categories');
    
    if (!galaxyList || !hiddenContainer) return;
    
    // Получаем все категории
    const visibleCategories = document.querySelectorAll('#ultra_new_planetary_galaxy_list .ultra_new_planetary_galaxy_item:not(.ultra_new_planetary_hidden_categories .ultra_new_planetary_galaxy_item)');
    const hiddenCategories = document.querySelectorAll('.ultra_new_planetary_hidden_categories .ultra_new_planetary_galaxy_item');
    const allCategories = [...visibleCategories, ...hiddenCategories];
    
    // Очищаем видимый контейнер (кроме скрытого)
    visibleCategories.forEach(cat => cat.remove());
    
    // Показываем нужные категории
    for (let i = ultraNewPlanetaryCategoriesVisible; i < ultraNewPlanetaryCategoriesVisible + ultraNewPlanetaryCategoriesPerPage && i < allCategories.length; i++) {
      const categoryClone = allCategories[i].cloneNode(true);
      
      // Добавляем обработчик клика
      categoryClone.addEventListener('click', function() {
        const galaxyName = this.getAttribute('data-name');
        selectUltraNewPlanetaryGalaxy(galaxyName);
      });
      
      galaxyList.insertBefore(categoryClone, hiddenContainer);
    }
  }

  // ПЛАНЕТАРНЫЕ ОБЪЕКТЫ ДЛЯ СИСТЕМЫ КАК В V8.HTML
  let ultraNewPlanetaryObjects = [];

  // ИНИЦИАЛИЗАЦИЯ ПЛАНЕТАРНЫХ ОБЪЕКТОВ КАК В V8.HTML
  function initializeUltraNewPlanetaryObjects() {
    const planets = document.querySelectorAll('.ultra_new_planetary_planet');
    ultraNewPlanetaryObjects = [];
    
    planets.forEach((planet, index) => {
      const orbit = planet.closest('.ultra_new_planetary_orbit');
      const planetOrientation = planet.closest('.ultra_new_planetary_planet_orientation');
      
      if (!orbit || !planetOrientation) return;
      
      // Параметры орбиты
      const orbitSize = parseFloat(orbit.style.getPropertyValue('--orbit-size')) || 200;
      const orbitTime = parseFloat(orbit.style.getPropertyValue('--orbit-time')) || 80;
      
      // Генерируем случайный начальный угол и скорость для каждой планеты КАК В V8.HTML
      const initialAngle = Math.random() * 360;
      const speedFactor = 0.8 + Math.random() * 0.4;
      
      // Сохраняем данные о планете
      ultraNewPlanetaryObjects.push({
        element: planet,
        orientation: planetOrientation,
        orbit: orbit,
        orbitSize: orbitSize,
        orbitTime: orbitTime,
        angle: initialAngle,
        speedFactor: speedFactor,
        startTime: Date.now() - Math.random() * orbitTime * 1000 // Рандомизируем начальные позиции
      });
    });
  }

  // ОБНОВЛЕНИЕ ПОЗИЦИЙ ПЛАНЕТ ТОЧНО КАК В V8.HTML
  function updateUltraNewPlanetaryPlanetsPosition() {
    const now = Date.now();
    
    ultraNewPlanetaryObjects.forEach((planetObj, index) => {
      if (!planetObj.orientation || !planetObj.element) return;
      
      // ТОЧНО КАК В V8.HTML - система времени
      const elapsedSeconds = (now - planetObj.startTime) / 1000;
      const orbitTimeSeconds = planetObj.orbitTime * planetObj.speedFactor;
      const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
      const angle = planetObj.angle + progress * 360; // в градусах
      const angleRad = angle * Math.PI / 180; // в радианах
      
      // Вычисляем позицию на орбите
      const radius = planetObj.orbitSize / 2;
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius;
      
      // Устанавливаем положение планеты на орбите ТОЧНО КАК В V8.HTML
      planetObj.orientation.style.left = `${50 + 50 * (x / radius)}%`;
      planetObj.orientation.style.top = `${50 + 50 * (y / radius)}%`;
      

    });
  }

})();