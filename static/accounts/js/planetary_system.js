document.addEventListener('DOMContentLoaded', function () {
    const startups = {
      '1': {
        name: 'MediTech',
        description: 'Наш стартап разрабатывает инновационную платформу для телемедицины.',
        rating: '4.2/5 (534)',
        progress: '65%',
        funding: '345 678 ₽',
        investors: 'Инвесторов: 648',
        image: '/static/accounts/images/planetary_system/planets_round/1.png'
      },
      '2': {
        name: 'SmartHomeAI',
        description: 'Решения для умного дома с использованием ИИ для автоматизации.',
        rating: '4.5/5 (789)',
        progress: '72%',
        funding: '1 234 567 ₽',
        investors: 'Инвесторов: 892',
        image: '/static/accounts/images/planetary_system/planets_round/2.png'
      },
      '3': {
        name: 'EcoCycle',
        description: 'Экологичные технологии для переработки отходов.',
        rating: '4.0/5 (321)',
        progress: '58%',
        funding: '789 123 ₽',
        investors: 'Инвесторов: 456',
        image: '/static/accounts/images/planetary_system/planets_round/3.png'
      },
      '4': {
        name: 'EduVR',
        description: 'Образовательная платформа с использованием виртуальной реальности.',
        rating: '4.8/5 (987)',
        progress: '80%',
        funding: '2 345 678 ₽',
        investors: 'Инвесторов: 1234',
        image: '/static/accounts/images/planetary_system/planets_round/4.png'
      },
      '5': {
        name: 'FinEasy',
        description: 'Финтех-решения для малого бизнеса и стартапов.',
        rating: '4.3/5 (654)',
        progress: '60%',
        funding: '567 890 ₽',
        investors: 'Инвесторов: 789',
        image: '/static/accounts/images/planetary_system/planets_round/5.png'
      },
      '6': {
        name: 'BioHealth',
        description: 'Биотехнологии для улучшения здоровья и долголетия.',
        rating: '4.6/5 (432)',
        progress: '75%',
        funding: '1 987 654 ₽',
        investors: 'Инвесторов: 567',
        image: '/static/accounts/images/planetary_system/planets_round/6.png'
      },
      '7': {
        name: 'CyberShield',
        description: 'Решения в области кибербезопасности для IoT-устройств.',
        rating: '4.1/5 (876)',
        progress: '62%',
        funding: '876 543 ₽',
        investors: 'Инвесторов: 345',
        image: '/static/accounts/images/planetary_system/planets_round/7.png'
      },
      '8': {
        name: 'AgroSustain',
        description: 'Технологии для устойчивого земледелия и агрокультуры.',
        rating: '4.7/5 (543)',
        progress: '70%',
        funding: '1 543 210 ₽',
        investors: 'Инвесторов: 678',
        image: '/static/accounts/images/planetary_system/planets_round/8.png'
      }
    };

    const container = document.getElementById('planetary-system-container');
    if (!container) return; // Exit if the container is not found

    const planets = container.querySelectorAll('.planet');
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
    const solarSystem = container.querySelector('#solar-system');
    const scene = container.querySelector('#scene');

    const planetObjects = [];
    let isPaused = false;
    let pausedTime = 0;
    let lastInteractionTime = Date.now();
    const inactivityTimeout = 10000;
    let isReturningToCenter = false;

    planets.forEach((planet, index) => {
        const orbit = planet.closest('.orbit');
        const planetOrientation = planet.closest('.planet-orientation');
        
        const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size'));
        const orbitTime = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-time'));
        
        const initialAngle = Math.random() * 360;
        const speedFactor = 0.8 + Math.random() * 0.4;
        
        planetObjects.push({
            element: planet,
            orientation: planetOrientation,
            orbit: orbit,
            size: parseFloat(getComputedStyle(planet).getPropertyValue('--planet-size')),
            orbitSize: orbitSize,
            orbitTime: orbitTime,
            angle: initialAngle,
            speedFactor: speedFactor,
            startTime: Date.now() - Math.random() * orbitTime * 1000
        });

        const id = planet.getAttribute('data-id');
        planet.style.backgroundImage = `url('${startups[id].image}')`;
        
        planet.addEventListener('click', (e) => {
            e.stopPropagation();
            const startup = startups[id];

            planetImage.style.backgroundImage = `url('${startup.image}')`;
            startupName.textContent = startup.name;
            startupRating.textContent = `Рейтинг ${startup.rating}`;
            startupProgress.textContent = startup.progress;
            startupFunding.textContent = `Цель финансирования: ${startup.funding}`;
            startupInvestors.textContent = startup.investors;
            startupDescription.textContent = startup.description;

            planets.forEach(p => p.classList.remove('active'));
            planet.classList.add('active');
            infoCard.style.display = 'block';

            isPaused = true;
            pausedTime = Date.now();
            lastInteractionTime = Date.now();
        });
    });

    function closeInfoCard() {
        infoCard.style.display = 'none';
        planets.forEach(p => p.classList.remove('active'));

        if (isPaused) {
            const pauseDuration = Date.now() - pausedTime;
            planetObjects.forEach(planetObj => {
                planetObj.startTime += pauseDuration;
            });
            isPaused = false;
        }
        lastInteractionTime = Date.now();
    }

    closeCard.addEventListener('click', closeInfoCard);
    moreDetails.addEventListener('click', closeInfoCard);

    let isDragging = false;
    let startX, startY;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    solarSystem.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        solarSystem.classList.add('dragging');
        lastInteractionTime = Date.now();
        isReturningToCenter = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        offsetX += deltaX;
        offsetY += deltaY;
        offsetX = Math.max(-window.innerWidth / 4, Math.min(window.innerWidth / 4, offsetX));
        offsetY = Math.max(-window.innerHeight / 4, Math.min(window.innerHeight / 4, offsetY));
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

    solarSystem.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(2, scale + delta));
        scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        lastInteractionTime = Date.now();
        isReturningToCenter = false;
    });

    infoCard.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        lastInteractionTime = Date.now();
    });

    function checkInactivity() {
        const now = Date.now();
        if (now - lastInteractionTime >= inactivityTimeout && !isReturningToCenter && !isPaused && (offsetX !== 0 || offsetY !== 0)) {
            isReturningToCenter = true;
            const startX = offsetX;
            const startY = offsetY;
            const duration = 1000;
            let startTime = null;

            function animateReturn(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);

                offsetX = startX + (0 - startX) * progress;
                offsetY = startY + (0 - startY) * progress;

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

    function updatePlanets() {
        if (isPaused) {
            requestAnimationFrame(updatePlanets);
            return;
        }

        const now = Date.now();
        const galaxyTiltAngle = 45;

        planetObjects.forEach(planetObj => {
            const elapsedSeconds = (now - planetObj.startTime) / 1000;
            const orbitTimeSeconds = planetObj.orbitTime * planetObj.speedFactor;
            const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
            const angle = planetObj.angle + progress * 360;
            const angleRad = angle * Math.PI / 180;
            
            const radius = planetObj.orbitSize / 2;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;
            
            planetObj.orientation.style.left = `${50 + 50 * (x / radius)}%`;
            planetObj.orientation.style.top = `${50 + 50 * (y / radius)}%`;

            const tiltCompensation = -galaxyTiltAngle;
            planetObj.element.style.transform = `rotateX(${tiltCompensation}deg)`;
        });
        
        requestAnimationFrame(updatePlanets);
    }

    updatePlanets();
});
