document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const container = document.getElementById('planetary-system-container');
    if (!container) return;

    const scene = container.querySelector('#scene');
    const galaxy = container.querySelector('#galaxy');
    const orbits = Array.from(container.querySelectorAll('.orbit'));
    const galaxyList = document.getElementById('galaxy-list');
    const logoElement = document.getElementById('logo');

    // --- Info Card Elements ---
    const infoCard = document.getElementById('info-card');
    const planetImage = document.getElementById('planet-image');
    const startupName = document.getElementById('startup-name');
    const startupRating = document.getElementById('startup-rating');
    const startupProgress = document.getElementById('startup-progress');
    const startupFunding = document.getElementById('startup-funding');
    const startupInvestors = document.getElementById('startup-investors');
    const startupDescription = document.getElementById('startup-description');
    const closeCard = document.getElementById('close-card');
    const moreDetailsButton = document.getElementById('more-details');

    // --- State variables ---
    let rotationX = 45;
    let rotationY = 0;
    let scale = 1.0;
    let isDragging = false;
    let startX, startY;
    let isPaused = false;
    let isReturningToCenter = false;
    let lastInteractionTime = Date.now();
    const inactivityTimeout = 10000; // 10 seconds

    // --- Data ---
    const startupsData = [
        { id: '1', name: 'MediTech', description: 'Наш стартап разрабатывает инновационную платформу для телемедицины.', rating: '4.2/5 (534)', progress: '65%', funding: '345 678 ₽', investors: 'Инвесторов: 648', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/Clip%20path%20group-1.png' },
        { id: '2', name: 'SmartHomeAI', description: 'Решения для умного дома с использованием ИИ для автоматизации.', rating: '4.5/5 (789)', progress: '72%', funding: '1 234 567 ₽', investors: 'Инвесторов: 892', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/Clip%20path%20group.png' },
        { id: '3', name: 'EcoCycle', description: 'Экологичные технологии для переработки отходов.', rating: '4.0/5 (321)', progress: '58%', funding: '789 123 ₽', investors: 'Инвесторов: 456', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/_%D0%A0%D0%B5%D0%B6%D0%B8%D0%BC_%D0%B8%D0%B7%D0%BE%D0%BB%D1%8F%D1%86%D0_B8%D0_B8-3.png' },
        { id: '4', name: 'EduVR', description: 'Образовательная платформа с использованием виртуальной реальности.', rating: '4.8/5 (987)', progress: '80%', funding: '2 345 678 ₽', investors: 'Инвесторов: 1234', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/_%D0%A0%D0%B5%D0%B6%D0%B8%D0%BC_%D0%B8%D0%B7%D0%BE%D0%BB%D1%8F%D1%86%D0_B8%D0_B8-4.png' },
        { id: '5', name: 'FinEasy', description: 'Финтех-решения для малого бизнеса и стартапов.', rating: '4.3/5 (654)', progress: '60%', funding: '567 890 ₽', investors: 'Инвесторов: 789', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/_%D0%A0%D0%B5%D0%B6%D0%B8%D0%BC_%D0%B8%D0_B7%D0%BE%D0%BB%D1%8F%D1%86%D0_B8%D0_B8-5.png' },
        { id: '6', name: 'BioHealth', description: 'Биотехнологии для улучшения здоровья и долголетия.', rating: '4.6/5 (432)', progress: '75%', funding: '1 987 654 ₽', investors: 'Инвесторов: 567', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/_%D0%A0%D0%B5%D0%B6%D0_B8%D0_BC_%D0%B8%D0_B7%D0%BE%D0%BB%D1%8F%D1%86%D0_B8%D0_B8-6.png' },
        { id: '7', name: 'CyberShield', description: 'Решения в области кибербезопасности для IoT-устройств.', rating: '4.1/5 (876)', progress: '62%', funding: '876 543 ₽', investors: 'Инвесторов: 345', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/_%D0%A0%D0%B5%D0%B6%D0_B8%D0_BC_%D0%B8%D0_B7%D0%BE%D0%BB%D1%8F%D1%86%D0_B8%D0_B8-7.png' },
        { id: '8', name: 'AgroSustain', description: 'Технологии для устойчивого земледелия и агрокультуры.', rating: '4.7/5 (543)', progress: '70%', funding: '1 543 210 ₽', investors: 'Инвесторов: 678', image: 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/_%D0%A0%D0%B5%D0%B6%D0_B8%D0%BC_%D0%B8%D0_B7%D0%BE%D0%BB%D1%8F%D1%86%D0_B8%D0_B8-2.png' }
    ];
    let planetObjects = [];

    function createPlanets() {
        // Clear existing planets from scene
        planetObjects.forEach(p => p.element.remove());
        planetObjects = [];

        orbits.forEach((orbit, index) => {
            if (!startupsData[index]) return;

            const planetData = startupsData[index];
            const planetSize = 40 + Math.random() * 30;
            const orbitRadius = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size')) / 2;

            const planet = document.createElement('div');
            planet.className = 'planet';
            planet.style.setProperty('--planet-size', `${planetSize}px`);
            planet.dataset.bgUrl = planetData.image;
            planet.dataset.id = planetData.id;

            galaxy.appendChild(planet); // Append planet to galaxy container

            const planetObject = {
                element: planet,
                orbitRadius: orbitRadius,
                angle: Math.random() * 360,
                speed: (0.1 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1),
                size: planetSize,
                hoverScale: 1.0,
            };

            planetObjects.push(planetObject);

            planet.addEventListener('mouseenter', () => {
                if (!isDragging) {
                    planetObject.hoverScale = 1.15;
                    container.style.cursor = 'pointer';
                    lastInteractionTime = Date.now();
                }
            });

            planet.addEventListener('mouseleave', () => {
                planetObject.hoverScale = 1.0;
                if (!isDragging) container.style.cursor = 'grab';
                lastInteractionTime = Date.now();
            });

            planet.addEventListener('click', (e) => {
                e.stopPropagation();
                planetObjects.forEach(p => p.element.classList.remove('active'));
                planet.classList.add('active');

                const startup = startupsData.find(s => s.id === planet.dataset.id);
                if (startup) {
                    planetImage.style.backgroundImage = `url('${startup.image}')`;
                    startupName.textContent = startup.name;
                    startupRating.textContent = `Рейтинг ${startup.rating}`;
                    startupProgress.style.width = startup.progress;
                    startupProgress.textContent = startup.progress;
                    startupFunding.textContent = `Цель: ${startup.funding}`;
                    startupInvestors.textContent = startup.investors;
                    startupDescription.textContent = startup.description;

                    infoCard.style.display = 'block';
                    isPaused = true;
                    lastInteractionTime = Date.now();
                }
            });
        });
    }

    function closeInfoCard() {
        infoCard.style.display = 'none';
        isPaused = false;
        planetObjects.forEach(p => p.element.classList.remove('active'));
        lastInteractionTime = Date.now();
    }

    function updateSystem() {
        if (logoElement && logoElement.dataset.bgUrl && !logoElement.style.backgroundImage) {
            logoElement.style.backgroundImage = `url('${logoElement.dataset.bgUrl}')`;
        }
        planetObjects.forEach(p => {
            if (p.element.dataset.bgUrl && !p.element.style.backgroundImage) {
                p.element.style.backgroundImage = `url('${p.element.dataset.bgUrl}')`;
            }
        });

        if (isPaused) {
            requestAnimationFrame(updateSystem);
            return;
        }

        const now = Date.now();
        if (!isDragging && !isReturningToCenter && now - lastInteractionTime > inactivityTimeout) {
            isReturningToCenter = true;
            const targetRotX = 45, targetRotY = 0, targetScale = 1.0;
            const startRotX = rotationX, startRotY = rotationY, startScale = scale;
            const duration = 2000;
            let startTime = null;

            function animateReturn(timestamp) {
                if (!isReturningToCenter) return;
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutProgress = 1 - Math.pow(1 - progress, 4);

                rotationX = startRotX + (targetRotX - startRotX) * easeOutProgress;
                rotationY = startRotY + (targetRotY - startRotY) * easeOutProgress;
                scale = startScale + (targetScale - startScale) * easeOutProgress;

                if (progress < 1) {
                    requestAnimationFrame(animateReturn);
                } else {
                    isReturningToCenter = false;
                }
            }
            requestAnimationFrame(animateReturn);
        }

        if (!isDragging) {
            rotationY += 0.02; // Slow auto-rotation
        }

        const galaxyRadX = rotationX * Math.PI / 180;
        const galaxyRadY = rotationY * Math.PI / 180;
        const cosX = Math.cos(galaxyRadX);
        const sinX = Math.sin(galaxyRadX);
        const cosY = Math.cos(galaxyRadY);
        const sinY = Math.sin(galaxyRadY);

        planetObjects.forEach(p => {
            if (!isDragging) {
                p.angle += p.speed;
            }

            const r = p.orbitRadius;
            let x = Math.cos(p.angle * Math.PI / 180) * r;
            let y = Math.sin(p.angle * Math.PI / 180) * r;
            let z = 0;

            let tempY = y * cosX - z * sinX;
            let tempZ = y * sinX + z * cosX;
            y = tempY;
            z = tempZ;

            let tempX = x * cosY - z * sinY;
            tempZ = x * sinY + z * cosY;
            x = tempX;
            z = tempZ;

            const finalScale = scale * p.hoverScale;
            p.element.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${finalScale}) rotateY(${-rotationY}deg) rotateX(${-rotationX}deg)`;
            p.element.style.zIndex = Math.round(z + 1000);
        });

        galaxy.style.transform = `scale(${scale}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

        requestAnimationFrame(updateSystem);
    }

    function init() {
        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.planet') || e.target.closest('#info-card') || e.target.closest('#galaxy-selector')) return;
            e.preventDefault();
            isDragging = true;
            isReturningToCenter = false;
            lastInteractionTime = Date.now();
            startX = e.clientX;
            startY = e.clientY;
            container.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            rotationY += deltaX * 0.2;
            rotationX -= deltaY * 0.2;
            rotationX = Math.max(-20, Math.min(80, rotationX)); // Limit pitch
            startX = e.clientX;
            startY = e.clientY;
            lastInteractionTime = Date.now();
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
            lastInteractionTime = Date.now();
        });

        container.addEventListener('wheel', (e) => {
            if (e.target.closest('#info-card') || e.target.closest('#galaxy-selector')) return;
            e.preventDefault();
            isReturningToCenter = false;
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            scale = Math.max(0.5, Math.min(2.5, scale + delta));
            lastInteractionTime = Date.now();
        });

        closeCard.addEventListener('click', closeInfoCard);
        moreDetailsButton.addEventListener('click', closeInfoCard);
        infoCard.addEventListener('mousedown', (e) => e.stopPropagation());
        infoCard.addEventListener('wheel', (e) => e.stopPropagation());

        createPlanets();
        requestAnimationFrame(updateSystem);
    }

    init();
});
