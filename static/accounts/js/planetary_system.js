document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('planetary-system-data');
    if (!dataElement) {
        console.error('Planetary system data element not found!');
        return;
    }
    const appData = JSON.parse(dataElement.textContent);
    const { startups, categories } = appData;

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

    let currentGalaxy = categories.length > 0 ? categories[0].name : "Все";

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

    function populatePlanets(categoryName) {
        galaxy.querySelectorAll('.planet-orientation').forEach(p => p.remove());
        planets.length = 0;
        const filteredStartups = startups.filter(s => s.direction_name === categoryName || categoryName === 'Все');
        
        filteredStartups.forEach((startup, index) => {
            if (index >= orbits.length) return;
            
            const orbit = orbits[index];
            const orbitSize = parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size'));
            
            const planetOrientation = document.createElement('div');
            planetOrientation.className = 'planet-orientation';
            
            const planetEl = document.createElement('div');
            planetEl.className = 'planet';
            planetEl.style.setProperty('--planet-size', `${50 + Math.random() * 20}px`);
            planetEl.style.backgroundImage = `url('${startup.image}')`;
            
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
                
                planetImage.style.backgroundImage = `url('${startup.image}')`;
                startupName.textContent = startup.name;
                startupRating.textContent = startup.rating;
                startupProgress.textContent = startup.progress;
                startupFunding.textContent = startup.funding;
                startupInvestors.textContent = startup.investors;
                startupDescription.textContent = startup.description;
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

        categories.forEach(category => {
            const galaxyItem = document.createElement('div');
            galaxyItem.className = 'galaxy-item';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'category-image-container';
            const img = document.createElement('img');
            img.src = category.image
                ? category.image
                : '/static/accounts/images/planetary_system/category_img.png';
            img.alt = category.name;
            imgContainer.appendChild(img);

            const nameWrapper = document.createElement('div');
            nameWrapper.className = 'galaxy-name-wrapper';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'galaxy-name';
            nameSpan.textContent = category.name;
            nameWrapper.appendChild(nameSpan);

            galaxyItem.appendChild(imgContainer);
            galaxyItem.appendChild(nameWrapper);

            if (category.name === currentGalaxy) {
                galaxyItem.classList.add('selected');
            }

            galaxyItem.addEventListener('click', () => {
                switchGalaxy(category.name);
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
        const galaxyNames = categories.map(c => c.name);
        let currentIndex = galaxyNames.indexOf(currentGalaxy);
        currentIndex = (currentIndex - 1 + galaxyNames.length) % galaxyNames.length;
        switchGalaxy(galaxyNames[currentIndex]);
    });

    galaxySelectorNext.addEventListener('click', () => {
        const galaxyNames = categories.map(c => c.name);
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
                const orbitDuration = parseFloat(getComputedStyle(p.orbit).getPropertyValue('--orbit-time')) || 100;
                p.angle = (elapsedSeconds * 360) / (orbitDuration * p.speedFactor);
                p.orientation.style.transform = `rotate(${p.angle}deg)`;
            });
        }
        requestAnimationFrame(updatePositions);
    }
    
    solarSystem.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - rotationY;
        startY = e.clientY - rotationX;
        solarSystem.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        solarSystem.style.cursor = 'grab';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            rotationY = e.clientX - startX;
            rotationX = e.clientY - startY;
            rotationX = Math.max(-10, Math.min(80, rotationX)); // Ограничение вертикального вращения
            scene.style.transform = `scale(${scale}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
        }
    });

    solarSystem.addEventListener('wheel', (e) => {
        e.preventDefault();
        scale -= e.deltaY * 0.001;
        scale = Math.max(0.5, Math.min(2.5, scale));
        scene.style.transform = `scale(${scale}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
    });
    
    scene.style.transform = `scale(${scale}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

    initGalaxySelector();
    populatePlanets(currentGalaxy);
    updatePositions();

    let minScale = 0.5;
    let maxScale = 2;
});
