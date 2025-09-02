

(function () {
  'use strict';

  var filterFormElement;
  var newsGridElement;
  var paginationElement;
  var currentFetchController;

  function findNewsGrid(documentRoot) {
    return documentRoot.querySelector('.news-grid') || null;
  }

  function findPagination(documentRoot) {
    return documentRoot.querySelector('.pagination') || null;
  }

  function serializeFormToParams() {
    var params = new URLSearchParams();


    var sortSelect = document.getElementById('sort-by');
    if (sortSelect && sortSelect.value !== 'new') {
      params.set('sort', sortSelect.value);
    }


    var categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked');
    categoryCheckboxes.forEach(function(checkbox) {
      params.append('category', checkbox.value);
    });


    var microCheckbox = document.getElementById('microinvest');
    if (microCheckbox && microCheckbox.checked) {
      params.set('micro_investment', '1');
    }


    var minRatingInput = document.getElementById('newsMinRatingInput');
    var maxRatingInput = document.getElementById('newsMaxRatingInput');
    if (minRatingInput && maxRatingInput) {
      var minRating = parseFloat(minRatingInput.value);
      var maxRating = parseFloat(maxRatingInput.value);
      if (!isNaN(minRating) && minRating > 0) {
        params.set('min_rating', minRating);
      }
      if (!isNaN(maxRating) && maxRating < 5) {
        params.set('max_rating', maxRating);
      }
    }


    var searchInput = document.querySelector('.search-input');
    if (searchInput && searchInput.value.trim()) {
      params.set('search', searchInput.value.trim());
    }

    return params;
  }

  function buildUrlWithParams(params, keepPageParam) {
    var url = new URL(window.location.href);
    var merged = new URLSearchParams(url.search);


    if (!keepPageParam) merged.delete('page');


    params.forEach(function (value, key) {
      merged.set(key, value);
    });

    url.search = merged.toString();
    return url.toString();
  }

  function updateNewsFromHtmlResponse(htmlText, newUrl) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlText, 'text/html');

    var newGrid = findNewsGrid(doc);
    var newPagination = findPagination(doc);
    var oldGrid = newsGridElement || findNewsGrid(document);
    var oldPagination = paginationElement || findPagination(document);

    if (newGrid && oldGrid) {
      oldGrid.replaceWith(newGrid);
      newsGridElement = newGrid;
    }
    if (newPagination && oldPagination) {
      oldPagination.replaceWith(newPagination);
      paginationElement = newPagination;
    }

    history.pushState({}, '', newUrl);


    bindNewsPaginationHandlers();
    bindFormHandlers();
    bindDeleteNewsHandlers();
  }

  function fetchAndUpdate(url) {
    if (currentFetchController) {
      try { currentFetchController.abort(); } catch (_) {}
    }
    currentFetchController = new AbortController();

    return fetch(url, {
      signal: currentFetchController.signal,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      return response.text();
    })
    .then(function (htmlText) {
      if (!htmlText || htmlText.trim().length === 0) {
        throw new Error('Empty response received');
      }
      updateNewsFromHtmlResponse(htmlText, url);
    })
    .catch(function (error) {
      if (error && error.name === 'AbortError') return;

      console.error('Error updating news:', error);
      console.log('Falling back to regular navigation');
      window.location.href = url;
    });
  }

  function onFormChangeDebounced() {
    var params = serializeFormToParams();
    var url = buildUrlWithParams(params, false);
    fetchAndUpdate(url);
  }

  function debounce(fn, delay) {
    var timerId;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timerId);
      timerId = setTimeout(function () { fn.apply(context, args); }, 300);
    };
  }

  var debouncedFormChange = debounce(onFormChangeDebounced, 300);

  function bindFormHandlers() {

    var sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', debouncedFormChange);
    }


    var categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    categoryCheckboxes.forEach(function(checkbox) {
      checkbox.addEventListener('change', debouncedFormChange);
    });


    var microCheckbox = document.getElementById('microinvest');
    if (microCheckbox) {
      microCheckbox.addEventListener('change', debouncedFormChange);
    }


    var searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debouncedFormChange);
    }


    var showFiltersBtn = document.querySelector('.show-filters-btn');
    if (showFiltersBtn) {
      showFiltersBtn.addEventListener('click', function(e) {
        e.preventDefault();
        onFormChangeDebounced();
      });
    }
  }

  function bindNewsPaginationHandlers() {
    var paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    var pageLinks = paginationContainer.querySelectorAll('a[href]');
    pageLinks.forEach(function(link) {

      link.removeEventListener('click', link._paginationHandler);

      var handler = function(e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        if (href && href.includes('page=')) {
          var url = new URL(window.location.href);
          var pageParam = new URLSearchParams(href.substring(1)).get('page');
          if (pageParam) {
            url.searchParams.set('page', pageParam);
            fetchAndUpdate(url.toString());
          }
        }
      };


      link._paginationHandler = handler;
      link.addEventListener('click', handler);
    });
  }

  function bindDeleteNewsHandlers() {
    var deleteButtons = document.querySelectorAll('.delete-news-btn');
    deleteButtons.forEach(function(button) {
      button.removeEventListener('click', button._deleteHandler);

      var handler = function(e) {
        e.preventDefault();
        var articleId = this.getAttribute('data-article-id');
        if (articleId && typeof deleteNews === 'function') {
          deleteNews(articleId);
        }
      };

      button._deleteHandler = handler;
      button.addEventListener('click', handler);
    });
  }

  function init() {
    filterFormElement = document.querySelector('.news-feed-column');
    newsGridElement = findNewsGrid(document);
    paginationElement = findPagination(document);

    if (!filterFormElement || !newsGridElement) {
      return;
    }

    bindFormHandlers();
    bindNewsPaginationHandlers();
    bindDeleteNewsHandlers();


    window.addEventListener('popstate', function () {
      var url = window.location.href;
      fetch(url, {
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(function (r) { return r.text(); })
      .then(function (htmlText) {
        updateNewsFromHtmlResponse(htmlText, url);
      })
      .catch(function () { window.location.reload(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
