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
            });
        }

        let planetObjects = [];
        planets.forEach(planet => {
            const orbit = planet.closest('.orbit');
            if (orbit) {
                planetObjects.push({
                    element: planet,
                    orbitSize: parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-size')),
                    orbitTime: parseFloat(getComputedStyle(orbit).getPropertyValue('--orbit-time')) * 1000,
                    startTime: Date.now() + Math.random() * 5000,
                    randomSpeedFactor: parseFloat(orbit.style.getPropertyValue('--random-speed-factor') || 1)
                });
            }
        });

        function checkInactivity() {
            if (!isDragging && !isPaused && Date.now() - lastInteractionTime > inactivityTimeout) {
                if (!isReturningToCenter) {
                    isReturningToCenter = true;
                    const animationDuration = 1000;
                    const start = performance.now();
                    const startOffsetX = offsetX;
                    const startOffsetY = offsetY;

                    function animateReturn(timestamp) {
                        const elapsed = timestamp - start;
                        const progress = Math.min(elapsed / animationDuration, 1);
                        offsetX = startOffsetX * (1 - progress);
                        offsetY = startOffsetY * (1 - progress);
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
        }
        setInterval(checkInactivity, 2000);

        function updatePlanets(time) {
            if (!lastTime) {
                lastTime = time;
                requestAnimationFrame(updatePlanets);
                return;
            }

            const deltaTime = time - lastTime;
            lastTime = time;
            frameCount++;
            if (time % 1000 < deltaTime) {
                fps = frameCount;
                frameCount = 0;
                if (fpsElement) fpsElement.textContent = `${fps} FPS`;
            }

            if (!isPaused) {
                const now = Date.now();
                planetObjects.forEach(p => {
                    const elapsedTime = now - p.startTime;
                    const angle = ((elapsedTime / (p.orbitTime / p.randomSpeedFactor)) * 360) % 360;
                    const x = Math.cos(angle * Math.PI / 180) * p.orbitSize / 2;
                    const y = Math.sin(angle * Math.PI / 180) * p.orbitSize / 2;
                    const z = Math.sin(angle * Math.PI / 180) * p.orbitSize * Math.tan(galaxyTiltAngle * Math.PI / 180) / 2;

                    const orientationElement = p.element.parentElement;
                    orientationElement.style.transform = `translate3d(${x}px, ${y}px, 0px)`;

                    const planetItself = orientationElement.querySelector('.planet');
                    if(planetItself) {
                        planetItself.style.transform = `rotateX(${-galaxyTiltAngle}deg)`;
                    }
                });
            }

            if (galaxyElement) { // Use the renamed variable
                galaxyElement.style.transform = `rotateX(${galaxyTiltAngle}deg)`;
            }

            requestAnimationFrame(updatePlanets);
        }

        // Galaxy Selector Logic
        if (galaxySelector && config.directionsData) {
            const galaxyItems = document.querySelectorAll('.galaxy-item');
            
            galaxyItems.forEach(item => {
                item.addEventListener('click', () => {
                    const galaxyName = item.getAttribute('data-name');
                    selectGalaxy(galaxyName);
                });
            });

            function selectGalaxy(galaxyName) {
                // Remove 'selected' from all items and add to the clicked one
                galaxyItems.forEach(item => item.classList.remove('selected'));
                const selectedItem = document.querySelector(`.galaxy-item[data-name="${galaxyName}"]`);
                if (selectedItem) {
                    selectedItem.classList.add('selected');
                }

                // Redirect to the new galaxy URL
                // Assuming config.urls.planetarySystemBase is something like "/planetary-system/"
                window.location.href = `${config.urls.planetarySystemBase}?direction=${encodeURIComponent(galaxyName)}`;
            }

            // Smooth scrolling for galaxy selector
            let isDown = false;
            let startX;
            let scrollLeft;
            
            galaxyList.addEventListener('mousedown', (e) => {
                isDown = true;
                galaxyList.classList.add('active');
                startX = e.pageX - galaxyList.offsetLeft;
                scrollLeft = galaxyList.scrollLeft;
            });
            galaxyList.addEventListener('mouseleave', () => {
                isDown = false;
                galaxyList.classList.remove('active');
            });
            galaxyList.addEventListener('mouseup', () => {
                isDown = false;
                galaxyList.classList.remove('active');
            });
            galaxyList.addEventListener('mousemove', (e) => {
                if(!isDown) return;
                e.preventDefault();
                const x = e.pageX - galaxyList.offsetLeft;
                const walk = (x - startX) * 2; //scroll-fast
                galaxyList.scrollLeft = scrollLeft - walk;
            });
             function smoothScroll() {
                // This is a placeholder for any smooth scrolling logic if needed beyond native/drag scrolling
            }
        }


        requestAnimationFrame(updatePlanets);

    } catch (error) {
        console.error('An error occurred in the planetary system script:', error);
    }
});
