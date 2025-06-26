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
        const galaxyElement = document.getElementById('galaxy');
        const galaxySelector = document.getElementById('galaxy-selector');
        const galaxyList = document.getElementById('galaxy-list');
        const allStartupsButton = document.querySelector('.all-startups-button');

        console.log('Found planets:', planets.length);
        console.log('allStartupsButton:', allStartupsButton);

        let currentStartupID = null;
        let isDragging = false;
        let startX_drag, startY_drag;
        let offsetX = 0;
        let offsetY = 0;
        let scale = 1;

        // Обработка кликов по планетам
        planets.forEach(planet => {
            const id = planet.getAttribute('data-id');
            console.log(`Processing planet: ${id}`);

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

                // Заполняем карточку информацией о стартапе
                planetImage.style.backgroundImage = `url('${startup.image}')`;
                startupName.textContent = startup.name;
                startupRating.textContent = `Рейтинг ${startup.rating} | Комментариев: ${startup.comment_count || 0}`;
                startupProgress.innerHTML = `<span class="progress-percentage">${startup.progress}</span>`;
                startupFunding.innerHTML = `
                    <strong>Направление:</strong> ${startup.direction}<br>
                    <strong>Цель финансирования:</strong> ${startup.funding_goal}`;
                startupInvestors.innerHTML = `<strong>Инвесторов:</strong> ${startup.investors}`;
                startupDescription.innerHTML = `
                    ${startup.investment_type && startup.investment_type !== "Не указано" ? `<div class="investment-type">${startup.investment_type}</div>` : ""}
                    <div class="startup-description">${startup.description || 'Описание не указано'}</div>`;
                
                currentStartupID = startup.startup_id;
                planets.forEach(p => p.classList.remove('active'));
                planet.classList.add('active');
                infoCard.style.display = 'block';
            });
        });

        // Закрытие карточки
        if (closeCard) {
            closeCard.addEventListener('click', () => {
                infoCard.style.display = 'none';
                planets.forEach(p => p.classList.remove('active'));
            });
        }

        // Кнопка "Подробнее"
        if (moreDetails) {
            moreDetails.addEventListener('click', () => {
                if (currentStartupID) {
                    window.location.href = `/startups/${currentStartupID}/`;
                }
                infoCard.style.display = 'none';
                planets.forEach(p => p.classList.remove('active'));
            });
        }

        // Обработка кнопки "Все стартапы"
        if (allStartupsButton) {
            allStartupsButton.addEventListener('click', () => {
                console.log('All startups button clicked');
                window.location.href = config.urls.planetarySystemBase + '?direction=Все';
            });
        }

        // Обработка кликов по категориям
        if (galaxyList) {
            const galaxyItems = galaxyList.querySelectorAll('.galaxy-item');
            galaxyItems.forEach(item => {
                item.addEventListener('click', () => {
                    const directionName = item.getAttribute('data-name');
                    console.log('Galaxy item clicked:', directionName);
                    window.location.href = config.urls.planetarySystemBase + '?direction=' + encodeURIComponent(directionName);
                });
            });
        }

        // Простая обработка перетаскивания
        if (solarSystem) {
            solarSystem.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const rect = solarSystem.getBoundingClientRect();
                startX_drag = e.clientX - rect.left;
                startY_drag = e.clientY - rect.top;
                isDragging = true;
                solarSystem.classList.add('dragging');
            });

            solarSystem.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                scale = Math.max(0.5, Math.min(3, scale + delta));
                if (scene) scene.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (solarSystem && isDragging) {
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
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (solarSystem) solarSystem.classList.remove('dragging');
            }
        });

        // Закрытие карточки при клике вне её
        document.addEventListener('click', (e) => {
            if (infoCard && infoCard.style.display === 'block' && !infoCard.contains(e.target) && !e.target.classList.contains('planet')) {
                infoCard.style.display = 'none';
                planets.forEach(p => p.classList.remove('active'));
            }
        });

    } catch (error) {
        console.error('Error initializing planetary system:', error);
    }
});
