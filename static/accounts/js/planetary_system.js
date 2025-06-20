document.addEventListener('DOMContentLoaded', () => {
    const startupsDataElement = document.getElementById('startups-data');
    if (!startupsDataElement) {
        console.error('Startups data element not found!');
        return;
    }
    const startups = JSON.parse(startupsDataElement.textContent);

    const planets = [];
    const orbits = document.querySelectorAll('.orbit');
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
    const galaxySelector = document.getElementById('galaxy-selector');
    const galaxySelectorPrev = document.getElementById('galaxy-selector-prev');
    const galaxySelectorNext = document.getElementById('galaxy-selector-next');

    if (logoElement && logoElement.dataset.bgUrl) {
        logoElement.style.backgroundImage = `url('${logoElement.dataset.bgUrl}')`;
    }

    let isPaused = false;
    let pausedTime = 0;
    let isDragging = false;
    let startX, startY;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    // Список категорий (галактик)
    const galaxyData = {
        'Технологии': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Финансы': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Здравоохранение': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Медицина': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Автомобили': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Доставка': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Кафе/рестораны': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Фастфуд': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Здоровье': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Красота': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Транспорт': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Спорт': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'Психология': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" },
        'ИИ': { image: "{% static 'accounts/images/planetary_system/category_img.png' %}" }
    };
    
    const galaxyNames = Object.keys(galaxyData);
    let currentGalaxy = galaxyNames[0];
    let categoryImageBaseUrl = '';
    if (galaxyList.dataset.categoryImageUrl) {
        categoryImageBaseUrl = galaxyList.dataset.categoryImageUrl;
    }


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
                
                if(infoCard.style.display === 'block' && startupName.textContent === startup.name) {
                    infoCard.style.display = 'none';
                    planetEl.classList.remove('active');
                    resumeAnimation();
                    return;
                }

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
                infoCard.style.display = 'block';
                pauseAnimation();
            });
        });
    }

    function initGalaxySelector() {
        galaxyList.innerHTML = '';
        const categoryImageUrl = galaxyList.dataset.categoryImageUrl;

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
    
    let currentScrollOffset = 0;
    function updateGalaxySelectorScroll(animated = true) {
        const selected = galaxyList.querySelector('.galaxy-item.selected');
        if (!selected) return;
        const listWidth = galaxySelector.offsetWidth;
        const selectedLeft = selected.offsetLeft;
        const selectedWidth = selected.offsetWidth;
        const scrollLeft = selectedLeft - (listWidth / 2) + (selectedWidth / 2);
        
        currentScrollOffset = -scrollLeft;
        galaxyList.style.transition = animated ? 'transform 0.5s ease' : 'none';
        galaxyList.style.transform = `translateX(${currentScrollOffset}px)`;
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
        infoCard.style.display = 'none';
        document.querySelectorAll('.planet').forEach(p => p.classList.remove('active'));
        resumeAnimation();
    });

    if (moreDetails) {
        moreDetails.addEventListener('click', () => {
            // The URL is now set when a planet is clicked
        });
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
                
                p.orientation.style.left = `${50 + 50 * (x / radius)}%`;
                p.orientation.style.top = `${50 + 50 * (y / radius)}%`;
                p.element.style.transform = `rotateX(${-45}deg)`;
            });
        }
        requestAnimationFrame(updatePositions);
    }
    
    solarSystem.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        solarSystem.classList.add('dragging');
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        solarSystem.classList.remove('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotateX(45deg)`;
        }
    });

    solarSystem.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotateX(45deg)`;
    });
    
    scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotateX(45deg)`;

    initGalaxySelector();
    populatePlanets(currentGalaxy);
    requestAnimationFrame(updatePositions);
    window.addEventListener('resize', () => updateGalaxySelectorScroll(false));
});
