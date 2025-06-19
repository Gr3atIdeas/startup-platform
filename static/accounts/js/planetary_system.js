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
    if (!container) return;

    const logoElement = container.querySelector('#logo');
    if (logoElement && logoElement.dataset.bgUrl) {
        logoElement.style.backgroundImage = `url('${logoElement.dataset.bgUrl}')`;
    }

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
    const scene = container.querySelector('#scene');
    const galaxy = container.querySelector('#galaxy');
    const orbits = Array.from(container.querySelectorAll('.orbit'));
    
    const planetObjects = [];
    let isPaused = false;
    let pausedTime = 0;
    let lastInteractionTime = Date.now();
    const inactivityTimeout = 10000;
    let isReturningToCenter = false;
    let rotationX = 45;
    let rotationY = 0;
    let scale = 1;

    function createPlanets() {
        // Clear existing planets before creating new ones
        orbits.forEach(orbit => orbit.innerHTML = '');
        planetObjects.length = 0;

        Object.keys(startups).forEach((id, index) => {
            const startup = startups[id];
            const orbit = orbits[index % orbits.length];

            const planetOrientation = document.createElement('div');
            planetOrientation.className = 'planet-orientation';

            const planetEl = document.createElement('div');
            planetEl.className = 'planet';
            planetEl.setAttribute('data-id', id);
            
            const randomSize = 40 + Math.random() * 30;
            planetEl.style.setProperty('--planet-size', `${randomSize}px`);
            planetEl.style.backgroundImage = `url('${startup.image}')`;

            planetOrientation.appendChild(planetEl);
            orbit.appendChild(planetOrientation);
            
            const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size'));
            const orbitTime = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-time'));

            planetObjects.push({
                element: planetEl,
                orientation: planetOrientation,
                orbit: orbit,
                size: randomSize,
                orbitSize: orbitSize,
                orbitTime: orbitTime,
                angle: Math.random() * 360,
                speedFactor: 0.8 + Math.random() * 0.4,
                startTime: Date.now() - Math.random() * orbitTime * 1000
            });

            planetEl.addEventListener('click', (e) => {
                e.stopPropagation();
                planetImage.style.backgroundImage = `url('${startup.image}')`;
                startupName.textContent = startup.name;
                startupRating.textContent = `Рейтинг ${startup.rating}`;
                startupProgress.textContent = startup.progress;
                startupFunding.textContent = `Цель финансирования: ${startup.funding}`;
                startupInvestors.textContent = startup.investors;
                startupDescription.textContent = startup.description;

                document.querySelectorAll('.planet').forEach(p => p.classList.remove('active'));
                planetEl.classList.add('active');
                infoCard.style.display = 'block';

                isPaused = true;
                pausedTime = Date.now();
                lastInteractionTime = Date.now();
            });
        });
    }


    function closeInfoCard() {
        infoCard.style.display = 'none';
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

    closeCard.addEventListener('click', closeInfoCard);
    moreDetails.addEventListener('click', closeInfoCard);

    let isDragging = false, startX, startY;

    container.addEventListener('mousedown', (e) => {
        if (e.target.closest('#galaxy-selector') || e.target.closest('#info-card')) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        container.classList.add('dragging');
        lastInteractionTime = Date.now();
        isReturningToCenter = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        rotationY += deltaX * 0.2;
        rotationX -= deltaY * 0.2;
        rotationX = Math.max(-90, Math.min(90, rotationX));
        galaxy.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
        startX = e.clientX;
        startY = e.clientY;
        lastInteractionTime = Date.now();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.classList.remove('dragging');
        lastInteractionTime = Date.now();
    });

    container.addEventListener('wheel', (e) => {
        if (e.target.closest('#galaxy-selector')) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        scene.style.transform = `translate(-50%, -50%) scale(${scale})`;
        lastInteractionTime = Date.now();
        isReturningToCenter = false;
    });

    infoCard.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        lastInteractionTime = Date.now();
    });

    function checkInactivity() {
        const now = Date.now();
        if (now - lastInteractionTime >= inactivityTimeout && !isReturningToCenter && !isPaused) {
            isReturningToCenter = true;
            const startRotX = rotationX;
            const startRotY = rotationY;
            const endRotX = 45;
            const endRotY = 0;
            const duration = 1000;
            let startTime = null;

            function animateReturn(timestamp) {
                if (!startTime) startTime = timestamp;
                let progress = Math.min((timestamp - startTime) / duration, 1);
                progress = 0.5 - 0.5 * Math.cos(progress * Math.PI);

                rotationX = startRotX + (endRotX - startRotX) * progress;
                rotationY = startRotY + (endRotY - startRotY) * progress;
                galaxy.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
                
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
        if (!isPaused) {
            const now = Date.now();
            planetObjects.forEach(p => {
                const elapsedSeconds = (now - p.startTime) / 1000;
                const orbitTimeSeconds = p.orbitTime * p.speedFactor;
                const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
                const angleRad = (p.angle + progress * 360) * Math.PI / 180;
                const radius = p.orbitSize / 2;
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;
                p.orientation.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                p.element.style.transform = `rotateY(${-rotationY}deg) rotateX(${-rotationX}deg)`;
            });
        }
        requestAnimationFrame(updatePlanets);
    }

    createPlanets();
    updatePlanets();
});
