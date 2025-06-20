document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('planetary-system-data');
    if (!dataElement) {
        console.error('Planetary system data element not found!');
        return;
    }
    const appData = JSON.parse(dataElement.textContent);
    const { startups, categories: galaxyNames, categoryImageUrl, logoImageUrl } = appData;

    const planets = [];
    const orbits = document.querySelectorAll('.orbit');
    const infoCard = document.getElementById('info-card');
    const planetInfoContent = document.getElementById('planet-info-content');
    const sunInfoContent = document.getElementById('sun-info-content');
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
    const galaxySelector = document.getElementById('galaxy-selector');
    const galaxySelectorPrev = document.getElementById('galaxy-selector-prev');
    const galaxySelectorNext = document.getElementById('galaxy-selector-next');

    if (logoElement && logoImageUrl) {
        logoElement.style.backgroundImage = `url('${logoImageUrl}')`;
    }

    let isPaused = false;
    let pausedTime = 0;
    
    let isDragging = false;
    let startX, startY;
    let rotationX = 65; 
    let rotationY = 0;
    let scale = 1;

    let currentGalaxy = galaxyNames[0];

    const showInfoCard = (contentToShow, targetElement) => {
        // Hide all content blocks first
        planetInfoContent.style.display = 'none';
        sunInfoContent.style.display = 'none';
        // Show the specific content block
        contentToShow.style.display = 'block';

        infoCard.classList.add('visible');

        const containerRect = solarSystem.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const cardRect = infoCard.getBoundingClientRect();

        let top = targetRect.top - containerRect.top + (targetRect.height / 2) - (cardRect.height / 2);
        let left = targetRect.left - containerRect.left + targetRect.width + 20;

        if (left + cardRect.width > containerRect.width) {
            left = targetRect.left - containerRect.left - cardRect.width - 20;
        }
        if (left < 0) {
            left = targetRect.left - containerRect.left + targetRect.width + 20;
        }
        if (top + cardRect.height > containerRect.height) {
            top = containerRect.height - cardRect.height - 10;
        }
        if (top < 0) {
            top = 10;
        }

        infoCard.style.left = `${left}px`;
        infoCard.style.top = `${top}px`;
        
        pauseAnimation();
    };

    const hideInfoCard = () => {
        infoCard.classList.remove('visible');
        resumeAnimation();
    };

    function populatePlanets(category) {
        galaxy.querySelectorAll('.planet-orientation').forEach(p => p.remove());
        planets.length = 0;
        const filteredStartups = startups.filter(s => s.direction === category || category === 'Все');
        
        filteredStartups.forEach((startup, index) => {
            if (index >= orbits.length) return;
            
            const orbit = orbits[index];
            const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size'));
            
            const planetOrientation = document.createElement('div');
            planetOrientation.className = 'planet-orientation';
            
            const planetEl = document.createElement('div');
            planetEl.className = 'planet';
            planetEl.style.setProperty('--planet-size', `${50 + Math.random() * 20}px`);
            planetEl.style.backgroundImage = `url('${startup.planet_image_url}')`;
            
            planetOrientation.appendChild(planetEl);
            orbit.appendChild(planetOrientation);

            const planetObj = {
                element: planetEl,
                orientation: planetOrientation,
                orbit: orbit,
                orbitSize: orbitSize,
                angle: Math.random() * 360,
                speedFactor: 0.8 + Math.random() * 0.4,
                startTime: Date.now() - Math.random() * 100000
            };
            planets.push(planetObj);

            planetEl.addEventListener('click', (e) => {
                e.stopPropagation();
                
                planetImage.style.backgroundImage = `url('${startup.planet_image_url}')`;
                startupName.textContent = startup.name;
                startupRating.textContent = `Рейтинг ${startup.rating_avg.toFixed(1)}/5 (${startup.rating_count})`;
                startupProgress.textContent = `${startup.investment_progress.toFixed(0)}%`;
                startupFunding.textContent = `Цель: ${startup.investment_goal} ₽`;
                startupInvestors.textContent = `Инвесторов: ${startup.investors_count}`;
                startupDescription.textContent = startup.short_description;
                if(moreDetails) {
                    moreDetails.onclick = () => window.location.href = startup.url;
                }

                document.querySelectorAll('.planet').forEach(p => p.classList.remove('active'));
                planetEl.classList.add('active');
                
                showInfoCard(planetInfoContent, planetEl);
            });
        });
    }

    logoElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showInfoCard(sunInfoContent, logoElement);
    });

    function initGalaxySelector() {
        galaxyList.innerHTML = '';

        galaxyNames.forEach(name => {
            const galaxyItem = document.createElement('div');
            galaxyItem.className = 'galaxy-item';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'category-image-container';
            const img = document.createElement('img');
            img.src = categoryImageUrl; 
            img.alt = name;
            imgContainer.appendChild(img);

            const nameWrapper = document.createElement('div');
            nameWrapper.className = 'galaxy-name-wrapper';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'galaxy-name';
            nameSpan.textContent = name;
            nameWrapper.appendChild(nameSpan);

            galaxyItem.appendChild(imgContainer);
            galaxyItem.appendChild(nameWrapper);

            if (name === currentGalaxy) {
                galaxyItem.classList.add('selected');
            }

            galaxyItem.addEventListener('click', () => {
                switchGalaxy(name);
            });

            galaxyList.appendChild(galaxyItem);
        });
        updateGalaxySelectorScroll(false);
    }
    
    function switchGalaxy(name) {
        if (currentGalaxy === name) return;
        currentGalaxy = name;
        document.querySelectorAll('.galaxy-item').forEach(item => {
            const itemName = item.querySelector('.galaxy-name').textContent;
            item.classList.toggle('selected', itemName === name);
        });
        populatePlanets(currentGalaxy);
        updateGalaxySelectorScroll();
    }
    
    function updateGalaxySelectorScroll(animated = true) {
        const selected = galaxyList.querySelector('.galaxy-item.selected');
        if (!selected) return;
        const listWidth = galaxySelector.offsetWidth;
        const selectedLeft = selected.offsetLeft;
        const selectedWidth = selected.offsetWidth;
        const scrollLeft = selectedLeft - (listWidth / 2) + (selectedWidth / 2);
        
        galaxyList.style.transition = animated ? 'transform 0.5s ease' : 'none';
        galaxyList.style.transform = `translateX(${-scrollLeft}px)`;
    }

    galaxySelectorPrev.addEventListener('click', () => {
        let currentIndex = galaxyNames.indexOf(currentGalaxy);
        currentIndex = (currentIndex - 1 + galaxyNames.length) % galaxyNames.length;
        switchGalaxy(galaxyNames[currentIndex]);
    });

    galaxySelectorNext.addEventListener('click', () => {
        let currentIndex = galaxyNames.indexOf(currentGalaxy);
        currentIndex = (currentIndex + 1) % galaxyNames.length;
        switchGalaxy(galaxyNames[currentIndex]);
    });

    function pauseAnimation() {
        if (!isPaused) {
            isPaused = true;
            pausedTime = Date.now();
        }
    }

    function resumeAnimation() {
        if (isPaused) {
            const pauseDuration = Date.now() - pausedTime;
            planets.forEach(p => {
                p.startTime += pauseDuration;
            });
            isPaused = false;
        }
    }

    closeCard.addEventListener('click', () => {
        hideInfoCard();
        document.querySelectorAll('.planet').forEach(p => p.classList.remove('active'));
    });

    if (moreDetails) {
        moreDetails.addEventListener('click', () => {});
    }

    function updatePositions() {
        if (!isPaused) {
            const now = Date.now();
            planets.forEach(p => {
                const elapsedSeconds = (now - p.startTime) / 1000;
                const orbitTime = p.orbit.style.getPropertyValue('--orbit-time');
                const orbitTimeSeconds = parseFloat(orbitTime.replace('s', '')) * p.speedFactor;
                const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
                const angle = p.angle + progress * 360;
                const angleRad = angle * Math.PI / 180;
                const radius = p.orbitSize / 2;
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;
                
                p.orientation.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                p.element.style.transform = `rotateY(${-rotationY}deg) rotateX(${-rotationX}deg)`;
            });
        }
        requestAnimationFrame(updatePositions);
    }
    
    solarSystem.addEventListener('mousedown', (e) => {
        if (e.target.closest('#galaxy-selector-container') || e.target.closest('#info-card')) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        solarSystem.classList.add('dragging');
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        solarSystem.classList.remove('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            rotationY += deltaX * 0.2;
            rotationX -= deltaY * 0.2;
            rotationX = Math.max(-90, Math.min(90, rotationX));

            galaxy.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

            startX = e.clientX;
            startY = e.clientY;
        }
    });

    solarSystem.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(2.5, scale + delta));
        scene.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });
    
    scene.style.transform = `translate(-50%, -50%) scale(${scale})`;
    galaxy.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

    initGalaxySelector();
    populatePlanets(currentGalaxy);
    requestAnimationFrame(updatePositions);
    window.addEventListener('resize', () => updateGalaxySelectorScroll(false));
});
