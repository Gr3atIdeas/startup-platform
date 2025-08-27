document.addEventListener('DOMContentLoaded', function() {
    const headerSearchInput = document.querySelector('.header-search-input');
    
    if (!headerSearchInput) {
        console.log('Header search input not found');
        return;
    }

    // Создаем выпадающий список для результатов поиска
    let searchDropdown = document.querySelector('.global-search-dropdown');
    if (!searchDropdown) {
        searchDropdown = document.createElement('div');
        searchDropdown.className = 'global-search-dropdown';
        
        // Вставляем выпадающий список после поля поиска
        const searchBar = headerSearchInput.closest('.header-search-bar');
        if (searchBar) {
            searchBar.style.position = 'relative';
            searchBar.appendChild(searchDropdown);
        }
    }

    // Функция для создания элемента результата поиска
    function createSearchResultItem(item) {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        // Иконка для типа карточки
        const icon = document.createElement('span');
        icon.className = 'search-result-icon';
        
        // Цвета для разных типов
        const typeColors = {
            'user': '#4CAF50',
            'startup': '#2196F3',
            'franchise': '#FF9800',
            'agency': '#9C27B0',
            'specialist': '#607D8B'
        };
        
        const typeLabels = {
            'user': 'П',
            'startup': 'С',
            'franchise': 'Ф',
            'agency': 'А',
            'specialist': 'СП'
        };
        
        icon.style.backgroundColor = typeColors[item.type] || '#666';
        icon.textContent = typeLabels[item.type] || '?';
        
        // Текст результата
        const text = document.createElement('div');
        text.className = 'search-result-text';
        
        const name = document.createElement('div');
        name.textContent = item.name;
        name.className = 'search-result-name';
        
        const type = document.createElement('div');
        type.textContent = getTypeLabel(item.type);
        type.className = 'search-result-type';
        
        text.appendChild(name);
        text.appendChild(type);
        
        resultItem.appendChild(icon);
        resultItem.appendChild(text);
        
        // Обработчик клика
        resultItem.addEventListener('click', function() {
            window.location.href = item.url;
        });
        
        return resultItem;
    }
    
    // Функция для получения читаемого названия типа
    function getTypeLabel(type) {
        const labels = {
            'user': 'Пользователь',
            'startup': 'Стартап',
            'franchise': 'Франшиза',
            'agency': 'Агентство',
            'specialist': 'Специалист'
        };
        return labels[type] || type;
    }
    
    // Функция для отображения результатов поиска
    function displaySearchResults(results) {
        searchDropdown.innerHTML = '';
        
        let hasResults = false;
        
        // Показываем пользователей
        if (results.users && results.users.length > 0) {
            const sectionHeader = document.createElement('div');
            sectionHeader.textContent = 'Пользователи';
            sectionHeader.className = 'search-section-header';
            searchDropdown.appendChild(sectionHeader);
            
            results.users.forEach(item => {
                searchDropdown.appendChild(createSearchResultItem(item));
            });
            hasResults = true;
        }
        
        // Показываем стартапы
        if (results.startups && results.startups.length > 0) {
            const sectionHeader = document.createElement('div');
            sectionHeader.textContent = 'Стартапы';
            sectionHeader.className = 'search-section-header';
            searchDropdown.appendChild(sectionHeader);
            
            results.startups.forEach(item => {
                searchDropdown.appendChild(createSearchResultItem(item));
            });
            hasResults = true;
        }
        
        // Показываем франшизы
        if (results.franchises && results.franchises.length > 0) {
            const sectionHeader = document.createElement('div');
            sectionHeader.textContent = 'Франшизы';
            sectionHeader.className = 'search-section-header';
            searchDropdown.appendChild(sectionHeader);
            
            results.franchises.forEach(item => {
                searchDropdown.appendChild(createSearchResultItem(item));
            });
            hasResults = true;
        }
        
        // Показываем агентства
        if (results.agencies && results.agencies.length > 0) {
            const sectionHeader = document.createElement('div');
            sectionHeader.textContent = 'Агентства';
            sectionHeader.className = 'search-section-header';
            searchDropdown.appendChild(sectionHeader);
            
            results.agencies.forEach(item => {
                searchDropdown.appendChild(createSearchResultItem(item));
            });
            hasResults = true;
        }
        
        // Показываем специалистов
        if (results.specialists && results.specialists.length > 0) {
            const sectionHeader = document.createElement('div');
            sectionHeader.textContent = 'Специалисты';
            sectionHeader.className = 'search-section-header';
            searchDropdown.appendChild(sectionHeader);
            
            results.specialists.forEach(item => {
                searchDropdown.appendChild(createSearchResultItem(item));
            });
            hasResults = true;
        }
        
        // Если ничего не найдено
        if (!hasResults) {
            const noResults = document.createElement('div');
            noResults.textContent = 'По вашему запросу ничего не найдено';
            noResults.className = 'search-no-results';
            searchDropdown.appendChild(noResults);
        }
        
        searchDropdown.style.display = 'block';
    }
    
    // Функция для выполнения поиска
    function performSearch(query) {
        if (query.length < 2) {
            searchDropdown.style.display = 'none';
            return;
        }
        
        fetch(`/global-search/?q=${encodeURIComponent(query)}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data);
        })
        .catch(error => {
            console.error('Ошибка поиска:', error);
            searchDropdown.innerHTML = `
                <div class="search-error">
                    Ошибка при выполнении поиска
                </div>
            `;
            searchDropdown.style.display = 'block';
        });
    }
    
    // Обработчик ввода с задержкой (debounce)
    let searchTimeout;
    headerSearchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            performSearch(searchTerm);
        }, 300); // Задержка 300мс
    });
    
    // Обработчик фокуса
    headerSearchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            performSearch(this.value.trim());
        }
    });
    
    // Обработчик очистки поиска
    headerSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            searchDropdown.style.display = 'none';
        }
    });
    
    // Скрываем выпадающий список при клике вне поля поиска
    document.addEventListener('click', function(e) {
        if (!headerSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });
    
    console.log('Global search functionality loaded successfully');
});
