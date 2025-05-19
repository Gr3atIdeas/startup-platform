document.addEventListener('DOMContentLoaded', function() {
    const dataElement = document.getElementById('planetary-system-data');
    if (!dataElement) {
        console.error('Data element #planetary-system-data not found!');
        return;
    }
    const config = JSON.parse(dataElement.textContent);

    try {
        // Передаём информацию о пользователе из config
        const isAuthenticated = config.isAuthenticated;
        const isStartuper = config.isStartuper;
        console.log('User context from config:', { isAuthenticated, isStartuper });

        // Формируем объект startups из config.planetsData
        const startups = {};
        if (config.planetsData) {
            config.planetsData.forEach(planet => {
                startups[planet.id] = planet;
            });
        }
        console.log('Startups data from config:', startups);

        const planets = document.querySelectorAll('.planet');
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
        const galaxyElement = document.getElementById('galaxy'); // Renamed to avoid conflict with galaxy variable/parameter
        const crosshairCoords = document.getElementById('crosshair-coords');
        const mouseCoords = document.getElementById('mouse-coords');
        const fpsElement = document.getElementById('fps');
        const galaxySelector = document.getElementById('galaxy-selector');
        const galaxyList = document.getElementById('galaxy-list');

        console.log('Found planets:', planets.length);
        console.log('infoCard:', infoCard);
        console.log('solarSystem:', solarSystem);
        console.log('galaxySelector:', galaxySelector);

        let currentStartupID = null;
        const galaxyTiltAngle = 45;
        let lastTime = 0;
        let frameCount = 0;
        let fps = 0;
        let isPaused = false;
        let pausedTime = 0;
        let lastInteractionTime = Date.now();
        const inactivityTimeout = 10000;
        let isReturningToCenter = false;
        let isDragging = false;
        let startX_drag, startY_drag; // Renamed to avoid conflict
        let offsetX = 0;
        let offsetY = 0;
        let scale = 1;

        planets.forEach(planet => {
            console.log('Processing planet:', planet);
            const randomAngle = Math.random() * 360;
            planet.parentElement.parentElement.style.setProperty('--random-angle', `${randomAngle}deg`);
            const randomSpeedFactor = 0.8 + Math.random() * 0.4;
            planet.parentElement.parentElement.style.setProperty('--random-speed-factor', randomSpeedFactor);
            const id = planet.getAttribute('data-id');
            console.log(`Planet ID: ${id}, Startup data:`, startups[id]);

            if (startups[id] && startups[id].image) {
                const img = new Image();
                img.src = startups[id].image;
                img.onload = () => {
                    console.log(`Image loaded for startup ${id}: ${startups[id].image}`);
                };
                img.onerror = () => {
                    console.error(`Failed to load image for startup ${id}: ${startups[id].image}`);
                    planet.style.backgroundImage = `url('https://via.placeholder.com/150')`;
                };
            } else if (id !== 'create-startup') { // Don't error for special planets if they lack image in startups object
                 console.warn(`No image data for planet ${id} or startup data missing.`);
                 planet.style.backgroundImage = `url('https://via.placeholder.com/150')`;
            }


            planet.addEventListener('click', (e) => {
                console.log(`Planet clicked: ${id}`);
                e.stopPropagation();
                if (id === 'create-startup') {
                    console.log('Clicked on create-startup planet');
                    if (isAuthenticated && isStartuper) {
                        window.location.href = config.urls.createStartup;
                    } else if (!isAuthenticated) {
                        window.location.href = config.urls.register;
                    }
                    return;
                }

                const startup = startups[id];
                if (!startup) {
                    console.error('Startup data not found for id:', id);
                    return;
                }
                console.log('Startup data:', startup);

                planetImage.style.backgroundImage = `url('${startup.image}')`;
                startupName.textContent = startup.name;
                startupRating.textContent = `Рейтинг ${startup.rating} | Комментариев: ${startup.comment_count || 0}`;
                startupProgress.innerHTML = `
                    <div class="progress-bar-visual">
                      <div class="progress-animation-container" style="width: ${startup.progress};">
                        <div class="progress-planets"></div>
                      </div>
                      <span class="progress-percentage">${startup.progress}</span>
                    </div>`;
                startupFunding.innerHTML = `
                    <strong>Направление:</strong> ${startup.direction}<br>
                    <div class="funding-goal-container-figma">
                      <span class="funding-goal-text-figma">Цель финансирования: ${startup.funding_goal}</span>
                    </div>`; // Corrected to funding_goal from startup.funding if that's the correct field from context
                startupInvestors.innerHTML = `
                    <div class="investor-count-container-figma">
                      <i class="fas fa-users investor-icon-figma"></i>
                      <span class="investor-count-text-figma">${startup.investors}</span>
                    </div>`;
                startupDescription.innerHTML = `
                    <div class="progress-bar">
                      ${startup.investment_type && startup.investment_type !== "Не указано" ? `<button>${startup.investment_type}</button>` : ""}
                    </div>
                    <div class="startup-short-description">${startup.description}</div>`;
                currentStartupID = startup.startup_id;
                console.log('Current Startup ID:', currentStartupID);
                planets.forEach(p => p.classList.remove('active'));
                planet.classList.add('active');
                infoCard.style.display = 'block';
                isPaused = true;
                pausedTime = Date.now();
                lastInteractionTime = Date.now();
            });
        });

        if (closeCard) {
            closeCard.addEventListener('click', () => {
                console.log('Close card clicked');
                infoCard.style.display = 'none';
                planets.forEach(p => p.classList.remove('active'));
                if (isPaused) {
                    const pauseDuration = Date.now() - pausedTime;
                    planetObjects.forEach(planetObj => {
                        planetObj.startTime += pauseDuration;
                    });
                    isPaused = false;
                    console.log('Resuming planet rotation');
                }
                lastInteractionTime = Date.now();
            });
        }

        if (moreDetails) {
            moreDetails.addEventListener('click', () => {
                console.log('More details clicked');
                if (currentStartupID) {
                    window.location.href = `/startups/${currentStartupID}/`;
                } else {
                    console.error('Startup ID не найден для перехода на страницу стартапа');
                }
                infoCard.style.display = 'none';
                planets.forEach(p => p.classList.remove('active'));
                if (isPaused) {
                    const pauseDuration = Date.now() - pausedTime;
                    planetObjects.forEach(planetObj => {
                        planetObj.startTime += pauseDuration;
                    });
                    isPaused = false;
                    console.log('Resuming planet rotation after more details');
                }
                lastInteractionTime = Date.now();
            });
        }
        
        if (solarSystem) {
            solarSystem.addEventListener('mousedown', (e) => {
                console.log('Solar system mousedown');
                e.preventDefault();
                const rect = solarSystem.getBoundingClientRect();
                startX_drag = e.clientX - rect.left;
                startY_drag = e.clientY - rect.top;
                isDragging = true;
                solarSystem.classList.add('dragging');
                lastInteractionTime = Date.now();
                isReturningToCenter = false;
            });

            solarSystem.addEventListener('wheel', (e) => {
                console.log('Solar system wheel');
                e.preventDefault();
                const rect = solarSystem.getBoundingClientRect();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                scale = Math.max(0.5, Math.min(3, scale + delta));
                if (scene) scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                if (crosshairCoords) crosshairCoords.textContent = `Center: (${Math.round(offsetX)}, ${Math.round(offsetY)}, 0)`;
                if (mouseCoords) {
                    mouseCoords.style.left = `${Math.min(rect.width - 80, Math.max(0, e.clientX - rect.left))}px`;
                    mouseCoords.style.top = `${Math.min(rect.height - 30, Math.max(0, e.clientY - rect.top))}px`;
                    mouseCoords.textContent = `Mouse: (${Math.round(e.clientX - rect.left)}, ${Math.round(e.clientY - rect.top)})`;
                }
                lastInteractionTime = Date.now();
                isReturningToCenter = false;
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (solarSystem && isDragging) { // Check if solarSystem exists
                const rect = solarSystem.getBoundingClientRect();
                const deltaX = e.clientX - rect.left - startX_drag;
                const deltaY = e.clientY - rect.top - startY_drag;
                offsetX += deltaX;
                offsetY += deltaY;
                const maxX = (rect.width / 2) / scale;
                const maxY = (rect.height / 2) / scale;
                offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
                offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
                if (scene) scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                startX_drag = e.clientX - rect.left;
                startY_drag = e.clientY - rect.top;
                if (crosshairCoords) crosshairCoords.textContent = `Center: (${Math.round(offsetX)}, ${Math.round(offsetY)}, 0)`;
                lastInteractionTime = Date.now();
            }
             if (solarSystem && mouseCoords) { // Check if solarSystem and mouseCoords exist
                const rect = solarSystem.getBoundingClientRect();
                mouseCoords.style.left = `${Math.min(rect.width - 80, Math.max(0, e.clientX - rect.left))}px`;
                mouseCoords.style.top = `${Math.min(rect.height - 30, Math.max(0, e.clientY - rect.top))}px`;
                mouseCoords.textContent = `Mouse: (${Math.round(e.clientX - rect.left)}, ${Math.round(e.clientY - rect.top)})`;
            }
        });

        document.addEventListener('mouseup', () => {
            console.log('Mouse up');
            isDragging = false;
            if (solarSystem) solarSystem.classList.remove('dragging');
            lastInteractionTime = Date.now();
        });

        if (infoCard) {
            infoCard.addEventListener('mousedown', (e) => {
                console.log('Info card mousedown');
                e.stopPropagation();
                lastInteractionTime = Date.now();
            });
        }

        function checkInactivity() {
            const now = Date.now();
            if (now - lastInteractionTime >= inactivityTimeout && !isReturningToCenter && !isPaused) {
                console.log('Returning to center due to inactivity');
                isReturningToCenter = true;
                const startX_anim = offsetX; // Renamed to avoid conflict
                const startY_anim = offsetY; // Renamed to avoid conflict
                const duration = 1000;
                let startTime_anim = null; // Renamed to avoid conflict

                function animateReturn(timestamp) {
                    if (!startTime_anim) startTime_anim = timestamp;
                    const elapsed = timestamp - startTime_anim;
                    const progress = Math.min(elapsed / duration, 1);
                    offsetX = startX_anim + (0 - startX_anim) * progress;
                    offsetY = startY_anim + (0 - startY_anim) * progress;
                    if (scene) scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                    if (crosshairCoords) crosshairCoords.textContent = `Center: (${Math.round(offsetX)}, ${Math.round(offsetY)}, 0)`;
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

        const planetObjects = [];
        planets.forEach((planet_element, index) => { // Renamed planet to planet_element
            console.log('Creating planet object:', index);
            const orbit = planet_element.closest('.orbit');
            const planetOrientation = planet_element.closest('.planet-orientation');
            if (!orbit || !planetOrientation) {
                console.error("Could not find orbit or planetOrientation for", planet_element);
                return;
            }
            
            const orbitSizeStyle = getComputedStyle(orbit).getPropertyValue('--orbit-size');
            const orbitTimeStyle = getComputedStyle(orbit).getPropertyValue('--orbit-time');

            // Add null/empty checks for parsed values
            const orbitSize = orbitSizeStyle ? parseFloat(orbitSizeStyle) : 200; // Default if null
            const orbitTime = orbitTimeStyle ? parseFloat(orbitTimeStyle) : 10; // Default if null


            const initialAngle = Math.random() * 360;
            const speedFactor = 0.8 + Math.random() * 0.4;
            const radius = orbitSize / 2;

            if (radius > 0) {
                const angleRad = initialAngle * Math.PI / 180;
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;
                planetOrientation.style.left = `${50 + 50 * (x / radius)}%`;
                planetOrientation.style.top = `${50 + 50 * (y / radius)}%`;
            } else {
                 console.warn("Radius is zero or negative for planet object:", index);
            }
            const tiltCompensation = -galaxyTiltAngle;
            planet_element.style.transform = `rotateX(${tiltCompensation}deg)`;
            
            planetObjects.push({
                element: planet_element,
                orientation: planetOrientation,
                orbit: orbit,
                size: parseFloat(getComputedStyle(planet_element).getPropertyValue('--planet-size')),
                orbitSize: orbitSize,
                orbitTime: orbitTime,
                angle: initialAngle,
                speedFactor: speedFactor,
                startTime: Date.now() - Math.random() * orbitTime * 1000
            });
        });

        function updatePlanets() {
            // console.log('updatePlanets called', 'isPaused:', isPaused); 
            const now = Date.now();
            frameCount++;
            if (now - lastTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                lastTime = now;
                if (fpsElement) fpsElement.textContent = `${fps} FPS`;
            }
            if (isPaused) {
                requestAnimationFrame(updatePlanets);
                return;
            }
            planetObjects.forEach(planetObj => {
                try {
                    if (!planetObj.orientation || !planetObj.element) return; // Skip if essential elements are missing

                    const elapsedSeconds = (now - planetObj.startTime) / 1000;
                    const orbitTimeSeconds = planetObj.orbitTime * planetObj.speedFactor;
                    if (!orbitTimeSeconds || orbitTimeSeconds <= 0) {
                        // console.error('Invalid orbitTimeSeconds:', orbitTimeSeconds, "for planetObj", planetObj);
                        return;
                    }
                    const progress = (elapsedSeconds % orbitTimeSeconds) / orbitTimeSeconds;
                    const angle = planetObj.angle + progress * 360;
                    const angleRad = angle * Math.PI / 180;
                    const radius = planetObj.orbitSize / 2;
                    if (!radius || radius <= 0) {
                        // console.error('Invalid radius:', radius, "for planetObj", planetObj);
                        return;
                    }
                    const x = Math.cos(angleRad) * radius;
                    const y = Math.sin(angleRad) * radius;
                    planetObj.orientation.style.left = `${50 + 50 * (x / radius)}%`;
                    planetObj.orientation.style.top = `${50 + 50 * (y / radius)}%`;
                    const tiltCompensation = -galaxyTiltAngle;
                    planetObj.element.style.transform = `rotateX(${tiltCompensation}deg)`;
                } catch (error) {
                    console.error('Error updating planet position:', error, "for planetObj", planetObj);
                }
            });
            requestAnimationFrame(updatePlanets);
        }

        let scrollVelocity = 0;
        let lastScrollTime = 0;

        if (galaxySelector && galaxyList) {
            galaxySelector.addEventListener('wheel', (e) => {
                console.log('Galaxy selector wheel');
                e.preventDefault();
                const delta = e.deltaY * 5;
                scrollVelocity += delta;
                lastScrollTime = Date.now();
                lastInteractionTime = Date.now();
            });

            const galaxyListItems = galaxyList.querySelectorAll('.galaxy-item'); // Query from galaxyList
            const itemsArray = Array.from(galaxyListItems);
            const totalItems = itemsArray.length;

            if (totalItems > 0) { // Ensure itemsArray is not empty
                itemsArray.forEach(item => {
                    const clone = item.cloneNode(true);
                    galaxyList.appendChild(clone);
                    clone.addEventListener('click', () => {
                        const galaxyName = clone.getAttribute('data-name');
                        selectGalaxy(galaxyName);
                    });
                });
            }


            function selectGalaxy(galaxyName) {
                console.log('selectGalaxy called with:', galaxyName);
                scrollVelocity = 0;
                lastScrollTime = Date.now();
                localStorage.setItem('selectedGalaxy', galaxyName);
                document.querySelectorAll('.galaxy-item').forEach(item => {
                    item.classList.remove('selected');
                });
                document.querySelectorAll(`.galaxy-item[data-name="${galaxyName}"]`).forEach(item => {
                    item.classList.add('selected');
                    const containerRect = galaxySelector.getBoundingClientRect();
                    const itemRect = item.getBoundingClientRect();
                    if (containerRect.width > 0 && itemRect.width > 0) { // Check for valid rects
                        const scrollLeftVal = itemRect.left - containerRect.left - (containerRect.width - itemRect.width) / 2 + galaxySelector.scrollLeft;
                        galaxySelector.scrollTo({
                            left: scrollLeftVal,
                            behavior: 'smooth'
                        });
                    }
                });
                // Use config.urls.planetarySystemBase which should be set in config (e.g. /planetary-system/)
                if (config.urls && config.urls.planetarySystemBase) {
                     window.location.href = `${config.urls.planetarySystemBase}?galaxy=${encodeURIComponent(galaxyName)}`;
                } else {
                    console.error("Planetary system base URL not configured in config.urls.planetarySystemBase");
                }
            }

            function smoothScroll() {
                // console.log('smoothScroll called');
                const now = Date.now();
                const timeSinceLastScroll = now - lastScrollTime;

                if (timeSinceLastScroll < 100) {
                    galaxySelector.scrollLeft += scrollVelocity;
                    scrollVelocity *= 0.9;
                    if (totalItems > 0) { // Ensure itemsArray and totalItems are valid
                        const itemWidth = itemsArray[0].offsetWidth + 20; 
                        const totalWidth = itemWidth * totalItems;
                        if (totalWidth > 0) { // Ensure totalWidth is positive
                           const scrollLeftVal = galaxySelector.scrollLeft;
                            if (scrollLeftVal >= totalWidth) {
                                galaxySelector.scrollLeft = scrollLeftVal - totalWidth;
                            } else if (scrollLeftVal <= 0 && galaxySelector.scrollWidth > galaxySelector.clientWidth) { // Add check for scrollWidth > clientWidth
                                galaxySelector.scrollLeft = totalWidth + scrollLeftVal;
                            }
                        }
                    }
                } else {
                    scrollVelocity = 0;
                }

                const containerRect = galaxySelector.getBoundingClientRect();
                const containerCenter = containerRect.left + containerRect.width / 2;
                const items = galaxyList.querySelectorAll('.galaxy-item'); // Query from galaxyList

                items.forEach(item => {
                    const itemRect = item.getBoundingClientRect();
                    const itemCenter = itemRect.left + itemRect.width / 2;
                    const distanceFromCenter = Math.abs(containerCenter - itemCenter);
                    const maxDistance = containerRect.width / 2;
                    
                    if (maxDistance > 0) { // Avoid division by zero
                        const scaleFactor = Math.max(0.5, 1 - (distanceFromCenter / maxDistance));
                        const fontSize = 16 * scaleFactor;
                        item.style.transform = `scale(${scaleFactor})`;
                        item.style.fontSize = `${fontSize}px`;
                    }


                    if (item.classList.contains('selected')) {
                        item.style.background = '#004E9F';
                    } else {
                        item.style.background = 'rgba(255, 255, 255, 0.2)';
                    }
                });
                requestAnimationFrame(smoothScroll);
            }
            if (galaxyListItems.length > 0) { // Only start if there are items
                 requestAnimationFrame(smoothScroll);
            }


            // Re-add event listeners for original items as well (if not already covered by delegation or initial setup)
             itemsArray.forEach(item => {
                item.addEventListener('click', () => {
                    const galaxyName = item.getAttribute('data-name');
                    selectGalaxy(galaxyName);
                });
            });
        } // End of if (galaxySelector && galaxyList)

        if (crosshairCoords && offsetX !== undefined && offsetY !== undefined) { // Check elements and variables
           crosshairCoords.textContent = `Center: (${Math.round(offsetX)}, ${Math.round(offsetY)}, 0)`;
        }


        // Initialization logic from the original DOMContentLoaded
        const savedGalaxy = localStorage.getItem('selectedGalaxy');
        const initialGalaxy = config.selectedGalaxy; // From config
        console.log('Saved Galaxy:', savedGalaxy, 'Initial Galaxy:', initialGalaxy);

        if (savedGalaxy && savedGalaxy !== initialGalaxy) {
            console.log('Redirecting due to different saved galaxy');
            if (config.urls && config.urls.planetarySystemBase) {
                window.location.href = `${config.urls.planetarySystemBase}?galaxy=${encodeURIComponent(savedGalaxy)}`;
            } else {
                 console.error("Planetary system base URL not configured for redirection.");
            }
        } else {
            if (galaxySelector) { // Ensure galaxySelector exists
                const selectedItems = galaxySelector.querySelectorAll('.galaxy-item.selected');
                console.log('Selected items:', selectedItems.length);
                if (selectedItems.length > 0) {
                    const firstSelected = selectedItems[0];
                    const containerRect = galaxySelector.getBoundingClientRect();
                    const itemRect = firstSelected.getBoundingClientRect();
                     if (containerRect.width > 0 && itemRect.width > 0) { // Check for valid rects
                        const scrollLeftVal = itemRect.left - containerRect.left - (containerRect.width - itemRect.width) / 2 + galaxySelector.scrollLeft;
                        galaxySelector.scrollTo({
                            left: scrollLeftVal,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        }
        
        if (galaxySelector) { // Ensure galaxySelector exists for scroll event
            galaxySelector.addEventListener('scroll', () => {
                // console.log('Galaxy selector scrolled');
                const selectedItems = galaxySelector.querySelectorAll('.galaxy-item.selected');
                if (selectedItems.length > 0) {
                    const firstSelected = selectedItems[0];
                    const containerRect = galaxySelector.getBoundingClientRect();
                    const itemRect = firstSelected.getBoundingClientRect();
                    const itemCenter = itemRect.left + itemRect.width / 2;
                    const containerCenter = containerRect.left + containerRect.width / 2;
                    const distanceFromCenter = Math.abs(containerCenter - itemCenter);
                    if (distanceFromCenter > containerRect.width / 4 && containerRect.width > 0 && itemRect.width > 0) {
                        const scrollLeftVal = itemRect.left - containerRect.left - (containerRect.width - itemRect.width) / 2 + galaxySelector.scrollLeft;
                        galaxySelector.scrollTo({
                            left: scrollLeftVal,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        }

        console.log('Calling requestAnimationFrame(updatePlanets)');
        if (planets.length > 0) { // Only start if there are planets
            requestAnimationFrame(updatePlanets);
        }

    } catch (error) {
        console.error('Error in planetary_system.js execution:', error);
    }
}); 