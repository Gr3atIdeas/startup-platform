document.addEventListener('DOMContentLoaded', function () {
  const banner = document.querySelector('.journey-start-banner');
    if (banner && banner.dataset.bgUrl) {
      banner.style.backgroundImage = `url('${banner.dataset.bgUrl}')`;
    }

  const categoriesRoot = document.querySelector('.journey-start-categories');
  if (categoriesRoot) {
    const startupsUrl = categoriesRoot.getAttribute('data-startups-url') || '/startups/';
    const carousel = categoriesRoot.querySelector('.category-carousel');
    const inner = categoriesRoot.querySelector('.category-carousel-inner');
    const viewport = categoriesRoot.querySelector('.category-carousel-viewport');
    const leftArrow = categoriesRoot.querySelector('.category-carousel-arrow-left');
    const rightArrow = categoriesRoot.querySelector('.category-carousel-arrow-right');
    if (carousel && inner && viewport && leftArrow && rightArrow) {
      const iconLeft = carousel.getAttribute('data-icon-left');
      const iconRight = carousel.getAttribute('data-icon-right');
      if (iconLeft) leftArrow.src = iconLeft;
      if (iconRight) rightArrow.src = iconRight;
      let offset = 0;
      let stepCache = 0;
      function getStep() {
        const item = inner.querySelector('.journey-start-category');
        if (!item) return 0;
        const gap = parseInt(getComputedStyle(inner).gap) || 0;
        const value = item.offsetWidth + gap;
        stepCache = value;
        return value;
      }
      function maxOffset() {
        const totalWidth = inner.scrollWidth;
        const viewWidth = viewport.clientWidth;
        return Math.max(0, totalWidth - viewWidth);
      }
      function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
      }
      function update() {
        inner.style.transform = `translateX(-${offset}px)`;
        markCenterItem();
      }
      function markCenterItem() {}
      leftArrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        offset = clamp(offset - getStep(), 0, maxOffset());
        update();
      });
      rightArrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        offset = clamp(offset + getStep(), 0, maxOffset());
        update();
      });
      window.addEventListener('resize', function(){ getStep(); update(); });
      getStep();
      update();
    }

    const items = categoriesRoot.querySelectorAll('.journey-start-category');
    items.forEach(function(item) {
      item.addEventListener('click', function() {
        const category = item.getAttribute('data-category');
        if (!category) return;
        const url = new URL(startupsUrl, window.location.origin);
        url.searchParams.append('category', category);
        window.location.href = url.toString();
      });
      // no selection scale to keep sizes identical
    });
  }
});

// Новая планетарная система для страницы Портфель
document.addEventListener('DOMContentLoaded', function() {
  const planetaryContainer = document.querySelector('.planetary-system-container');
  if (!planetaryContainer) return;

  const planetarySystem = planetaryContainer.querySelector('.planetary-system');
  if (!planetarySystem) return;

  let isDragging = false;
  let startX, startY, translateX = 0, translateY = 0;
  let scale = 1;

  // Обработчики для мыши
  planetarySystem.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);

  // Обработчики для тач-устройств
  planetarySystem.addEventListener('touchstart', startDraggingTouch);
  document.addEventListener('touchmove', dragTouch);
  document.addEventListener('touchend', stopDragging);

  // Обработчики для колесика мыши
  planetarySystem.addEventListener('wheel', handleWheel);

  function startDragging(e) {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    planetarySystem.classList.add('dragging');
    e.preventDefault();
  }

  function startDraggingTouch(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
      planetarySystem.classList.add('dragging');
      e.preventDefault();
    }
  }

  function drag(e) {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  }

  function dragTouch(e) {
    if (!isDragging || e.touches.length !== 1) return;
    translateX = e.touches[0].clientX - startX;
    translateY = e.touches[0].clientY - startY;
    updateTransform();
    e.preventDefault();
  }

  function stopDragging() {
    isDragging = false;
    planetarySystem.classList.remove('dragging');
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.max(0.5, Math.min(2, scale * delta));
    updateTransform();
  }

  function updateTransform() {
    planetarySystem.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // Инициализация планетарной системы
  function initPlanetarySystem() {
    const planets = planetarySystem.querySelectorAll('.planet');
    planets.forEach((planet, index) => {
      planet.addEventListener('click', function() {
        showPlanetInfo(planet, index);
      });
    });
  }

  function showPlanetInfo(planet, index) {
    const infoCard = document.getElementById('info-card');
    if (!infoCard) return;

    // Здесь можно добавить логику для отображения информации о планете
    infoCard.style.display = 'block';
    
    // Скрыть карточку через 3 секунды
    setTimeout(() => {
      infoCard.style.display = 'none';
    }, 3000);
  }

  // Запуск инициализации
  initPlanetarySystem();
});
