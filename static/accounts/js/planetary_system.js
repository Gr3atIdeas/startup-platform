document.addEventListener('DOMContentLoaded', function() {
    console.log('Planetary system JavaScript loaded');

    // Получаем данные из script тега
    const dataScript = document.getElementById('planetary-system-data');
    if (!dataScript) {
        console.error('Не найден скрипт с данными планетарной системы');
        return;
    }

    let data;
    try {
        data = JSON.parse(dataScript.textContent);
    } catch (e) {
        console.error('Ошибка парсинга данных:', e);
        return;
    }

    const { planetsData, directionsData, selectedGalaxy, urls } = data;
    console.log('Данные загружены:', { planetsData, directionsData, selectedGalaxy });

    // Элементы DOM
    const infoCard = document.getElementById('info-card');
    const closeCardBtn = document.getElementById('close-card');
    const allStartupsBtn = document.querySelector('.all-startups-button');
    const galaxyItems = document.querySelectorAll('.galaxy-item');
    const planets = document.querySelectorAll('.planet');

    // Инициализация планетарной системы - убираем сложную логику
    console.log('Планетарная система инициализирована без дополнительной настройки');

    // Функция для отображения карточки стартапа
    function showStartupCard(startupData) {
        if (!startupData || !infoCard) return;

        // Заполняем данные
    const planetImage = document.getElementById('planet-image');
    const startupName = document.getElementById('startup-name');
    const startupRating = document.getElementById('startup-rating');
    const startupProgress = document.getElementById('startup-progress');
    const startupFunding = document.getElementById('startup-funding');
    const startupInvestors = document.getElementById('startup-investors');
    const startupDescription = document.getElementById('startup-description');
        const moreDetailsBtn = document.getElementById('more-details');

        if (planetImage) planetImage.style.backgroundImage = `url('${startupData.image}')`;
        if (startupName) startupName.textContent = startupData.name || 'Название не указано';
        if (startupRating) startupRating.textContent = `Рейтинг: ${startupData.rating || 0}`;
        if (startupProgress) {
            startupProgress.textContent = startupData.progress || '0%';
            startupProgress.style.width = startupData.progress || '0%';
        }
        if (startupFunding) startupFunding.textContent = `Цель: ${startupData.funding_goal || 'Не указана'}`;
        if (startupInvestors) startupInvestors.textContent = `Инвесторы: ${startupData.investors || 0}`;
        if (startupDescription) startupDescription.textContent = startupData.description || 'Описание не указано';
        
        if (moreDetailsBtn) {
            moreDetailsBtn.onclick = function() {
                window.location.href = `/startup/${startupData.startup_id}/`;
            };
        }

        // Показываем карточку
        infoCard.style.display = 'block';
        infoCard.classList.add('active');
    }

    // Функция для скрытия карточки
    function hideStartupCard() {
        if (infoCard) {
            infoCard.style.display = 'none';
            infoCard.classList.remove('active');
        }
    }

    // Обработчики событий для планет
    planets.forEach(planet => {
        planet.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const planetId = parseInt(this.dataset.id);
            const startupData = planetsData.find(p => p.id === planetId);
            
            if (startupData) {
                console.log('Клик по планете:', startupData);
                showStartupCard(startupData);
            }
        });

        // Эффект при наведении - убираем старые обработчики, так как теперь используем CSS
    });

    // Обработчик закрытия карточки
    if (closeCardBtn) {
        closeCardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideStartupCard();
        });
    }

    // Закрытие карточки по клику вне её
    document.addEventListener('click', function(e) {
        if (infoCard && infoCard.style.display === 'block' && !infoCard.contains(e.target)) {
            hideStartupCard();
        }
    });

    // Обработчик кнопки "Все стартапы"
    if (allStartupsBtn) {
        allStartupsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Клик по кнопке "Все стартапы"');
            
            // Перенаправляем на страницу каталога
            window.location.href = '/startups/';
        });
    }

    // Обработчики для категорий
    galaxyItems.forEach(item => {
        item.addEventListener('click', function(e) {
        e.preventDefault();
            e.stopPropagation();
            
            const categoryName = this.dataset.name;
            console.log('Клик по категории:', categoryName);
            
            if (categoryName && categoryName !== selectedGalaxy) {
                // Перенаправляем на планетарную систему с фильтром
                const newUrl = `${urls.planetarySystemBase}?direction=${encodeURIComponent(categoryName)}`;
                window.location.href = newUrl;
            }
        });

        // Эффект при наведении на категории
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(-5px) scale(1.05)';
                this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
            }
        });

        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = '';
                this.style.boxShadow = '';
            }
        });
    });

    // Предотвращаем случайные клики по системе
    const solarSystem = document.getElementById('solar-system');
    if (solarSystem) {
        solarSystem.addEventListener('click', function(e) {
            // Если клик не по планете или кнопке, не делаем ничего
            if (!e.target.classList.contains('planet') && 
                !e.target.classList.contains('galaxy-item') && 
                !e.target.classList.contains('all-startups-button')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    // Убираем сложную функцию инициализации

    // Инициализация: скрываем карточку при загрузке
    hideStartupCard();

    console.log('Планетарная система инициализирована');
}); 