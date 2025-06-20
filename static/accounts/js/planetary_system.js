document.addEventListener('DOMContentLoaded', () => {
    const planetarySystemContainer = document.getElementById('planetary-system-container');
    if (!planetarySystemContainer) return;

    // Элементы DOM
    const planets = planetarySystemContainer.querySelectorAll('.planet');
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
    const galaxyList = document.getElementById('galaxy-list');
    const logoElement = document.getElementById('logo');
    const orbitsContainer = document.getElementById('galaxy');

    // Переменные состояния
    let startups = {};
    let planetObjects = [];
    let isPaused = false;
    let pausedTime = 0;
    let lastInteractionTime = Date.now();
    const inactivityTimeout = 10000;
    let isReturningToCenter = false;

    // Переменные для перемещения и масштабирования
    let isDragging = false;
    let startX, startY;
    let offsetX = 0, offsetY = 0, scale = 1;
    let rotationX = 45, rotationY = 0; // Добавляем rotationY

    // Настройка сцены
    if(scene) {
        scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }
    if(galaxy) {
        galaxy.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
    }


    // Устанавливаем изображение логотипа, если оно есть
    if (logoElement && logoElement.dataset.bgUrl) {
        logoElement.style.backgroundImage = `url('${logoElement.dataset.bgUrl}')`;
    }

     // Переменные для переключателя галактик
     const galaxyNames = [
       'Технологии', 'Финансы', 'Здравоохранение', 'Медицина', 'Автомобили',
       'Доставка', 'Кафе/рестораны', 'Фастфуд', 'Здоровье', 'Красота',
       'Транспорт', 'Спорт', 'Психология', 'ИИ'
     ];
     let currentGalaxy = 'Технологии';
 
     // Инициализация переключателя галактик
     const categoryImageURL = '/static/accounts/images/planetary_system/category_img.png';
 
     galaxyNames.forEach((name, index) => {
         const galaxyItem = document.createElement('div');
         galaxyItem.className = 'galaxy-item';
 
         const itemImage = document.createElement('img');
         itemImage.src = categoryImageURL;
         itemImage.alt = name;
 
         const itemName = document.createElement('span');
         itemName.textContent = name;
 
         galaxyItem.appendChild(itemImage);
         galaxyItem.appendChild(itemName);
 
         if (name === currentGalaxy) {
             galaxyItem.classList.add('selected');
         }
         galaxyItem.addEventListener('click', () => {
             switchGalaxy(name);
             const wrapper = document.getElementById('galaxy-list-wrapper');
             if (wrapper) {
                 const scrollLeft = galaxyItem.offsetLeft - (wrapper.offsetWidth / 2) + (galaxyItem.offsetWidth / 2);
                 wrapper.scrollTo({
                     left: scrollLeft,
                     behavior: 'smooth'
                 });
             }
         });
         if(galaxyList) {
             galaxyList.appendChild(galaxyItem);
         }
     });
 
     // Добавляем функционал для кнопок прокрутки
     const scrollWrapper = document.getElementById('galaxy-list-wrapper');
     const scrollLeftBtn = document.getElementById('galaxy-scroll-left');
     const scrollRightBtn = document.getElementById('galaxy-scroll-right');
 
     if (scrollWrapper && scrollLeftBtn && scrollRightBtn) {
         const scrollAmount = 200;
 
         scrollLeftBtn.addEventListener('click', () => {
             scrollWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
         });
 
         scrollRightBtn.addEventListener('click', () => {
             scrollWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
         });
     }

    function createPlanets() {
        if (!orbitsContainer) return;

        fetch('/api/startups/')
            .then(response => response.json())
            .then(data => {
                startups = {};
                data.forEach(startup => {
                    startups[startup.id] = startup;
                });
                
                const orbits = orbitsContainer.querySelectorAll('.orbit');
                orbits.forEach((orbit, index) => {
                    const startupId = Object.keys(startups)[index];
                    if (!startupId) return;

                    const startup = startups[startupId];
                    const planetOrientation = document.createElement('div');
                    planetOrientation.className = 'planet-orientation';

                    const planet = document.createElement('div');
                    planet.className = 'planet';
                    planet.style.setProperty('--planet-size', `${50 + Math.random() * 20}px`);
                    planet.dataset.id = startup.id;
                    planet.style.backgroundImage = `url('${startup.planet_image || '/static/accounts/images/planets/default_planet.png'}')`;
                    
                    planetOrientation.appendChild(planet);
                    orbit.innerHTML = '';
                    orbit.appendChild(planetOrientation);

                    const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size'));
                    const orbitTime = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-time'));
                    
                    planetObjects.push({
                        element: planet,
                        orientation: planetOrientation,
                        orbit: orbit,
                        size: parseFloat(getComputedStyle(planet).getPropertyValue('--planet-size')),
                        orbitSize: orbitSize,
                        orbitTime: orbitTime,
                        angle: Math.random() * 360,
                        speedFactor: 0.8 + Math.random() * 0.4,
                        startTime: Date.now() - Math.random() * orbitTime * 1000
                    });

                    planet.addEventListener('click', (e) => onPlanetClick(e, startup));
                });

                requestAnimationFrame(updatePlanets);
            })
            .catch(error => console.error('Error fetching startups:', error));
    }
    
    function onPlanetClick(e, startup) {
        e.stopPropagation();

        if (planetImage) planetImage.style.backgroundImage = `url('${startup.planet_image}')`;
        if (startupName) startupName.textContent = startup.name;
        if (startupRating) startupRating.textContent = `Рейтинг ${startup.rating || 'N/A'}`;
        if (startupProgress) startupProgress.textContent = `${startup.investment_percentage || 0}%`;
        if (startupFunding) startupFunding.textContent = `Собрано: ${startup.collected_amount_display || '0'}`;
        if (startupInvestors) startupInvestors.textContent = `Инвесторов: ${startup.investors_count || 0}`;
        if (startupDescription) startupDescription.textContent = startup.short_description;
        if (moreDetails) moreDetails.onclick = () => { window.location.href = `/startup/${startup.id}/`; };

        document.querySelectorAll('.planet').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if(infoCard) infoCard.style.display = 'block';

        isPaused = true;
        pausedTime = Date.now();
        lastInteractionTime = Date.now();
    }
    
    function closeInfoCard() {
        if(infoCard) infoCard.style.display = 'none';
        document.querySelectorAll('.planet').forEach(p => p.classList.remove('active'));

        if (isPaused) {
            const pauseDuration = Date.now() - pausedTime;
            planetObjects.forEach(planetObj => {
                planetObj.startTime += pauseDuration;
            });
            isPaused = false;
        }
        lastInteractionTime = Date.now();
    }
    
    if (closeCard) closeCard.addEventListener('click', closeInfoCard);
    if (moreDetails) moreDetails.addEventListener('click', closeInfoCard); // Также закрываем карточку при клике "Подробнее"

    function handleDrag(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        rotationY += deltaX * 0.2;
        rotationX -= deltaY * 0.2;
        rotationX = Math.max(-90, Math.min(90, rotationX)); // Ограничиваем наклон
        
        if (galaxy) galaxy.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
        
        startX = e.clientX;
        startY = e.clientY;
        lastInteractionTime = Date.now();
    }

    if (solarSystem) {
        solarSystem.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            solarSystem.classList.add('dragging');
            lastInteractionTime = Date.now();
            isReturningToCenter = false;
        });

        solarSystem.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            scale = Math.max(0.5, Math.min(3, scale + delta));
            if(scene) scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            lastInteractionTime = Date.now();
            isReturningToCenter = false;
        });
    }

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if(solarSystem) solarSystem.classList.remove('dragging');
        lastInteractionTime = Date.now();
    });

    function checkInactivity() {
        // ... (логика возвращения в центр, если нужна)
    }
    // setInterval(checkInactivity, 1000);

    function updatePlanets() {
        if (!isPaused) {
            const now = Date.now();
            planetObjects.forEach(planetObj => {
                const elapsedSeconds = (now - planetObj.startTime) / 1000;
                const orbitTimeSeconds = planetObj.orbitTime * planetObj.speedFactor;
                const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
                const angle = planetObj.angle + progress * 360;
                const angleRad = angle * Math.PI / 180;
                
                const radius = planetObj.orbitSize / 2;
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;
                
                if (planetObj.orientation) {
                    planetObj.orientation.style.left = `${50 + 50 * (x / radius)}%`;
                    planetObj.orientation.style.top = `${50 + 50 * (y / radius)}%`;
                }

                if (planetObj.element) {
                    const tiltCompensation = -rotationX; // Компенсируем наклон всей галактики
                    const rotationYCompensation = -rotationY; // Компенсируем вращение всей галактики
                    planetObj.element.style.transform = `rotateX(${tiltCompensation}deg) rotateY(${rotationYCompensation}deg)`;
                }
            });
        }
        requestAnimationFrame(updatePlanets);
    }
    
    function switchGalaxy(galaxyName) {
        if (currentGalaxy === galaxyName) return;
        currentGalaxy = galaxyName;

        document.querySelectorAll('.galaxy-item').forEach(item => {
            item.classList.remove('selected');
            if (item.querySelector('span').textContent === galaxyName) {
                item.classList.add('selected');
            }
        });

        // Здесь логика для смены стартапов (планет)
        console.log(`Switched to galaxy: ${galaxyName}`);
        planetObjects = []; // Очищаем старые планеты
        createPlanets(); // Создаем новые для выбранной "галактики" (категории)
        lastInteractionTime = Date.now();
    }

    createPlanets();
});
