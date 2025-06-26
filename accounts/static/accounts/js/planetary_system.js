// Планетарная система - JavaScript для первого блока главной страницы инвестора
class PlanetarySystemHero {
    constructor() {
        this.currentDirection = 0;
        this.directions = [];
        this.planetsData = [];
        this.selectedPlanet = null;
        this.isAnimating = false;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.createStars();
        this.startAnimations();
    }
    
    loadData() {
        // Получаем данные из скрипта в шаблоне
        const dataScript = document.getElementById('planetary-system-data');
        if (dataScript) {
            try {
                const data = JSON.parse(dataScript.textContent);
                this.planetsData = data.planetsData || [];
                this.directions = data.directionsData || [];
                this.isAuthenticated = data.isAuthenticated || false;
                this.isStartuper = data.isStartuper || false;
                this.urls = data.urls || {};
                
                this.renderPlanets();
            } catch (error) {
                console.error('Ошибка загрузки данных планетарной системы:', error);
            }
        }
    }
    
    setupEventListeners() {
        // Навигационные кнопки
        const leftButton = document.querySelector('.nav-button-left');
        const rightButton = document.querySelector('.nav-button-right');
        
        if (leftButton) {
            leftButton.addEventListener('click', () => this.navigateDirection(-1));
        }
        
        if (rightButton) {
            rightButton.addEventListener('click', () => this.navigateDirection(1));
        }
        
        // Кнопка "Все стартапы"
        const allStartupsButton = document.querySelector('.all-startups-button');
        if (allStartupsButton) {
            allStartupsButton.addEventListener('click', () => {
                window.location.href = '/startups/';
            });
        }
        
        // Кнопка "Начать"
        const startButton = document.querySelector('.start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                if (!this.isAuthenticated) {
                    window.location.href = this.urls.register || '/register/';
                } else if (!this.isStartuper) {
                    window.location.href = this.urls.createStartup || '/create-startup/';
                } else {
                    window.location.href = '/startups/';
                }
            });
        }
        
        // Центральное солнце
        const centralSun = document.querySelector('.central-sun');
        if (centralSun) {
            centralSun.addEventListener('click', () => {
                this.showRandomStartup();
            });
        }
        
        // Закрытие информационной карточки
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button')) {
                this.hideStartupInfo();
            }
        });
        
        // Закрытие по клику вне карточки
        document.addEventListener('click', (e) => {
            const infoCard = document.querySelector('.startup-info-card');
            if (infoCard && infoCard.classList.contains('active') && 
                !infoCard.contains(e.target) && 
                !e.target.classList.contains('startup-planet')) {
                this.hideStartupInfo();
            }
        });
    }
    
    renderPlanets() {
        const container = document.querySelector('.planetary-system-hero');
        if (!container) return;
        
        // Удаляем существующие планеты
        const existingPlanets = container.querySelectorAll('.startup-planet');
        existingPlanets.forEach(planet => planet.remove());
        
        // Создаем новые планеты
        this.planetsData.forEach((planet, index) => {
            if (index >= 8) return; // Максимум 8 планет
            
            const planetElement = document.createElement('div');
            planetElement.className = `startup-planet planet-${index + 1}`;
            planetElement.style.backgroundImage = `url('${planet.image}')`;
            planetElement.dataset.planetId = planet.id;
            planetElement.dataset.startupId = planet.startup_id;
            
            // Добавляем обработчик клика
            planetElement.addEventListener('click', () => {
                this.showStartupInfo(planet);
            });
            
            container.appendChild(planetElement);
        });
        
        // Обновляем категорию
        this.updateCategoryBadge();
    }
    
    showStartupInfo(planet) {
        if (this.isAnimating) return;
        
        this.selectedPlanet = planet;
        
        // Создаем или обновляем информационную карточку
        let infoCard = document.querySelector('.startup-info-card');
        if (!infoCard) {
            infoCard = this.createInfoCard();
        }
        
        // Заполняем данными
        infoCard.querySelector('.startup-name').textContent = planet.name;
        infoCard.querySelector('.startup-rating').textContent = `★★★★☆ ${planet.rating}/5`;
        infoCard.querySelector('.startup-description').textContent = planet.description || 'Описание стартапа...';
        
        // Показываем карточку
        infoCard.classList.add('active');
        
        // Обработчик кнопки "Подробнее"
        const detailsButton = infoCard.querySelector('.more-details-button');
        detailsButton.onclick = () => {
            window.location.href = `/startup/${planet.startup_id}/`;
        };
    }
    
    createInfoCard() {
        const infoCard = document.createElement('div');
        infoCard.className = 'startup-info-card';
        infoCard.innerHTML = `
            <button class="close-button">×</button>
            <h2 class="startup-name"></h2>
            <div class="startup-rating"></div>
            <div class="startup-description"></div>
            <button class="more-details-button">Подробнее</button>
        `;
        
        document.body.appendChild(infoCard);
        return infoCard;
    }
    
    hideStartupInfo() {
        const infoCard = document.querySelector('.startup-info-card');
        if (infoCard) {
            infoCard.classList.remove('active');
        }
        this.selectedPlanet = null;
    }
    
    navigateDirection(direction) {
        if (this.isAnimating || this.directions.length === 0) return;
        
        this.isAnimating = true;
        
        // Обновляем текущее направление
        this.currentDirection += direction;
        if (this.currentDirection >= this.directions.length) {
            this.currentDirection = 0;
        } else if (this.currentDirection < 0) {
            this.currentDirection = this.directions.length - 1;
        }
        
        // Анимация смены планет
        const planets = document.querySelectorAll('.startup-planet');
        planets.forEach(planet => {
            planet.style.transform = 'scale(0)';
            planet.style.opacity = '0';
        });
        
        setTimeout(() => {
            // Загружаем новые данные для выбранного направления
            this.loadDirectionData(this.directions[this.currentDirection].direction_name);
            
            setTimeout(() => {
                const newPlanets = document.querySelectorAll('.startup-planet');
                newPlanets.forEach(planet => {
                    planet.style.transform = 'scale(1)';
                    planet.style.opacity = '1';
                });
                
                this.isAnimating = false;
            }, 300);
        }, 300);
    }
    
    loadDirectionData(directionName) {
        // В реальном приложении здесь был бы AJAX запрос
        // Пока используем существующие данные
        this.renderPlanets();
        this.updateCategoryBadge();
    }
    
    updateCategoryBadge() {
        const badge = document.querySelector('.category-badge');
        if (badge && this.directions.length > 0) {
            badge.textContent = this.directions[this.currentDirection]?.direction_name || 'Все категории';
        }
    }
    
    showRandomStartup() {
        if (this.planetsData.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.planetsData.length);
        const randomPlanet = this.planetsData[randomIndex];
        this.showStartupInfo(randomPlanet);
    }
    
    createStars() {
        const container = document.querySelector('.planetary-system-hero');
        if (!container) return;
        
        // Создаем звездное небо
        const starsBackground = document.createElement('div');
        starsBackground.className = 'stars-background';
        container.appendChild(starsBackground);
    }
    
    startAnimations() {
        // Запускаем анимации планет
        const planets = document.querySelectorAll('.startup-planet');
        planets.forEach((planet, index) => {
            planet.style.animationDelay = `${index * 0.5}s`;
        });
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    new PlanetarySystemHero();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanetarySystemHero;
} 