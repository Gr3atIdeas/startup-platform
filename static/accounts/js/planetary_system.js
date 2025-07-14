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
  let ultraNewPlanetaryAllStartupsData = [];
  let ultraNewPlanetaryFallbackImages = {
    round: [
      '/static/accounts/images/planetary_system/planets_round/1.png',
      '/static/accounts/images/planetary_system/planets_round/2.png',
      '/static/accounts/images/planetary_system/planets_round/3.png',
      '/static/accounts/images/planetary_system/planets_round/4.png',
      '/static/accounts/images/planetary_system/planets_round/5.png',
      '/static/accounts/images/planetary_system/planets_round/6.png'
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
  const ultraNewPlanetaryCategoriesPerPage = 7; // Показываем 7 категорий за раз
  
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
      ultraNewPlanetaryAllStartupsData = data.allStartupsData || [];
      
      // Инициализация переменных для категорий
      ultraNewPlanetaryCategoriesTotal = ultraNewPlanetaryDirectionsData.length;
      ultraNewPlanetaryCategoriesVisible = 0;
      
      console.log('Initializing categories:');
      console.log('Total categories:', ultraNewPlanetaryCategoriesTotal);
      console.log('Categories per page:', ultraNewPlanetaryCategoriesPerPage);
      console.log('Initial visible:', ultraNewPlanetaryCategoriesVisible);
      
      // Показываем стрелки, если категорий больше, чем помещается на одной странице
      if (ultraNewPlanetaryCategoriesTotal > ultraNewPlanetaryCategoriesPerPage) {
        console.log('Showing arrows - more categories than fit on one page');
        ultraNewPlanetaryShowArrows();
        ultraNewPlanetaryUpdateArrowStates();
      } else {
        console.log('Hiding arrows - all categories fit on one page');
        ultraNewPlanetaryHideArrows();
      }

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
    const categoriesCarousel = document.querySelector('.ultra_new_planetary_categories_container');
    
    if (prevBtn && categoriesCarousel) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        changeUltraNewPlanetaryCategory(-1);
      });
    }

    if (nextBtn && categoriesCarousel) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
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
    // Просто навешиваем клики на все категории
    setupUltraNewPlanetaryCategoryHandlers();
  }

  // УСТАНОВКА ОБРАБОТЧИКОВ ДЛЯ КАТЕГОРИЙ
  function setupUltraNewPlanetaryCategoryHandlers() {
    const categoryItems = document.querySelectorAll('.ultra_new_planetary_categories_container .ultra_new_planetary_category_item:not(.ultra_new_planetary_hidden_categories .ultra_new_planetary_category_item)');
    categoryItems.forEach(function(item) {
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
    
    // Динамически фильтруем без перезагрузки
    applyUltraNewPlanetaryFilter(galaxyName);
    // Обновляем URL в адресной строке, не перезагружая страницу
    const url = new URL(window.location);
    if (galaxyName && galaxyName !== 'Все') {
      url.searchParams.set('direction', galaxyName);
    } else {
      url.searchParams.delete('direction');
    }
    history.replaceState(null, '', url.toString());
  }

  // ОБНОВЛЕНИЕ UI СЕЛЕКТОРА ГАЛАКТИК
  function updateUltraNewPlanetaryGalaxyUI() {
    // Обновляем состояние всех категорий (видимых и скрытых)
    const allCategoryItems = document.querySelectorAll('.ultra_new_planetary_category_item');
    let selectedElement = null;
    allCategoryItems.forEach(function(item) {
      if (item.getAttribute('data-name') === ultraNewPlanetarySelectedGalaxy) {
        item.classList.add('selected');
        selectedElement = item;
      } else {
        item.classList.remove('selected');
      }
    });

    // Плавно скроллим контейнер так, чтобы выбранная категория оказалась по центру под текстовой капсулой
    const container = document.querySelector('.ultra_new_planetary_categories_container');
    if (container && selectedElement) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedElement.getBoundingClientRect();
      const delta = (itemRect.left + itemRect.width / 2) - (containerRect.left + containerRect.width / 2);
      let targetScroll = container.scrollLeft + delta;
      // Ограничиваем диапазон
      const maxScroll = container.scrollWidth - container.clientWidth;
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }

    // Обновляем лейбл выбранной категории под селектором
    const labelEl = document.getElementById('ultra_new_planetary_selected_label');
    if (labelEl) {
      // Ищем русский перевод названия, если доступен
      let displayName = ultraNewPlanetarySelectedGalaxy;
      const dirObj = ultraNewPlanetaryDirectionsData.find(d => d.direction_name === ultraNewPlanetarySelectedGalaxy || d.original_name === ultraNewPlanetarySelectedGalaxy);
      if (dirObj) {
        displayName = dirObj.direction_name;
      }
      if (!displayName || displayName === 'All') displayName = 'Все';
      labelEl.textContent = displayName;
    }
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
    return images[index % images.length] || '/static/accounts/images/planetary_system/planets_round/1.png';
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
    const container = document.querySelector('.ultra_new_planetary_categories_container');
    if (!container) {
      console.warn('Container not found');
      return;
    }

    // Получаем массив всех категорий ("Все" + остальные)
    const allCategories = ultraNewPlanetaryDirectionsData.map(d => d.direction_name);
    // Гарантируем, что "Все" всегда первая
    if (allCategories[0] !== 'Все') {
      allCategories.unshift('Все');
    }
    const categoriesPerPage = ultraNewPlanetaryCategoriesPerPage; // 7
    const pageSize = categoriesPerPage - 1; // 6 (кроме "Все")
    // Считаем сколько "страниц" всего
    const totalPages = Math.ceil((allCategories.length - 1) / pageSize);
    // Индекс текущей страницы
    if (typeof window.ultraNewPlanetaryCurrentCategoryPage === 'undefined') {
      window.ultraNewPlanetaryCurrentCategoryPage = 0;
    }
    window.ultraNewPlanetaryCurrentCategoryPage += direction;
    if (window.ultraNewPlanetaryCurrentCategoryPage < 0) window.ultraNewPlanetaryCurrentCategoryPage = 0;
    if (window.ultraNewPlanetaryCurrentCategoryPage > totalPages - 1) window.ultraNewPlanetaryCurrentCategoryPage = totalPages - 1;

    // Формируем массив для текущей страницы
    const start = 1 + window.ultraNewPlanetaryCurrentCategoryPage * pageSize;
    const end = start + pageSize;
    const visibleCategories = [allCategories[0], ...allCategories.slice(start, end)];

    // Очищаем контейнер и рендерим только нужные категории
    container.innerHTML = '';
    visibleCategories.forEach(catName => {
      // Находим объект категории по имени
      const dirObj = ultraNewPlanetaryDirectionsData.find(d => d.direction_name === catName || d.original_name === catName) || {direction_name: catName, original_name: catName};
      const isAll = catName === 'Все';
      const item = document.createElement('div');
      item.className = 'ultra_new_planetary_category_item' + (isAll ? ' category-all' : '');
      item.setAttribute('data-name', dirObj.original_name || dirObj.direction_name);
      if (catName === ultraNewPlanetarySelectedGalaxy) {
        item.classList.add('selected');
      }
      // Внутренний фон
      const bg = document.createElement('div');
      bg.className = 'ultra_new_planetary_category_bg';
      item.appendChild(bg);
      // Иконка
      const icon = document.createElement('img');
      icon.className = 'ultra_new_planetary_category_icon';
      icon.src = '/static/accounts/images/planetary_system/category_img.png';
      icon.alt = isAll ? 'Все' : dirObj.direction_name;
      item.appendChild(icon);
      // Клик
      item.addEventListener('click', function() {
        selectUltraNewPlanetaryGalaxy(dirObj.direction_name);
      });
      container.appendChild(item);
    });

    // Обновляем состояние стрелок
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    if (prevBtn) prevBtn.style.display = window.ultraNewPlanetaryCurrentCategoryPage > 0 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = window.ultraNewPlanetaryCurrentCategoryPage < totalPages - 1 ? 'flex' : 'none';
  }

  // Функция отображения категорий больше не нужна (скролл нативный)

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

  // ФИЛЬТРАЦИЯ СТАРТАПОВ ПО КАТЕГОРИИ
  function applyUltraNewPlanetaryFilter(categoryName) {
    let filtered = [];
    if (!categoryName || categoryName === 'Все') {
      filtered = ultraNewPlanetaryAllStartupsData.slice();
    } else {
      filtered = ultraNewPlanetaryAllStartupsData.filter(s => s.direction === categoryName);
    }

    // Заполняем до 6 элементов как раньше
    const startups = [];
    if (filtered.length >= 6) {
      startups.push(...filtered.slice(0, 6));
    } else if (filtered.length > 0) {
      for (let i = 0; i < 6; i++) {
        startups.push(filtered[i % filtered.length]);
      }
    } else {
      for (let i = 0; i < 6; i++) startups.push(null);
    }

    updateUltraNewPlanetaryPlanets(startups);
  }

  // ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ СТРЕЛКАМИ
  function ultraNewPlanetaryShowArrows() {
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    if (prevBtn) prevBtn.style.display = 'flex';
    if (nextBtn) nextBtn.style.display = 'flex';
  }

  function ultraNewPlanetaryHideArrows() {
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  }

  function ultraNewPlanetaryUpdateArrowStates() {
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    
    if (prevBtn) {
      prevBtn.style.display = ultraNewPlanetaryCategoriesVisible > 0 ? 'flex' : 'none';
    }
    if (nextBtn) {
      const maxVisible = Math.max(0, ultraNewPlanetaryCategoriesTotal - ultraNewPlanetaryCategoriesPerPage);
      nextBtn.style.display = ultraNewPlanetaryCategoriesVisible < maxVisible ? 'flex' : 'none';
    }
  }

})();