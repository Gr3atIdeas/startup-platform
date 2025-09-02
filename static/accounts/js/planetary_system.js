(function() {
  'use strict';
  let ultraNewPlanetaryStartupsData = [];
  let ultraNewPlanetaryDirectionsData = [];
  let ultraNewPlanetarySelectedGalaxy = '';
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
      '/static/accounts/images/planetary_system/planets_round/6.png',
      '/static/accounts/images/planetary_system/planets_round/7.png',
      '/static/accounts/images/planetary_system/planets_round/8.png',
      '/static/accounts/images/planetary_system/planets_round/9.png',
      '/static/accounts/images/planetary_system/planets_round/10.png',
      '/static/accounts/images/planetary_system/planets_round/11.png',
      '/static/accounts/images/planetary_system/planets_round/12.png',
      '/static/accounts/images/planetary_system/planets_round/13.png',
      '/static/accounts/images/planetary_system/planets_round/14.png',
      '/static/accounts/images/planetary_system/planets_round/15.png'
    ],
    ring: [
      '/static/accounts/images/planetary_system/planets_ring/1.png',
      '/static/accounts/images/planetary_system/planets_ring/2.png',
      '/static/accounts/images/planetary_system/planets_ring/3.png',
      '/static/accounts/images/planetary_system/planets_ring/4.png',
      '/static/accounts/images/planetary_system/planets_ring/5.png',
      '/static/accounts/images/planetary_system/planets_ring/6.png'
    ]
  };
  let ultraNewPlanetaryGalaxyScale = 1;
  let ultraNewPlanetaryGalaxyX = 0;
  let ultraNewPlanetaryGalaxyY = 0;
  let ultraNewPlanetaryIsDragging = false;
  let ultraNewPlanetaryLastMouseX = 0;
  let ultraNewPlanetaryLastMouseY = 0;
  const ultraNewPlanetaryMinScale = 0.3;
  const ultraNewPlanetaryMaxScale = 2.5;
  const ultraNewPlanetaryMaxOffset = 500;
  let ultraNewPlanetaryCategoriesTotal = 0;

  function getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/') {
      return 'home';
    } else if (path === '/investor/' || path === '/startupper/') {
      return 'main';
    } else if (path === '/planetary-system/') {
      return 'planetary';
    }
    return 'other';
  }

  function setInitialGalaxyPosition() {
    const currentPage = getCurrentPage();
    if (currentPage === 'home') {
      ultraNewPlanetaryGalaxyY = 0;
      ultraNewPlanetaryGalaxyX = 0;
      ultraNewPlanetaryGalaxyScale = 1.1;
    } else if (currentPage === 'main') {
      ultraNewPlanetaryGalaxyY = -200;
      ultraNewPlanetaryGalaxyScale = 0.8;
    } else {
      ultraNewPlanetaryGalaxyY = 0;
      ultraNewPlanetaryGalaxyScale = 1;
    }
    updateUltraNewPlanetaryGalaxyTransform();
  }
  document.addEventListener('DOMContentLoaded', function() {
    initializeUltraNewPlanetarySystem();
  });
  function initializeUltraNewPlanetarySystem() {
    try {
      loadUltraNewPlanetarySystemData();
      loadUltraNewPlanetaryFallbackImages();
      setupUltraNewPlanetarySystem();
      setInitialGalaxyPosition();
      setTimeout(() => {
        initializeUltraNewPlanetaryObjects();
        startUltraNewPlanetaryAnimation();
      }, 100);
    } catch (error) {
      console.warn('Ultra New Planetary System initialization error:', error);
    }
  }
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
      ultraNewPlanetaryCategoriesTotal = ultraNewPlanetaryDirectionsData.length;
      setTimeout(() => {
        ultraNewPlanetaryUpdateArrowStates();
      }, 100);
      if (typeof window.ultraNewPlanetaryCurrentCategoryPage === 'undefined') {
        window.ultraNewPlanetaryCurrentCategoryPage = 0;
      }
    }
  }
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
  function setupUltraNewPlanetarySystem() {
    const container = document.querySelector('.ultra_new_planetary_system_wrapper');
    if (!container) return;
    setupUltraNewPlanetaryMouseEvents();
    setupUltraNewPlanetaryControls();
    setupUltraNewPlanetaryGalaxySelector();
    loadUltraNewPlanetaryGalaxy();
  }
  function setupUltraNewPlanetaryMouseEvents() {
    const solarSystem = document.getElementById('ultra_new_planetary_solar_system');
    if (!solarSystem) return;
    solarSystem.addEventListener('mousemove', function(e) {
      const rect = solarSystem.getBoundingClientRect();
      ultraNewPlanetaryMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ultraNewPlanetaryMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (ultraNewPlanetaryIsDragging) {
        const deltaX = e.clientX - ultraNewPlanetaryLastMouseX;
        const deltaY = e.clientY - ultraNewPlanetaryLastMouseY;
        ultraNewPlanetaryGalaxyX += deltaX;
        ultraNewPlanetaryGalaxyY += deltaY;
        ultraNewPlanetaryGalaxyX = Math.max(-ultraNewPlanetaryMaxOffset, Math.min(ultraNewPlanetaryMaxOffset, ultraNewPlanetaryGalaxyX));
        ultraNewPlanetaryGalaxyY = Math.max(-ultraNewPlanetaryMaxOffset, Math.min(ultraNewPlanetaryMaxOffset, ultraNewPlanetaryGalaxyY));
        updateUltraNewPlanetaryGalaxyTransform();
        ultraNewPlanetaryLastMouseX = e.clientX;
        ultraNewPlanetaryLastMouseY = e.clientY;
      }
    });
    solarSystem.addEventListener('mousedown', function(e) {
      if (e.target.classList.contains('ultra_new_planetary_planet')) {
        return;
      }
      ultraNewPlanetaryIsDragging = true;
      ultraNewPlanetaryLastMouseX = e.clientX;
      ultraNewPlanetaryLastMouseY = e.clientY;
      solarSystem.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mouseup', function() {
      if (ultraNewPlanetaryIsDragging) {
        ultraNewPlanetaryIsDragging = false;
        solarSystem.style.cursor = 'grab';
      }
    });
    solarSystem.addEventListener('wheel', function(e) {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      ultraNewPlanetaryGalaxyScale += delta;
      ultraNewPlanetaryGalaxyScale = Math.max(ultraNewPlanetaryMinScale, Math.min(ultraNewPlanetaryMaxScale, ultraNewPlanetaryGalaxyScale));
      updateUltraNewPlanetaryGalaxyTransform();
    });
    solarSystem.addEventListener('dblclick', function(e) {
      e.preventDefault();
      resetUltraNewPlanetaryGalaxyTransform();
    });
  }
  function updateUltraNewPlanetaryGalaxyTransform() {
    const galaxy = document.getElementById('ultra_new_planetary_galaxy');
    if (!galaxy) return;
    galaxy.style.setProperty('--ultra_new_planetary_galaxy_scale', ultraNewPlanetaryGalaxyScale);
    galaxy.style.setProperty('--ultra_new_planetary_galaxy_x', ultraNewPlanetaryGalaxyX + 'px');
    galaxy.style.setProperty('--ultra_new_planetary_galaxy_y', ultraNewPlanetaryGalaxyY + 'px');
  }
  function resetUltraNewPlanetaryGalaxyTransform() {
    setInitialGalaxyPosition();
  }
  function setupUltraNewPlanetaryControls() {
    const allStartupsBtn = document.querySelector('.ultra_new_planetary_all_startups_button');
    if (allStartupsBtn) {
      allStartupsBtn.addEventListener('click', function() {
        window.location.href = '/startups/';
      });
    }
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    const categoriesCarousel = document.querySelector('.ultra_new_planetary_categories_container');
    if (prevBtn && categoriesCarousel) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        categoriesCarousel.scrollBy({ left: -categoriesCarousel.clientWidth * 0.7, behavior: 'smooth' });
      });
    }
    if (nextBtn && categoriesCarousel) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        categoriesCarousel.scrollBy({ left: categoriesCarousel.clientWidth * 0.7, behavior: 'smooth' });
      });
    }
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
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideUltraNewPlanetaryModal();
      }
    });
  }
  function setupUltraNewPlanetaryGalaxySelector() {
    setupUltraNewPlanetaryCategoryHandlers();
  }
  function setupUltraNewPlanetaryCategoryHandlers() {
    const categoryItems = document.querySelectorAll('.ultra_new_planetary_categories_container .ultra_new_planetary_category_item:not(.ultra_new_planetary_hidden_categories .ultra_new_planetary_category_item)');
    categoryItems.forEach(function(item) {
      item.addEventListener('click', function() {
        const galaxyName = this.getAttribute('data-name');
        selectUltraNewPlanetaryGalaxy(galaxyName);
      });
    });
  }
  function selectUltraNewPlanetaryGalaxy(galaxyName) {
    ultraNewPlanetarySelectedGalaxy = galaxyName;
    updateUltraNewPlanetaryGalaxyUI();

    applyUltraNewPlanetaryFilter(galaxyName);

    const url = new URL(window.location);
    if (galaxyName && galaxyName !== 'Все' && galaxyName !== 'All') {
      url.searchParams.set('direction', galaxyName);
    } else {
      url.searchParams.delete('direction');
    }
    history.replaceState(null, '', url.toString());
  }
  function updateUltraNewPlanetaryGalaxyUI() {
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
    const container = document.querySelector('.ultra_new_planetary_categories_container');
    if (container && selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedElement.getBoundingClientRect();
        const delta = (itemRect.left + itemRect.width / 2) - (containerRect.left + containerRect.width / 2);
        let targetScroll = container.scrollLeft + delta;
        const maxScroll = container.scrollWidth - container.clientWidth;
        targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    const labelEl = document.getElementById('ultra_new_planetary_selected_label');
    if (labelEl) {
      let displayName = ultraNewPlanetarySelectedGalaxy;
      const dirObj = ultraNewPlanetaryDirectionsData.find(d => d.direction_name === ultraNewPlanetarySelectedGalaxy || d.original_name === ultraNewPlanetarySelectedGalaxy);
      if (dirObj) {
        displayName = dirObj.direction_name;
      }
      if (!displayName || displayName === 'All') displayName = 'Все';
      labelEl.textContent = displayName;
    }
  }
  function loadUltraNewPlanetaryGalaxy() {
    const currentStartups = ultraNewPlanetaryStartupsData || [];
    updateUltraNewPlanetaryPlanets(currentStartups);
    startUltraNewPlanetaryAnimation();
  }
  function updateUltraNewPlanetaryPlanets(startups) {
    const planets = document.querySelectorAll('.ultra_new_planetary_planet');

    planets.forEach(function(planet, index) {
      const startup = startups[index];

      if (startup && (startup.id || startup.startup_id)) {
        planet.removeAttribute('data-startup-id');
        planet.removeAttribute('data-startup-data');
        planet.removeAttribute('data-startup-name');

        setupUltraNewPlanetaryPlanet(planet, startup, index);
      } else {
        setupUltraNewPlanetaryEmptyPlanet(planet, index);
      }
    });
    initializeUltraNewPlanetaryObjects();

    stopUltraNewPlanetaryAnimation();
    startUltraNewPlanetaryAnimation();
  }
  function clearUltraNewPlanetaryPlanetData(planet) {
    const newPlanet = planet.cloneNode(true);
    planet.parentNode.replaceChild(newPlanet, planet);
    newPlanet.removeAttribute('data-startup-id');
    newPlanet.removeAttribute('data-startup-data');
    newPlanet.removeAttribute('data-startup-name');
    newPlanet.replaceWith(newPlanet.cloneNode(true));
    return newPlanet;
  }
  function setupUltraNewPlanetaryPlanet(planet, startup, index) {
    if (!planet || !startup) return;
    const imageUrl = startup.image || getUltraNewPlanetaryFallbackImage(index);

    if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
      planet.style.backgroundImage = `url(${imageUrl})`;

      const img = new Image();
      img.onload = function() {

      };
      img.onerror = function() {
        const fallbackUrl = getUltraNewPlanetaryFallbackImage(index);
        planet.style.backgroundImage = `url(${fallbackUrl})`;
      };
      img.src = imageUrl;
    } else {
      const fallbackUrl = getUltraNewPlanetaryFallbackImage(index);
      planet.style.backgroundImage = `url(${fallbackUrl})`;
    }

    planet.setAttribute('data-startup-id', startup.id || startup.startup_id || 0);
    planet.setAttribute('data-startup-name', startup.name || 'Пустая орбита');
    planet.setAttribute('data-startup-data', JSON.stringify(startup));

    const newPlanet = planet.cloneNode(true);
    planet.parentNode.replaceChild(newPlanet, planet);

    newPlanet.addEventListener('click', function() {
      showUltraNewPlanetaryModal(startup, imageUrl);
    });
    newPlanet.style.cursor = 'pointer';
    newPlanet.style.opacity = '1';
    newPlanet.style.display = 'block';
  }
  function setupUltraNewPlanetaryEmptyPlanet(planet, index) {
    if (!planet) return;
    planet.style.display = 'none';
  }
  function getUltraNewPlanetaryFallbackImage(index) {
    const folderChoice = Math.random() < 0.5 ? 'round' : 'ring';
    const images = ultraNewPlanetaryFallbackImages[folderChoice] || [];
    return images[index % images.length] || '/static/accounts/images/planetary_system/planets_round/1.png';
  }
  function showUltraNewPlanetaryModal(startup, planetImageUrl) {
    const modal = document.getElementById('ultra_new_planetary_modal');
    if (!modal) return;
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
    if (nameElement) nameElement.textContent = startup.name || 'Без названия';
    if (ratingElement) ratingElement.textContent = `Рейтинг ${startup.rating || '0'}/5 (${startup.voters_count || '0'})`;
    if (commentsElement) commentsElement.textContent = startup.comment_count || '0';

    let categoryDisplayName = startup.direction || 'Не указана';
    if (startup.direction && ultraNewPlanetaryDirectionsData) {
      const categoryData = ultraNewPlanetaryDirectionsData.find(d =>
        d.original_name === startup.direction || d.direction_name === startup.direction
      );
      if (categoryData) {
        categoryDisplayName = categoryData.direction_name;
      } else {
        categoryDisplayName = startup.direction;
      }
    }
    if (categoryElement) categoryElement.textContent = categoryDisplayName;
    if (descriptionElement) descriptionElement.textContent = startup.description || 'Описание отсутствует';
    if (fundingAmountElement) {
      const fundingGoal = startup.funding_goal || 'Не определена';
      if (fundingGoal !== 'Не определена' && !fundingGoal.includes('₽')) {
        fundingAmountElement.textContent = `${fundingGoal} ₽`;
      } else {
        fundingAmountElement.textContent = fundingGoal;
      }
    }
    if (valuationAmountElement) {
      const valuation = startup.valuation || 'Не определена';
      if (valuation !== 'Не определена' && !valuation.includes('₽')) {
        valuationAmountElement.textContent = `${valuation} ₽`;
      } else {
        valuationAmountElement.textContent = valuation;
      }
    }
    if (investorsCountElement) {
      investorsCountElement.textContent = `Инвестировало (${startup.investors || '0'})`;
    }
    if (planetImageElement) {
      const modalImageUrl = planetImageUrl || startup.image || getUltraNewPlanetaryFallbackImage(0);
      planetImageElement.src = modalImageUrl;

      planetImageElement.onerror = function() {
        console.warn('Не удалось загрузить изображение стартапа:', modalImageUrl);
        this.src = getUltraNewPlanetaryFallbackImage(0);
      };
    }
    const progressPercentageElement = document.getElementById('ultra_new_planetary_modal_progress_percentage');
    const progressBarVisual = document.querySelector('.ultra_new_planetary_modal_progress_bar_visual');
    const progressContainer = document.querySelector('.ultra_new_planetary_modal_progress_container');
    if (progressPercentageElement && progressBarVisual && progressContainer) {
      let progress = 0;
      if (typeof startup.progress === 'number') {
        progress = Math.round(startup.progress);
      } else if (typeof startup.progress === 'string') {
        progress = parseFloat(startup.progress.replace('%', '')) || 0;
      } else {
        progress = 0;
      }
      progress = Math.max(0, Math.min(100, progress));
      progressPercentageElement.textContent = `${progress}%`;
      progressBarVisual.style.width = `${progress}%`;
      progressContainer.style.display = 'block';
    }
    if (detailsBtn) {
      detailsBtn.onclick = function() {
        if (startup.id && startup.id !== 0) {
          window.location.href = `/startups/${startup.id}/`;
        } else {
          alert('Эта орбита пока свободна. Здесь пока нет стартапа для просмотра.');
        }
      };
    }
    if (investmentBtn) {
      investmentBtn.onclick = function() {
        if (startup.id && startup.id !== 0) {
          window.location.href = `/invest/${startup.id}/`;
        } else {
          alert('Эта орбита пока свободна. Здесь пока нет стартапа для инвестирования.');
        }
      };
    }
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function hideUltraNewPlanetaryModal() {
    const modal = document.getElementById('ultra_new_planetary_modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  function startUltraNewPlanetaryAnimation() {
    function animate() {
      updateUltraNewPlanetaryPlanetsPosition();
      ultraNewPlanetaryAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }
  function stopUltraNewPlanetaryAnimation() {
    if (ultraNewPlanetaryAnimationId) {
      cancelAnimationFrame(ultraNewPlanetaryAnimationId);
      ultraNewPlanetaryAnimationId = null;
    }
  }
  window.addEventListener('beforeunload', function() {
    stopUltraNewPlanetaryAnimation();
  });
  function setupUltraNewPlanetaryCategoryScroll() {
    const container = document.querySelector('.ultra_new_planetary_categories_container');
    const prevBtn = document.getElementById('ultra_new_planetary_category_prev');
    const nextBtn = document.getElementById('ultra_new_planetary_category_next');
    if (!container) return;
    function updateArrows() {
      if (prevBtn) prevBtn.style.display = container.scrollLeft > 0 ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = (container.scrollLeft + container.clientWidth < container.scrollWidth - 1) ? 'flex' : 'none';
    }
    updateArrows();
    container.addEventListener('scroll', updateArrows);
    if (prevBtn) {
      prevBtn.onclick = function() {
        container.scrollBy({ left: -container.clientWidth * 0.7, behavior: 'smooth' });
      };
    }
    if (nextBtn) {
      nextBtn.onclick = function() {
        container.scrollBy({ left: container.clientWidth * 0.7, behavior: 'smooth' });
      };
    }
  }
  document.addEventListener('DOMContentLoaded', function() {
    setupUltraNewPlanetaryCategoryScroll();
  });
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.ultra_new_planetary_category_item').forEach(el => {
      const dataName = el.getAttribute('data-name');
      if (dataName === 'Все' || dataName === 'All') {
        el.classList.add('category-all');
      } else {
        el.classList.remove('category-all');
      }
    });
  });
  let ultraNewPlanetaryObjects = [];
  function initializeUltraNewPlanetaryObjects() {
    const planets = document.querySelectorAll('.ultra_new_planetary_planet');
    ultraNewPlanetaryObjects = [];
    planets.forEach((planet, index) => {
      const orbit = planet.closest('.ultra_new_planetary_orbit');
      const planetOrientation = planet.closest('.ultra_new_planetary_planet_orientation');
      if (!orbit || !planetOrientation) {
        return;
      }
      const orbitSize = parseFloat(orbit.style.getPropertyValue('--orbit-size')) || 200;
      const orbitTime = parseFloat(orbit.style.getPropertyValue('--orbit-time')) || 80;
      const initialAngle = Math.random() * 360;
      const speedFactor = 0.8 + Math.random() * 0.4;
      ultraNewPlanetaryObjects.push({
        element: planet,
        orientation: planetOrientation,
        orbit: orbit,
        orbitSize: orbitSize,
        orbitTime: orbitTime,
        angle: initialAngle,
        speedFactor: speedFactor,
        startTime: Date.now() - Math.random() * orbitTime * 1000
      });
    });
  }
  function updateUltraNewPlanetaryPlanetsPosition() {
    const now = Date.now();
    const currentPage = getCurrentPage();

    if (currentPage === 'home') {
      return;
    }

    ultraNewPlanetaryObjects.forEach((planetObj, index) => {
      if (!planetObj.orientation || !planetObj.element) return;
      const elapsedSeconds = (now - planetObj.startTime) / 1000;
      const orbitTimeSeconds = planetObj.orbitTime * planetObj.speedFactor;
      const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
      const angle = planetObj.angle + progress * 360;
      const angleRad = angle * Math.PI / 180;
      const radius = planetObj.orbitSize / 2;
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius;

      planetObj.orientation.style.left = `${50 + (x / radius) * 50}%`;
      planetObj.orientation.style.top = `${50 + (y / radius) * 50}%`;
    });
  }
  function applyUltraNewPlanetaryFilter(categoryName) {
    let filtered = [];
    if (!categoryName || categoryName === 'Все' || categoryName === 'All') {
      filtered = ultraNewPlanetaryAllStartupsData.slice();
    } else {
      filtered = ultraNewPlanetaryAllStartupsData.filter(s => {
        if (s.direction === categoryName) return true;

        if (ultraNewPlanetaryDirectionsData) {
          const categoryData = ultraNewPlanetaryDirectionsData.find(d =>
            d.original_name === categoryName || d.direction_name === categoryName
          );
          if (categoryData) {
            return s.direction === categoryData.direction_name || s.direction === categoryData.original_name;
          }
        }

        return false;
      });
    }

    const startups = [];
    if (filtered.length >= 6) {
      startups.push(...filtered.slice(0, 6));
    } else if (filtered.length > 0) {
      startups.push(...filtered);
    }
    updateUltraNewPlanetaryPlanets(startups);
  }
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
    const container = document.querySelector('.ultra_new_planetary_categories_container');
    if (container) {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      if (prevBtn) prevBtn.style.display = hasOverflow ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = hasOverflow ? 'flex' : 'none';
    }
  }
})();
