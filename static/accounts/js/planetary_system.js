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

    solarSystem.addEventListener('mousemove', function(e) {
      const rect = solarSystem.getBoundingClientRect();
      ultraNewPlanetaryMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ultraNewPlanetaryMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
  }

  // НАСТРОЙКА ЭЛЕМЕНТОВ УПРАВЛЕНИЯ
  function setupUltraNewPlanetaryControls() {
    // Кнопка "Все стартапы"
    const allStartupsBtn = document.querySelector('.ultra_new_planetary_all_startups_button');
    if (allStartupsBtn) {
      allStartupsBtn.addEventListener('click', function() {
        window.location.href = '/startups/';
      });
    }

    // Навигационные кнопки
    const leftBtn = document.getElementById('ultra_new_planetary_nav_left_btn');
    const rightBtn = document.getElementById('ultra_new_planetary_nav_right_btn');

    if (leftBtn) {
      leftBtn.addEventListener('click', function() {
        changeUltraNewPlanetaryGalaxy(-1);
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener('click', function() {
        changeUltraNewPlanetaryGalaxy(1);
      });
    }

    // Полноэкранная кнопка
    const fullscreenBtn = document.getElementById('ultra_new_planetary_fullscreen_btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', function() {
        toggleUltraNewPlanetaryFullscreen();
      });
    }

    // Закрытие модального окна
    const modalCloseBtn = document.getElementById('ultra_new_planetary_modal_close');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', function() {
        hideUltraNewPlanetaryModal();
      });
    }

    // Закрытие модального окна по клику на backdrop
    const modalBackdrop = document.querySelector('.ultra_new_planetary_modal_backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', function() {
        hideUltraNewPlanetaryModal();
      });
    }

    // Закрытие модального окна по ESC
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
  }

  // ВЫБОР ГАЛАКТИКИ
  function selectUltraNewPlanetaryGalaxy(galaxyName) {
    ultraNewPlanetarySelectedGalaxy = galaxyName;
    updateUltraNewPlanetaryGalaxyUI();
    loadUltraNewPlanetaryGalaxy();
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
    const currentStartups = ultraNewPlanetaryStartupsData.filter(function(startup) {
      return startup.direction === ultraNewPlanetarySelectedGalaxy;
    });

    updateUltraNewPlanetaryPlanets(currentStartups);
  }

  // ОБНОВЛЕНИЕ ПЛАНЕТ
  function updateUltraNewPlanetaryPlanets(startups) {
    const planets = document.querySelectorAll('.ultra_new_planetary_planet');
    
    planets.forEach(function(planet, index) {
      const startup = startups[index];
      if (startup) {
        setupUltraNewPlanetaryPlanet(planet, startup, index);
      } else {
        setupUltraNewPlanetaryEmptyPlanet(planet, index);
      }
    });
  }

  // НАСТРОЙКА ПЛАНЕТЫ СО СТАРТАПОМ
  function setupUltraNewPlanetaryPlanet(planet, startup, index) {
    // Установка изображения планеты
    const imageUrl = startup.planet_image_url || getUltraNewPlanetaryFallbackImage(index);
    planet.style.backgroundImage = `url(${imageUrl})`;
    
    // Сохранение данных стартапа
    planet.dataset.startupId = startup.id;
    planet.dataset.startupData = JSON.stringify(startup);
    
    // Обработчики событий
    planet.addEventListener('click', function() {
      showUltraNewPlanetaryModal(startup, imageUrl);
    });
    
    planet.addEventListener('dblclick', function() {
      const startupId = startup.id;
      if (startupId) {
        window.location.href = `/startups/${startupId}/`;
      }
    });
    
    planet.style.cursor = 'pointer';
    planet.style.opacity = '1';
  }

  // НАСТРОЙКА ПУСТОЙ ПЛАНЕТЫ
  function setupUltraNewPlanetaryEmptyPlanet(planet, index) {
    const imageUrl = getUltraNewPlanetaryFallbackImage(index);
    planet.style.backgroundImage = `url(${imageUrl})`;
    
    // Очистка данных стартапа
    planet.removeAttribute('data-startup-id');
    planet.removeAttribute('data-startup-data');
    
    // Удаляем старые обработчики
    const newPlanet = planet.cloneNode(true);
    planet.parentNode.replaceChild(newPlanet, planet);
    
    // Добавляем новый обработчик к новому элементу
    newPlanet.addEventListener('click', function() {
      if (ultraNewPlanetaryIsAuthenticated && ultraNewPlanetaryIsStartuper) {
        if (ultraNewPlanetaryUrls.createStartup) {
          window.location.href = ultraNewPlanetaryUrls.createStartup;
        }
      } else {
        if (ultraNewPlanetaryUrls.register) {
          window.location.href = ultraNewPlanetaryUrls.register;
        }
      }
    });
    
    newPlanet.style.cursor = 'pointer';
    newPlanet.style.opacity = '0.6';
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

    // Заполнение текстовых данных
    if (nameElement) nameElement.textContent = startup.title || 'Без названия';
    if (ratingElement) ratingElement.textContent = `Рейтинг ${startup.rating || '0'}/5 (${startup.rating_count || '0'})`;
    if (commentsElement) commentsElement.textContent = startup.comments_count || '0';
    if (categoryElement) categoryElement.textContent = startup.direction || 'Медицина';
    if (descriptionElement) descriptionElement.textContent = startup.short_description || 'Наш стартап разрабатывает инновационную платформу для телемедицины...';
    if (fundingAmountElement) fundingAmountElement.textContent = `${formatNumber(startup.funding_goal || 456768)} ₽`;
    if (valuationAmountElement) valuationAmountElement.textContent = `${formatNumber(startup.valuation || 567876)} ₽`;
    if (investorsCountElement) investorsCountElement.textContent = `Инвестировало (${startup.investors_count || '648'})`;

    // Установка изображения планеты
    if (planetImageElement) {
      planetImageElement.src = planetImageUrl || getUltraNewPlanetaryFallbackImage(0);
    }

    // Прогресс-бар (расчет процента финансирования)
    if (progressElement) {
      const currentFunding = startup.funding_current || 0;
      const goalFunding = startup.funding_goal || 1;
      const percentage = Math.min((currentFunding / goalFunding) * 100, 100);
      progressElement.style.background = `linear-gradient(90deg, #31D2C6 0%, #31D2C6 ${percentage}%, #E0E0E0 ${percentage}%, #E0E0E0 100%)`;
    }

    // Кнопка "Подробнее"
    if (detailsBtn) {
      detailsBtn.onclick = function() {
        if (startup.id) {
          window.location.href = `/startups/${startup.id}/`;
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

  // ФОРМАТИРОВАНИЕ ЧИСЕЛ
  function formatNumber(num) {
    return new Intl.NumberFormat('ru-RU').format(num);
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

  // ОБНОВЛЕНИЕ ПОЗИЦИЙ ПЛАНЕТ - РАБОЧАЯ ЛОГИКА ИЗ ДЕМО
  function updateUltraNewPlanetaryPlanetsPosition() {
    const galaxy = document.getElementById('ultra_new_planetary_galaxy');
    if (!galaxy) return;

    const time = Date.now() * 0.001;
    const orbits = document.querySelectorAll('.ultra_new_planetary_orbit');
    
    orbits.forEach(function(orbit, orbitIndex) {
      const radius = parseFloat(orbit.style.getPropertyValue('--orbit-size')) / 2;
      const speed = 0.02 + orbitIndex * 0.005;
      const angle = time * speed;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const planetOrientation = orbit.querySelector('.ultra_new_planetary_planet_orientation');
      if (planetOrientation) {
        // ИСПОЛЬЗУЕМ ПРОЦЕНТНОЕ ПОЗИЦИОНИРОВАНИЕ КАК В ДЕМО
        const percentX = 50 + 50 * (x / radius);
        const percentY = 50 + 50 * (y / radius);
        
        planetOrientation.style.left = `${percentX}%`;
        planetOrientation.style.top = `${percentY}%`;
        planetOrientation.style.transform = 'translate(-50%, -50%)';
      }
    });
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

})(); 