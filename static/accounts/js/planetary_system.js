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
      '/static/accounts/images/planetary_system/textures/planet_1.webp',
      '/static/accounts/images/planetary_system/textures/planet_2.webp',
      '/static/accounts/images/planetary_system/textures/planet_3.webp',
      '/static/accounts/images/planetary_system/textures/planet_4.webp',
      '/static/accounts/images/planetary_system/textures/planet_5.webp',
      '/static/accounts/images/planetary_system/textures/planet_6.webp',
      '/static/accounts/images/planetary_system/textures/planet_7.webp',
      '/static/accounts/images/planetary_system/textures/planet_8.webp',
      '/static/accounts/images/planetary_system/textures/planet_9.webp'
    ],
    ring: []
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
    } else if (path.includes('investor') || path.includes('startuper')) {
      return 'main';
    } else if (path === '/planetary-system/') {
      return 'planetary';
    }
    return 'other';
  }

  function setInitialGalaxyPosition() {
    const currentPage = getCurrentPage();
    const isMobile = window.innerWidth <= 768;
    if (currentPage === 'home') {
      ultraNewPlanetaryGalaxyY = 0;
      ultraNewPlanetaryGalaxyX = 0;
      ultraNewPlanetaryGalaxyScale = 1.1;
    } else if (currentPage === 'main') {
      if (isMobile) {
        ultraNewPlanetaryGalaxyY = -12; // mobile like on screenshot
        ultraNewPlanetaryGalaxyX = 1.08;
        ultraNewPlanetaryGalaxyScale = 0.8;
      } else {
        ultraNewPlanetaryGalaxyY = -53; // desktop per screenshot
        ultraNewPlanetaryGalaxyX = -15;
        ultraNewPlanetaryGalaxyScale = 1.1;
      }
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
        applyResponsiveOrbits();
        startUltraNewPlanetaryAnimation();
      }, 100);
      if (window.innerWidth < 340 || (navigator.deviceMemory && navigator.deviceMemory <= 2)) {
        const orbits = document.querySelectorAll('.ultra_new_planetary_orbit');
        orbits.forEach((o, idx) => {
          if (idx > 2) o.style.display = 'none';
        });
        stopUltraNewPlanetaryAnimation();
      }
      window.addEventListener('resize', applyResponsiveOrbits, { passive: true });
      window.addEventListener('orientationchange', applyResponsiveOrbits, { passive: true });
      setupTouchEvents();
      setupVisibilityPause();
      applyReducedMotionPreference();
    } catch (error) {
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
  function setupTouchEvents() {
    const solarSystem = document.getElementById('ultra_new_planetary_solar_system');
    if (!solarSystem) return;
    let touchDragging = false;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let pinchStartDist = 0;
    const dragThreshold = 8;
    function getDistance(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    }
    solarSystem.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        touchDragging = true;
      } else if (e.touches.length === 2) {
        touchDragging = false;
        pinchStartDist = getDistance(e.touches[0], e.touches[1]);
      }
    }, { passive: true });
    solarSystem.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1 && touchDragging) {
        const t = e.touches[0];
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
          ultraNewPlanetaryGalaxyX = Math.max(-ultraNewPlanetaryMaxOffset, Math.min(ultraNewPlanetaryMaxOffset, ultraNewPlanetaryGalaxyX + dx));
          ultraNewPlanetaryGalaxyY = Math.max(-ultraNewPlanetaryMaxOffset, Math.min(ultraNewPlanetaryMaxOffset, ultraNewPlanetaryGalaxyY + dy));
          updateUltraNewPlanetaryGalaxyTransform();
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      } else if (e.touches.length === 2) {
        const dist = getDistance(e.touches[0], e.touches[1]);
        if (pinchStartDist > 0) {
          const scaleDelta = (dist - pinchStartDist) / 200;
          ultraNewPlanetaryGalaxyScale = Math.max(0.7, Math.min(1.4, ultraNewPlanetaryGalaxyScale + scaleDelta));
          updateUltraNewPlanetaryGalaxyTransform();
        }
        pinchStartDist = dist;
      }
    }, { passive: true });
    solarSystem.addEventListener('touchend', function(e) {
      if (e.touches.length === 0) {
        touchDragging = false;
        pinchStartDist = 0;
      }
    });
  }
  function setupVisibilityPause() {
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        stopUltraNewPlanetaryAnimation();
      } else {
        startUltraNewPlanetaryAnimation();
      }
    });
  }
  function applyReducedMotionPreference() {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      stopUltraNewPlanetaryAnimation();
    }
    media.addEventListener('change', (e) => {
      if (e.matches) stopUltraNewPlanetaryAnimation(); else startUltraNewPlanetaryAnimation();
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
  function applyResponsiveOrbits() {
    const scene = document.getElementById('ultra_new_planetary_scene');
    const orbits = document.querySelectorAll('.ultra_new_planetary_orbit');
    if (!scene || !orbits.length) return;
    const rect = scene.getBoundingClientRect();
    const base = Math.min(rect.width, rect.height);
    const factors = [0.42, 0.56, 0.7, 0.84, 0.98, 1.12];
    orbits.forEach((orbit, idx) => {
      const factor = factors[Math.min(idx, factors.length - 1)];
      const size = Math.max(120, Math.floor(base * factor));
      orbit.style.setProperty('--orbit-size', size + 'px');
    });
    const planets = document.querySelectorAll('.ultra_new_planetary_planet');
    const planetSize = Math.max(44, Math.min(72, Math.floor(base * 0.08)));
    const tooltipOffset = Math.floor(planetSize / 2) + 10;
    planets.forEach(p => {
      p.style.setProperty('--planet-size', planetSize + 'px');
      p.style.setProperty('--computed-planet-size', planetSize + 'px');
    });
    const orientations = document.querySelectorAll('.ultra_new_planetary_planet_orientation');
    orientations.forEach(o => {
      o.style.setProperty('--tooltip-offset', tooltipOffset + 'px');
    });
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
      img.onload = function() {};
      img.onerror = function() {
        const fallbackUrl = getUltraNewPlanetaryFallbackImage(index);
        planet.style.backgroundImage = `url(${fallbackUrl})`;
      };
      img.src = imageUrl;
    } else {
      const fallbackUrl = getUltraNewPlanetaryFallbackImage(index);
      planet.style.backgroundImage = `url(${fallbackUrl})`;
    }

    // Enable 3D spinning texture effect
    planet.style.backgroundSize = '200% 100%';
    planet.style.backgroundRepeat = 'repeat-x';
    var spinSpeed = 10 + (index % 5) * 3;
    var spinDir = (index % 2 === 0) ? '' : ' reverse';
    planet.style.animation = 'planet-texture-spin ' + spinSpeed + 's linear infinite' + spinDir;

    planet.setAttribute('data-startup-id', startup.id || startup.startup_id || 0);
    planet.setAttribute('data-startup-name', startup.name || 'Пустая орбита');
    planet.setAttribute('data-startup-data', JSON.stringify(startup));

    // --- Tooltip creation ---
    const orientationWrapper = planet.parentElement;
    if (orientationWrapper) {
      const existingTooltip = orientationWrapper.querySelector('.ultra_new_planetary_tooltip');
      if (existingTooltip) existingTooltip.remove();

      const startupName = startup.name || '';
      if (startupName && startupName !== 'Пустая орбита') {
        const tooltip = document.createElement('div');
        tooltip.className = 'ultra_new_planetary_tooltip';
        let tooltipHTML = '';
        const logoUrl = startup.logo || null;
        if (logoUrl) {
          tooltipHTML += '<img class="ultra_new_planetary_tooltip_logo" src="' + logoUrl + '" alt="" />';
        }
        tooltipHTML += '<span class="ultra_new_planetary_tooltip_name">' + startupName + '</span>';
        tooltipHTML += '<div class="ultra_new_planetary_tooltip_arrow"></div>';
        tooltip.innerHTML = tooltipHTML;
        orientationWrapper.appendChild(tooltip);
      }
    }

    const newPlanet = planet.cloneNode(true);
    planet.parentNode.replaceChild(newPlanet, planet);

    // Mobile two-tap: first tap = tooltip, second = modal
    let tooltipShownByTap = false;
    const clickHandler = function(e) {
      e.preventDefault();
      e.stopPropagation();
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (isTouchDevice && orientationWrapper) {
        const tooltipEl = orientationWrapper.querySelector('.ultra_new_planetary_tooltip');
        if (tooltipEl && !tooltipShownByTap) {
          tooltipShownByTap = true;
          tooltipEl.classList.add('ultra_new_planetary_tooltip_visible');
          setTimeout(function() {
            tooltipShownByTap = false;
            if (tooltipEl) tooltipEl.classList.remove('ultra_new_planetary_tooltip_visible');
          }, 3000);
          return;
        }
      }
      tooltipShownByTap = false;
      if (orientationWrapper) {
        const tooltipEl2 = orientationWrapper.querySelector('.ultra_new_planetary_tooltip');
        if (tooltipEl2) tooltipEl2.classList.remove('ultra_new_planetary_tooltip_visible');
      }
      showUltraNewPlanetaryModal(startup, imageUrl);
    };
    newPlanet.addEventListener('click', clickHandler, { passive: false });
    newPlanet.addEventListener('touchend', clickHandler, { passive: false });
    newPlanet.style.cursor = 'pointer';
    newPlanet.style.opacity = '1';
    newPlanet.style.display = 'block';
  }
  function setupUltraNewPlanetaryEmptyPlanet(planet, index) {
    if (!planet) return;
    planet.style.display = 'none';
    const orientationWrapper = planet.parentElement;
    if (orientationWrapper) {
      const tooltip = orientationWrapper.querySelector('.ultra_new_planetary_tooltip');
      if (tooltip) tooltip.remove();
    }
  }
  function getUltraNewPlanetaryFallbackImage(index) {
    const images = ultraNewPlanetaryFallbackImages.round || [];
    return images[index % images.length] || '/static/accounts/images/planetary_system/textures/planet_1.webp';
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
    const planetImageElement = document.getElementById('ultra_new_planetary_modal_planet_3d');
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
      planetImageElement.style.backgroundImage = 'url(' + modalImageUrl + ')';
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
    stopUltraNewPlanetaryAnimation();
  }
  function hideUltraNewPlanetaryModal() {
    const modal = document.getElementById('ultra_new_planetary_modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      startUltraNewPlanetaryAnimation();
    }
  }
  // ensure close on backdrop and cross also on mobile
  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('ultra_new_planetary_modal');
    const backdrop = document.querySelector('.ultra_new_planetary_modal_backdrop');
    const closeBtn = document.getElementById('ultra_new_planetary_modal_close');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        hideUltraNewPlanetaryModal();
      });
      closeBtn.addEventListener('touchend', function(e){ 
        e.preventDefault(); 
        e.stopPropagation();
        hideUltraNewPlanetaryModal(); 
      }, { passive: false });
    }
    
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('ultra_new_planetary_modal_backdrop')) {
          hideUltraNewPlanetaryModal();
        }
      });
      modal.addEventListener('touchend', function(e){
        if (e.target === modal || e.target.classList.contains('ultra_new_planetary_modal_backdrop')) {
          e.preventDefault();
          hideUltraNewPlanetaryModal();
        }
      }, { passive: false });
    }
    
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        e.preventDefault();
        hideUltraNewPlanetaryModal();
      });
      backdrop.addEventListener('touchend', function(e){ 
        e.preventDefault(); 
        hideUltraNewPlanetaryModal(); 
      }, { passive: false });
    }
  });

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
    window.addEventListener('resize', updateArrows, { passive: true });
    const labelEl = document.getElementById('ultra_new_planetary_selected_label');
    function placeLabel() {
      if (!labelEl) return;
      const isNarrow = window.innerWidth <= 390;
      labelEl.style.top = isNarrow ? '64px' : '95px';
    }
    placeLabel();
    window.addEventListener('resize', placeLabel, { passive: true });
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
      const solarSystem = planet.closest('#ultra_new_planetary_solar_system');
      if (!orbit || !planetOrientation) {
        return;
      }
      if (solarSystem && solarSystem.classList.contains('home-page-planetary')) {
        planetOrientation.style.left = '';
        planetOrientation.style.top = '';
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

      // Scale based on orbit position: larger when "closer" (bottom), smaller when "farther" (top)
      const normalizedY = Math.sin(angleRad); // -1 (top/far) to 1 (bottom/close)
      const scaleRange = 0.15 + (index * 0.03); // outer orbits get more scale variation
      const scale = 1 + normalizedY * scaleRange;
      planetObj.orientation.style.transform = `scale(${scale.toFixed(3)})`;

      // Dynamic shadow rotation: light always from sun at center
      const shadowRotation = angle % 360;
      planetObj.element.style.setProperty('--shadow-rotation', shadowRotation.toFixed(1) + 'deg');
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
