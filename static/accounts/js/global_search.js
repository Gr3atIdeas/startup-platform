document.addEventListener('DOMContentLoaded', function() {
    const headerSearchInput = document.querySelector('.header-search-input');

    if (!headerSearchInput) {
        console.log('Header search input not found');
        return;
    }


    let searchDropdown = document.querySelector('.global-search-dropdown');
    if (!searchDropdown) {
        searchDropdown = document.createElement('div');
        searchDropdown.className = 'global-search-dropdown';


        const searchBar = headerSearchInput.closest('.header-search-bar');
        if (searchBar) {
            searchBar.style.position = 'relative';
            searchBar.appendChild(searchDropdown);
        }
    }


    function createSearchResultItem(item) {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';


        const icon = document.createElement('span');
        icon.className = 'search-result-icon';


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


        resultItem.addEventListener('click', function() {
            window.location.href = item.url;
        });

        return resultItem;
    }


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


    function displaySearchResults(results) {
        searchDropdown.innerHTML = '';

        let hasResults = false;


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


        if (!hasResults) {
            const noResults = document.createElement('div');
            noResults.textContent = 'По вашему запросу ничего не найдено';
            noResults.className = 'search-no-results';
            searchDropdown.appendChild(noResults);
        }

        searchDropdown.style.display = 'block';
    }


    function performSearch(query) {
        if (query.length < 2) {
            searchDropdown.style.display = 'none';
            return;
        }


        searchDropdown.innerHTML = `
            <div class="search-loading">
                <div class="spinner"></div>
                <span>Поиск...</span>
            </div>
        `;
        searchDropdown.style.display = 'block';

        fetch(`/global-search/?q=${encodeURIComponent(query)}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {

            if (data.error) {
                throw new Error(data.error);
            }
            displaySearchResults(data);
        })
        .catch(error => {
            console.error('Ошибка поиска:', error);


            let errorMessage = 'Ошибка при выполнении поиска';
            let errorDetails = '';

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Ошибка сети';
                errorDetails = 'Проверьте подключение к интернету';
            } else if (error.message.includes('HTTP 500')) {
                errorMessage = 'Ошибка сервера';
                errorDetails = 'Попробуйте позже';
            } else if (error.message.includes('HTTP 404')) {
                errorMessage = 'Страница не найдена';
                errorDetails = 'Проверьте URL';
            } else if (error.message) {
                errorDetails = error.message;
            }

            searchDropdown.innerHTML = `
                <div class="search-error">
                    <div class="error-title">${errorMessage}</div>
                    ${errorDetails ? `<div class="error-details">${errorDetails}</div>` : ''}
                    <button class="retry-button" onclick="performSearch('${query}')">Повторить</button>
                </div>
            `;
            searchDropdown.style.display = 'block';
        });
    }


    let searchTimeout;
    headerSearchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            performSearch(searchTerm);
        }, 300);
    });


    headerSearchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            performSearch(this.value.trim());
        }
    });


    headerSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            searchDropdown.style.display = 'none';
        }
    });


    document.addEventListener('click', function(e) {
        if (!headerSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    console.log('Global search functionality loaded successfully');
});


