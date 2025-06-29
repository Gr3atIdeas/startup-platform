// Planetary system universal script
// Работает на страницах, где присутствует разметка планетарной системы и JSON-скрипт
// с id = planetary-system-data | planetary-data | planetary-investments-data | planetary-startups-data

(function() {
  // Подбираем скрипт с данными
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

  const planetsData   = data.planetsData   || data.planets   || [];
  const directionsData = data.directionsData || data.directions || [];
  const selectedGalaxy = data.selectedGalaxy || '';
  const logoData      = { image: data.logoImage || (data.logo ? data.logo.image : '') };
  const urls          = data.urls || {};

  // DOM-элементы
  const planets           = document.querySelectorAll('.planet');
  const infoCard          = document.getElementById('info-card');
  const planetImage       = document.getElementById('planet-image');
  const startupName       = document.getElementById('startup-name');
  const startupRating     = document.getElementById('startup-rating');
  const startupProgress   = document.getElementById('startup-progress');
  const startupFunding    = document.getElementById('startup-funding');
  const startupInvestors  = document.getElementById('startup-investors');
  const startupDescription= document.getElementById('startup-description');
  const closeCard         = document.getElementById('close-card');
  const moreDetails       = document.getElementById('more-details');
  const solarSystem       = document.getElementById('solar-system');
  const scene             = document.getElementById('scene');
  const logoElement       = document.getElementById('logo');
  const allStartupsBtn    = document.querySelector('.all-startups-button');
  const navLeftBtn        = document.getElementById('nav-left-btn');
  const navRightBtn       = document.getElementById('nav-right-btn');
  const fullscreenBtn     = document.getElementById('fullscreen-btn');
  const galaxyListElem    = document.getElementById('galaxy-list');

  const fallbackScript = document.getElementById('planetary-fallback-images');
  let fallbackImages = {round:[], ring:[]};
  if (fallbackScript) {
    try { fallbackImages = JSON.parse(fallbackScript.textContent); } catch(e){}
  }

  // Солнце + текст
  if (logoElement && logoData.image) {
    const existing = logoElement.querySelector('.sun-text');
    if (existing) {
      existing.src = logoData.image;
        }
  }

  // --- Переменные для анимации / управления ---
  const planetObjects = [];
  const galaxyTiltAngle = 60;
  let isPaused = false;
  let pausedTime = 0;
  let lastInteractionTime = Date.now();
  const inactivityTimeout = 10000;
  let isReturningToCenter = false;

  // Для равномерного распределения по орбите
  const orbitCounters = new Map();

  // --- Инициализация планет
  planets.forEach((planet, index) => {
    const orbit = planet.closest('.orbit');
    const planetOrientation = planet.closest('.planet-orientation');
    if (!orbit || !planetOrientation) return;

    const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size'));
    const orbitTime = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-time'));

    // Равномерный угол в пределах конкретной орбиты
    if (!orbitCounters.has(orbit)) orbitCounters.set(orbit, 0);
    const idxInOrbit = orbitCounters.get(orbit);
    orbitCounters.set(orbit, idxInOrbit + 1);
    const orientationsInOrbit = orbit.querySelectorAll('.planet-orientation').length;
    const initialAngle = (360 / orientationsInOrbit) * idxInOrbit;

    const speedFactor  = 0.8 + Math.random() * 0.4;

    planetObjects.push({
      element: planet,
      orientation: planetOrientation,
      orbitSize: orbitSize,
      orbitTime: orbitTime,
      angle: initialAngle,
      speedFactor: speedFactor,
      startTime: Date.now() - Math.random() * orbitTime * 1000
    });

    /* Случайный размер 60-90 px вместо заранее заданного */
    const rndSize = 60 + Math.random() * 30; // 60-90
    planet.style.width  = `${rndSize}px`;
    planet.style.height = `${rndSize}px`;
    planet.style.marginLeft = `${-rndSize / 2}px`;
    planet.style.marginTop  = `${-rndSize / 2}px`;

    // Картинка планеты
    const id = planet.getAttribute('data-id');
    let pData = planetsData.find(p => p.id == id);
    if (!pData) {
      pData = planetsData[index];
    }
    if (pData && pData.image) {
      planet.style.backgroundImage = `url('${pData.image}')`;
    } else {
      // Рандомное изображение с дисками / кольцами
      const useRing = Math.random() < 0.3;
      const arr = useRing ? fallbackImages.ring : fallbackImages.round;
      const idx = Math.floor(Math.random() * arr.length);
      if (arr[idx]) planet.style.backgroundImage = `url('${arr[idx]}')`;
    }

    // Устанавливаем атрибут направления (категории)
    if (pData && pData.direction) {
      planet.dataset.direction = pData.direction;
    }

    // Клик по планете → карточка
    planet.addEventListener('click', (e) => {
            e.stopPropagation();
      if (!pData) {
        // Fallback, если данных нет
        const bg = getComputedStyle(planet).backgroundImage;
        planetImage.style.backgroundImage = bg !== 'none' ? bg : 'linear-gradient(#3a7bd5,#3a6073)';
        startupName.textContent       = 'Скоро здесь будет стартап';
        startupRating.textContent     = '';
        startupProgress.textContent   = '';
        startupFunding.textContent    = '';
        startupInvestors.textContent  = '';
        startupDescription.textContent= 'Ожидаем загрузку данных…';
      } else {
        planetImage.style.backgroundImage = `url('${pData.image}')`;
        startupName.textContent       = pData.name || 'Название не указано';
        startupRating.textContent     = `Рейтинг ${pData.rating || '0'}/5`;
        startupProgress.textContent   = pData.progress || '0%';
        startupFunding.textContent    = `Цель финансирования: ${pData.funding_goal || 'Не указана'}`;
        startupInvestors.textContent  = `Инвесторов: ${pData.investors || 0}`;
        startupDescription.textContent= pData.description || 'Описание не указано';
      }

      planets.forEach(p => p.classList.remove('active'));
      planet.classList.add('active');
      infoCard.style.display = 'block';

      isPaused = true;
      pausedTime = Date.now();
      lastInteractionTime = Date.now();
    });
    });

  // Закрытие карточки
  if (closeCard) {
    closeCard.addEventListener('click', () => {
      infoCard.style.display = 'none';
      planets.forEach(p => p.classList.remove('active'));
      if (isPaused) {
        const pauseDuration = Date.now() - pausedTime;
        planetObjects.forEach(o => { o.startTime += pauseDuration; });
        isPaused = false;
      }
      lastInteractionTime = Date.now();
        });
    }

  // «Подробнее»
  if (moreDetails) {
    moreDetails.addEventListener('click', () => {
      const activePlanet = document.querySelector('.planet.active');
      if (!activePlanet) return;
      const id = activePlanet.getAttribute('data-id');
      let pData = planetsData.find(p => p.id == id);
      if (!pData) {
        const idx = [...planets].indexOf(activePlanet);
        pData = planetsData[idx];
      }
      if (pData && pData.startup_id) {
        window.location.href = `/startup/${pData.startup_id}/`;
        }
    });
  }

  // Кнопка «Все стартапы»
    if (allStartupsBtn) {
    allStartupsBtn.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/startups/';
        });
    }

  // --- Drag / Zoom ---
  let isDragging = false;
  let startX, startY, offsetX = 0, offsetY = 0, scale = 0.8; // начальный масштаб 0.8
  if (solarSystem) {
    solarSystem.addEventListener('mousedown', e => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      solarSystem.classList.add('dragging');
      lastInteractionTime = Date.now();
      isReturningToCenter = false;
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      offsetX += dx;
      offsetY += dy;
      offsetX = Math.max(-window.innerWidth/2, Math.min(window.innerWidth/2, offsetX));
      offsetY = Math.max(-window.innerHeight/2, Math.min(window.innerHeight/2, offsetY));
      scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      startX = e.clientX;
      startY = e.clientY;
      lastInteractionTime = Date.now();
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      solarSystem.classList.remove('dragging');
      lastInteractionTime = Date.now();
    });

    /* Колёсико мыши — масштабирование. Указываем passive: false, чтобы избежать warning в Chrome */
    solarSystem.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.5, Math.min(3, scale + delta));
      scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      lastInteractionTime = Date.now();
      isReturningToCenter = false;
    }, { passive: false });
  }

  /* ----------------  НАЧАЛЬНЫЙ ЗУМ ---------------- */
  if (scene) {
    scene.style.transform = `translate(-50%, -50%) translate(0,0) scale(${scale})`;
  }

  // --- Категории ---
  function filterByCategory(cat) {
    planets.forEach(p => {
      const dir = p.dataset.direction || '';
      p.style.display = (!cat || dir === cat) ? '' : 'none';
    });
    document.querySelectorAll('.galaxy-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.name === cat);
    });
  }

  document.querySelectorAll('.galaxy-item').forEach(item => {
        item.addEventListener('click', function(e) {
        e.preventDefault();
            e.stopPropagation();
            const categoryName = this.dataset.name;
      filterByCategory(categoryName);
    });
        });

  // --- Навигация категорий ---
  if (navLeftBtn && galaxyListElem) {
    navLeftBtn.addEventListener('click', () => {
      galaxyListElem.scrollBy({ left: -200, behavior: 'smooth' });
    });
  }
  if (navRightBtn && galaxyListElem) {
    navRightBtn.addEventListener('click', () => {
      galaxyListElem.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

  // --- Полноэкранный режим ---
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const wrapper = document.querySelector('.planetary-system-wrapper');
      if (!wrapper) return;
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(err => console.warn(err));
      } else {
        document.exitFullscreen();
                }
            });
        }
        
  // --- Автоцентрирование при бездействии ---
  function checkInactivity() {
    const now = Date.now();
    if (now - lastInteractionTime >= inactivityTimeout && !isReturningToCenter && !isPaused) {
      isReturningToCenter = true;
      const startX = offsetX;
      const startY = offsetY;
      const duration = 1000;
      let startTime = null;
      function animateReturn(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        offsetX = startX * (1 - progress);
        offsetY = startY * (1 - progress);
        scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        if (progress < 1) {
          requestAnimationFrame(animateReturn);
        } else {
          isReturningToCenter = false;
        }
      }
      requestAnimationFrame(animateReturn);
    }
  }
  setInterval(checkInactivity, 1000);

  // Перевод категорий на русский
  const translate = {
    'Auto': 'Авто',
    'Beauty': 'Красота',
    'Cafe': 'Кафе',
    'Delivery': 'Доставка',
    'Fastfood': 'Фастфуд',
    'Finance': 'Финансы',
    'Health': 'Здоровье',
    'Healthcare': 'Медицина',
    'Medicine': 'Медицина',
    'Psychology': 'Психология',
    'Sport': 'Спорт',
    'Technology': 'Технологии',
    'Transport': 'Транспорт'
  };
  document.querySelectorAll('.category-text').forEach(el => {
    const eng = el.textContent.trim();
    if (translate[eng]) el.textContent = translate[eng];
  });

  /* DEBUG-блок временно отключён по требованию — никаких рамок/оверлея */

  // Генерируем реальные звёзды вместо статичной текстуры
  (function generateStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    const starCount = 300; // количество звёзд
    const frag = document.createDocumentFragment();
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = Math.random() * 2 + 1; // 1–3 px
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.background = 'rgba(255,255,255,0.9)';
      star.style.borderRadius = '50%';
      star.style.position = 'absolute';
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.opacity = (0.3 + Math.random() * 0.4).toFixed(2);
      // Индивидуальная мерцалка
      const duration = (3 + Math.random() * 5).toFixed(1);
      const delay = (Math.random() * 4).toFixed(1);
      star.style.animation = `twinkle ${duration}s ease-in-out ${delay}s infinite alternate`;
      frag.appendChild(star);
    }
    starsContainer.innerHTML = ''; // очищаем старый фон
    starsContainer.appendChild(frag);
  })();

  /* ----- ОТКЛЮЧИЛ JS-движение планет. CSS-анимации орбит делают всё сами ----- */

  // Равномерно распределяем планеты по орбите через animation-delay
  document.querySelectorAll('.orbit').forEach(orbitEl => {
    const orientations = orbitEl.querySelectorAll('.planet-orientation');
    const N = orientations.length;
    orientations.forEach((ori, idx) => {
      const orbitTime = parseFloat(getComputedStyle(orbitEl).getPropertyValue('--orbit-time')) || 60;
      const delay = -(orbitTime * idx / N);
      ori.style.animationDelay = `${delay}s`;
    });
  });

  // --- Планетарная анимация ---
  function updatePlanets() {
    const now = Date.now();
    if (isPaused) { requestAnimationFrame(updatePlanets); return; }
    planetObjects.forEach(o => {
      const elapsed  = (now - o.startTime) / 1000;
      const period   = o.orbitTime * o.speedFactor;
      const progress = (elapsed % period) / period;
      const angleDeg = o.angle + progress * 360;
      const angleRad = angleDeg * Math.PI / 180;
      const radius   = o.orbitSize / 2;
      const x = Math.cos(angleRad) * radius;
      const y = Math.sin(angleRad) * radius;
      o.orientation.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
      o.element.style.transform = 'rotateX(-60deg)';
    });
    requestAnimationFrame(updatePlanets);
  }
  updatePlanets();
})(); 