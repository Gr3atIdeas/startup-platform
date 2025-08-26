document.addEventListener('DOMContentLoaded', function() {
    const headerSearchInput = document.querySelector('.header-search-input');
    
    if (!headerSearchInput) {
        console.log('Header search input not found');
        return;
    }

    // Определяем тип страницы и соответствующие селекторы
    let cardSelector, titleSelector, descriptionSelector;
    
    // Проверяем, на какой странице мы находимся
    if (document.querySelector('.startup-card')) {
        // Страница стартапов
        cardSelector = '.startup-card';
        titleSelector = '.startup-title';
        descriptionSelector = '.startup-description';
    } else if (document.querySelector('.franchise-card')) {
        // Проверяем, что это за тип карточки по тексту тега
        const franchiseTag = document.querySelector('.franchise-tag');
        if (franchiseTag) {
            const tagText = franchiseTag.textContent.toLowerCase();
            if (tagText.includes('франшиза')) {
                // Страница франшиз
                cardSelector = '.franchise-card';
                titleSelector = '.franchise-title';
                descriptionSelector = '.franchise-description';
            } else if (tagText.includes('агентство')) {
                // Страница агентств
                cardSelector = '.franchise-card';
                titleSelector = '.franchise-title';
                descriptionSelector = '.franchise-description';
            } else if (tagText.includes('специалист')) {
                // Страница специалистов
                cardSelector = '.franchise-card';
                titleSelector = '.franchise-title';
                descriptionSelector = '.franchise-description';
            }
        } else {
            // По умолчанию считаем франшизами
            cardSelector = '.franchise-card';
            titleSelector = '.franchise-title';
            descriptionSelector = '.franchise-description';
        }
    } else {
        console.log('No matching card type found');
        return;
    }

    console.log('Header search initialized for:', cardSelector);

    // Функция для фильтрации карточек
    function filterCards(searchTerm) {
        const cards = document.querySelectorAll(cardSelector);
        const searchLower = searchTerm.toLowerCase();
        
        let visibleCount = 0;
        
        cards.forEach(card => {
            const titleElement = card.querySelector(titleSelector);
            
            let isVisible = false;
            
            if (titleElement) {
                const titleText = titleElement.textContent.toLowerCase();
                if (titleText.includes(searchLower)) {
                    isVisible = true;
                }
            }
            
            if (isVisible) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Показываем сообщение, если ничего не найдено
        showNoResultsMessage(visibleCount === 0 && searchTerm.length > 0);
        
        console.log(`Filtered cards: ${visibleCount} visible out of ${cards.length}`);
    }
    
    // Функция для показа/скрытия сообщения "Ничего не найдено"
    function showNoResultsMessage(show) {
        let noResultsMessage = document.querySelector('.no-results-message');
        
        if (show && !noResultsMessage) {
            noResultsMessage = document.createElement('div');
            noResultsMessage.className = 'no-results-message';
            noResultsMessage.innerHTML = '<p>По вашему запросу ничего не найдено</p>';
            noResultsMessage.style.cssText = `
                text-align: center;
                padding: 40px 20px;
                color: #666;
                font-size: 16px;
                grid-column: 1 / -1;
            `;
            
            const grid = document.querySelector('.startups-grid, .franchises-grid, .agencies-grid, .specialists-grid, .catalog-grid');
            if (grid) {
                grid.appendChild(noResultsMessage);
            }
        } else if (!show && noResultsMessage) {
            noResultsMessage.remove();
        }
    }
    
    // Обработчик ввода с задержкой (debounce)
    let searchTimeout;
    headerSearchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            filterCards(searchTerm);
        }, 300); // Задержка 300мс
    });
    
    // Обработчик очистки поиска
    headerSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            filterCards('');
        }
    });
    
    console.log('Header search functionality loaded successfully');
});
