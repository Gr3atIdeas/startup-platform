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

    // Закрытие карточки информации
    const closeCard = document.getElementById('ultra_new_planetary_close_card');
    if (closeCard) {
      closeCard.addEventListener('click', function() {
        hideUltraNewPlanetaryInfoCard();
      });
    }
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
      showUltraNewPlanetaryInfoCard(startup);
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
    
    planet.removeAttribute('data-startup-id');
    planet.removeAttribute('data-startup-data');
    
    planet.replaceWith(planet.cloneNode(true));
    
    planet.addEventListener('click', function() {
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
    
    planet.style.cursor = 'pointer';
    planet.style.opacity = '0.6';
  }

  // ПОЛУЧЕНИЕ РЕЗЕРВНОГО ИЗОБРАЖЕНИЯ
  function getUltraNewPlanetaryFallbackImage(index) {
    const images = ultraNewPlanetaryFallbackImages.round || [];
    return images[index % images.length] || 'https://placehold.co/100x100/333/FFF?text=P';
  }

  // ПОКАЗ КАРТОЧКИ ИНФОРМАЦИИ
  function showUltraNewPlanetaryInfoCard(startup) {
    const infoCard = document.getElementById('ultra_new_planetary_info_card');
    if (!infoCard) return;

    // Заполнение данных
    const nameElement = document.getElementById('ultra_new_planetary_startup_name');
    const ratingElement = document.getElementById('ultra_new_planetary_startup_rating');
    const fundingElement = document.getElementById('ultra_new_planetary_startup_funding');
    const investorsElement = document.getElementById('ultra_new_planetary_startup_investors');
    const descriptionElement = document.getElementById('ultra_new_planetary_startup_description');
    const imageElement = document.getElementById('ultra_new_planetary_planet_image');
    const moreDetailsBtn = document.getElementById('ultra_new_planetary_more_details');

    if (nameElement) nameElement.textContent = startup.title || 'Без названия';
    if (ratingElement) ratingElement.textContent = `★ ${startup.rating || '0'}/5`;
    if (fundingElement) fundingElement.textContent = `Собрано: ${startup.funding_current || 0}₽ из ${startup.funding_goal || 0}₽`;
    if (investorsElement) investorsElement.textContent = `Инвесторов: ${startup.investors_count || 0}`;
    if (descriptionElement) descriptionElement.textContent = startup.short_description || 'Описание отсутствует';
    
    if (imageElement) {
      const imageUrl = startup.planet_image_url || getUltraNewPlanetaryFallbackImage(0);
      imageElement.style.backgroundImage = `url(${imageUrl})`;
    }

    if (moreDetailsBtn) {
      moreDetailsBtn.onclick = function() {
        if (startup.id) {
          window.location.href = `/startups/${startup.id}/`;
        }
      };
    }

    infoCard.style.display = 'block';
  }

  // СКРЫТИЕ КАРТОЧКИ ИНФОРМАЦИИ
  function hideUltraNewPlanetaryInfoCard() {
    const infoCard = document.getElementById('ultra_new_planetary_info_card');
    if (infoCard) {
      infoCard.style.display = 'none';
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