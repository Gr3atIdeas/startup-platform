

(function () {
  'use strict';

  var filterFormElement;
  var gridElement;
  var paginationContainerElement;
  var currentFetchController;
  var clearButtonElement;

  function findGridElement(documentRoot) {
    return (
      documentRoot.getElementById('startupsGrid') ||
      documentRoot.getElementById('franchisesGrid') ||
      null
    );
  }

  function findPaginationContainer(documentRoot) {
    return documentRoot.querySelector('.pagination-controls') || null;
  }

  function serializeFormToParams(form) {
    var formData = new FormData(form);
    var params = new URLSearchParams();
    var seenKeys = new Set();
    formData.forEach(function (value, key) {
      if (value !== null && value !== undefined && String(value).length > 0) {
        if (key === 'page') {
          return;
        }
        if (key === 'sort_order' && String(value) === 'newest') {
          return;
        }
        if (key === 'micro_investment' && String(value) === '0') {
          return;
        }
        if (key === 'category') {
          params.append(key, String(value));
        } else {
          if (seenKeys.has(key)) {
            params.set(key, String(value));
          } else {
            params.append(key, String(value));
            seenKeys.add(key);
          }
        }
      }
    });


    try {
      var minRatingInput = form.querySelector('#minRatingInput');
      var maxRatingInput = form.querySelector('#maxRatingInput');
      if (minRatingInput && maxRatingInput) {
        var rmin = parseFloat(minRatingInput.value);
        var rmax = parseFloat(maxRatingInput.value);
        if (!isNaN(rmin) && !isNaN(rmax) && rmin === 0 && rmax === 5) {
          params.delete('min_rating');
          params.delete('max_rating');
        }
      }
    } catch (_) {}


    try {
      var minPaybackInput = form.querySelector('#minPaybackInput');
      var maxPaybackInput = form.querySelector('#maxPaybackInput');
      if (minPaybackInput && maxPaybackInput) {
        var pmin = parseInt(minPaybackInput.value, 10);
        var pmax = parseInt(maxPaybackInput.value, 10);
        if (!isNaN(pmin) && !isNaN(pmax) && pmin === 0 && pmax === 60) {
          params.delete('min_payback');
          params.delete('max_payback');
        }
      }
    } catch (_) {}


    try {
      var minInvestmentInput = form.querySelector('#minInvestmentInput');
      var maxInvestmentInput = form.querySelector('#maxInvestmentInput');
      if (minInvestmentInput && maxInvestmentInput) {
        var imin = parseInt(minInvestmentInput.value, 10);
        var imax = parseInt(maxInvestmentInput.value, 10);
        if (!isNaN(imin) && (isNaN(imax) || imax === 10000000) && imin === 0) {
          params.delete('min_investment');
          params.delete('max_investment');
        }
      }
    } catch (_) {}

    return params;
  }

  function hasActiveFilters(form) {

    var elements = form.elements;
    for (var i = 0; i < elements.length; i += 1) {
      var el = elements[i];
      if (!el || !el.name) continue;
      if (el.type === 'checkbox' && el.name === 'category' && el.checked) return true;
      if (el.name === 'micro_investment' && String(el.value) === '1') return true;
      if (el.name === 'min_rating' && parseFloat(el.value) > 0) return true;
      if (el.name === 'max_rating' && parseFloat(el.value) < 5) return true;
      if (el.name === 'min_payback' && parseInt(el.value, 10) > 0) return true;
      if (el.name === 'max_payback' && parseInt(el.value, 10) < 60) return true;
      if (el.name === 'min_investment' && parseInt(el.value, 10) > 0) return true;
      if (el.name === 'max_investment' && parseInt(el.value, 10) < 10000000) return true;
      if (el.name === 'min_goal' && parseInt(el.value, 10) > 0) return true;
      if (el.name === 'max_goal' && parseInt(el.value, 10) < 10000000) return true;
      if (el.name === 'min_micro' && parseInt(el.value, 10) > 0) return true;
      if (el.name === 'max_micro' && parseInt(el.value, 10) < 1000000) return true;
    }
    return false;
  }

  function updateClearButtonVisibility() {
    if (!clearButtonElement || !filterFormElement) return;
    var active = hasActiveFilters(filterFormElement);
    clearButtonElement.style.display = active ? 'block' : 'none';
  }

  function normalizeDefaultInputs() {
    if (!filterFormElement) return;
    var minInv = filterFormElement.querySelector('#minInvestmentInput');
    var maxInv = filterFormElement.querySelector('#maxInvestmentInput');
    if (minInv && maxInv) {
      var imin = parseInt(minInv.value || '0', 10);
      var imax = parseInt(maxInv.value || '0', 10);
      if (isNaN(imin) || imin < 0) imin = 0;
      if (isNaN(imax) || imax <= 0 || imax < imin) imax = 10000000;
      minInv.value = String(imin);
      maxInv.value = String(imax);
    }
  }

  function applyUrlParamsToForm(urlSearchParams, form) {
    if (!form) return;
    var elements = form.elements;
    for (var i = 0; i < elements.length; i += 1) {
      var input = elements[i];
      if (!input.name) continue;
      var name = input.name;
      if (input.type === 'checkbox') {
        var values = urlSearchParams.getAll(name);
        input.checked = values.indexOf(input.value) !== -1;
      } else if (input.tagName === 'SELECT') {
        var selectedValue = urlSearchParams.get(name);
        if (selectedValue !== null) input.value = selectedValue;
      } else if (input.type === 'hidden' || input.type === 'text' || input.type === 'number') {
        var v = urlSearchParams.get(name);
        if (v !== null) input.value = v;
      }
    }


    var microToggle = document.getElementById('microToggle');
    var microParam = urlSearchParams.get('micro_investment');
    if (microToggle) {
      if (microParam === '1') microToggle.classList.add('active');
      else microToggle.classList.remove('active');
    }


    var ratingSlider = document.getElementById('ratingSlider');
    var minRating = urlSearchParams.get('min_rating');
    var maxRating = urlSearchParams.get('max_rating');
    if (ratingSlider && ratingSlider.noUiSlider && minRating !== null && maxRating !== null) {
      try { ratingSlider.noUiSlider.set([minRating, maxRating]); } catch (_) {}
    }


    var paybackSlider = document.getElementById('paybackSlider');
    var investmentSlider = document.getElementById('investmentSlider');
    var minPayback = urlSearchParams.get('min_payback');
    var maxPayback = urlSearchParams.get('max_payback');
    var minInvestment = urlSearchParams.get('min_investment');
    var maxInvestment = urlSearchParams.get('max_investment');
    if (paybackSlider && paybackSlider.noUiSlider && minPayback !== null && maxPayback !== null) {
      try { paybackSlider.noUiSlider.set([minPayback, maxPayback]); } catch (_) {}
    }
    if (investmentSlider && investmentSlider.noUiSlider && minInvestment !== null && maxInvestment !== null) {
      try { investmentSlider.noUiSlider.set([minInvestment, maxInvestment]); } catch (_) {}
    }
  }

  function updatePageFromHtmlResponse(htmlText, newUrl) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlText, 'text/html');

    var newGrid = findGridElement(doc);
    var newPagination = findPaginationContainer(doc);
    var oldGrid = gridElement || findGridElement(document);
    var oldPagination = paginationContainerElement || findPaginationContainer(document);

    if (newGrid && oldGrid) {
      oldGrid.replaceWith(newGrid);
      gridElement = newGrid;
    }
    if (newPagination && oldPagination) {
      oldPagination.replaceWith(newPagination);
      paginationContainerElement = newPagination;
    }

    history.pushState({}, '', newUrl);


    bindPaginationHandlers();
    bindFormHandlers();
    attachSliderListenersWithRetry(20, 200);
    clearButtonElement = document.getElementById('clearFiltersBtn');
    bindClearButton();
    updateClearButtonVisibility();
  }

  function fetchAndUpdate(url, options) {
    if (currentFetchController) {
      try { currentFetchController.abort(); } catch (_) {}
    }
    currentFetchController = new AbortController();

    return fetch(url, { signal: currentFetchController.signal, credentials: 'same-origin' })
      .then(function (response) { return response.text(); })
      .then(function (htmlText) { updatePageFromHtmlResponse(htmlText, url); })
      .catch(function (error) {
        if (error && error.name === 'AbortError') return;

        window.location.href = url;
      });
  }

  function buildUrlWithParams(params, keepPageParam) {
    var url = new URL(window.location.href);
    var merged = new URLSearchParams(url.search);


    if (!keepPageParam) merged.delete('page');


    try {
      if (filterFormElement && filterFormElement.elements) {
        var elements = filterFormElement.elements;
        for (var i = 0; i < elements.length; i += 1) {
          var el = elements[i];
          if (!el || !el.name) continue;
          merged.delete(el.name);
        }
      }
    } catch (_) {}


    params.forEach(function (_, key) { merged.delete(key); });

    params.forEach(function (value, key) { merged.append(key, value); });

    url.search = merged.toString();
    return url.toString();
  }

  function onFormChangeDebounced() {
    if (!filterFormElement) return;
    var params = serializeFormToParams(filterFormElement);
    var url = buildUrlWithParams(params, false);
    updateClearButtonVisibility();
    fetchAndUpdate(url);
  }

  function debounce(fn, delay) {
    var timerId;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timerId);
      timerId = setTimeout(function () { fn.apply(context, args); }, delay);
    };
  }

  var debouncedFormChange = debounce(onFormChangeDebounced, 250);
  var debouncedSearchChange = debounce(onFormChangeDebounced, 400);

  function attachSliderListenersWithRetry(maxAttempts, intervalMs) {
    var attempts = 0;
    function tryAttach() {
      attempts += 1;
      var ratingSlider = document.getElementById('ratingSlider');
      if (ratingSlider && ratingSlider.noUiSlider && !ratingSlider.__ajaxBound) {
        ratingSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
        ratingSlider.__ajaxBound = true;
      }
      var paybackSlider = document.getElementById('paybackSlider');
      if (paybackSlider && paybackSlider.noUiSlider && !paybackSlider.__ajaxBound) {
        paybackSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
        paybackSlider.__ajaxBound = true;
      }
      var investmentSlider = document.getElementById('investmentSlider');
      if (investmentSlider && investmentSlider.noUiSlider && !investmentSlider.__ajaxBound) {
        investmentSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
        investmentSlider.__ajaxBound = true;
      }
      var done = (
        (ratingSlider ? !!ratingSlider.__ajaxBound : true) &&
        (paybackSlider ? !!paybackSlider.__ajaxBound : true) &&
        (investmentSlider ? !!investmentSlider.__ajaxBound : true)
      );
      if (!done && attempts < maxAttempts) {
        setTimeout(tryAttach, intervalMs);
      }
    }
    tryAttach();
  }

  function bindFormHandlers() {
    if (!filterFormElement) return;

    filterFormElement.addEventListener('submit', function (e) {
      e.preventDefault();
      onFormChangeDebounced();
    });

    filterFormElement.addEventListener('change', function (e) {
      var target = e.target;
      if (!target) return;
      if (target.matches('input[type="text"], input[type="search"]')) return;
      debouncedFormChange();
    });

    var searchInput = document.querySelector('.catalog-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () { debouncedSearchChange(); });
    }

    var microToggle = document.getElementById('microToggle');
    if (microToggle) {
      microToggle.addEventListener('click', function () {

        setTimeout(function () { debouncedFormChange(); }, 0);
      });
    }

    var ratingSlider = document.getElementById('ratingSlider');
    if (ratingSlider && ratingSlider.noUiSlider) {
      ratingSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
      ratingSlider.__ajaxBound = true;
    }

    var paybackSlider = document.getElementById('paybackSlider');
    if (paybackSlider && paybackSlider.noUiSlider) {
      paybackSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
      paybackSlider.__ajaxBound = true;
    }

    var investmentSlider = document.getElementById('investmentSlider');
    if (investmentSlider && investmentSlider.noUiSlider) {
      investmentSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
      investmentSlider.__ajaxBound = true;
    }
  }

  function bindClearButton() {
    if (!filterFormElement) return;
    clearButtonElement = document.getElementById('clearFiltersBtn');
    if (!clearButtonElement) return;
    clearButtonElement.addEventListener('click', function () {
      var checkboxes = filterFormElement.querySelectorAll('input[type="checkbox"][name="category"]');
      checkboxes.forEach(function (cb) { cb.checked = false; });

      var microInput = document.getElementById('microInvestmentInput');
      var microToggle = document.getElementById('microToggle');
      if (microInput) microInput.value = '0';
      if (microToggle) microToggle.classList.remove('active');

      var minRatingInput = document.getElementById('minRatingInput');
      var maxRatingInput = document.getElementById('maxRatingInput');
      if (minRatingInput) minRatingInput.value = '0.0';
      if (maxRatingInput) maxRatingInput.value = '5.0';
      var ratingSlider = document.getElementById('ratingSlider');
      if (ratingSlider && ratingSlider.noUiSlider) {
        try { ratingSlider.noUiSlider.set([0, 5]); } catch (_) {}
      }

      var minPaybackInput = document.getElementById('minPaybackInput');
      var maxPaybackInput = document.getElementById('maxPaybackInput');
      if (minPaybackInput) minPaybackInput.value = '0';
      if (maxPaybackInput) maxPaybackInput.value = '60';
      var paybackSlider = document.getElementById('paybackSlider');
      if (paybackSlider && paybackSlider.noUiSlider) {
        try { paybackSlider.noUiSlider.set([0, 60]); } catch (_) {}
      }

      var minInvestmentInput = document.getElementById('minInvestmentInput');
      var maxInvestmentInput = document.getElementById('maxInvestmentInput');
      if (minInvestmentInput) minInvestmentInput.value = '0';
      if (maxInvestmentInput) maxInvestmentInput.value = '10000000';
      var investmentSlider = document.getElementById('investmentSlider');
      if (investmentSlider && investmentSlider.noUiSlider) {
        try { investmentSlider.noUiSlider.set([0, 10000000]); } catch (_) {}
      }

      var minGoalInput = filterFormElement.querySelector('input[name="min_goal"]');
      var maxGoalInput = filterFormElement.querySelector('input[name="max_goal"]');
      if (minGoalInput) minGoalInput.value = '0';
      if (maxGoalInput) maxGoalInput.value = '10000000';

      var minMicroInput = filterFormElement.querySelector('input[name="min_micro"]');
      var maxMicroInput = filterFormElement.querySelector('input[name="max_micro"]');
      if (minMicroInput) minMicroInput.value = '0';
      if (maxMicroInput) maxMicroInput.value = '1000000';

      var sortSelect = document.getElementById('sortOrder');
      if (sortSelect) sortSelect.value = 'newest';

      var params = serializeFormToParams(filterFormElement);
      var url = buildUrlWithParams(params, false);
      fetchAndUpdate(url).then(function () { updateClearButtonVisibility(); });
    });
  }

  function bindPaginationHandlers() {
    var container = document.querySelector('.pagination-numbers');
    if (!container) return;
    var links = container.querySelectorAll('a[href]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var targetUrl = new URL(link.href);
        var targetParams = new URLSearchParams(targetUrl.search);


        var formParams = serializeFormToParams(filterFormElement);

        var pageValue = targetParams.get('page');
        if (pageValue !== null) {
          formParams.set('page', pageValue);
        }

        var finalUrl = buildUrlWithParams(formParams, true);
        fetchAndUpdate(finalUrl);
      });
    });
  }

  function init() {
    filterFormElement = document.getElementById('filterForm');
    gridElement = findGridElement(document);
    paginationContainerElement = findPaginationContainer(document);

    if (!filterFormElement || !gridElement) {
      return;
    }


    setTimeout(function(){
      applyUrlParamsToForm(new URLSearchParams(window.location.search), filterFormElement);
    }, 0);

    bindFormHandlers();
    bindPaginationHandlers();
    attachSliderListenersWithRetry(20, 200);
    clearButtonElement = document.getElementById('clearFiltersBtn');
    bindClearButton();
    normalizeDefaultInputs();
    setTimeout(function () { updateClearButtonVisibility(); }, 0);
    setTimeout(function () { updateClearButtonVisibility(); }, 150);
    setTimeout(function () { updateClearButtonVisibility(); }, 400);

    window.addEventListener('popstate', function () {
      var url = window.location.href;
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.text(); })
        .then(function (htmlText) {
          updatePageFromHtmlResponse(htmlText, url);

          applyUrlParamsToForm(new URLSearchParams(window.location.search), filterFormElement);
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


