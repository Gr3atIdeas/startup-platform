/*
  Реал-тайм AJAX фильтрация для каталогов (стартапы, франшизы, агентства, специалисты)
  Стратегия: загружаем полную страницу по URL с текущими параметрами и
  заменяем в DOM только сетку карточек и пагинацию. Состояние формы
  синхронизируем с URL, не переинициализируя существующие слайдеры.
*/

(function () {
  'use strict';

  var filterFormElement;
  var gridElement;
  var paginationContainerElement;
  var currentFetchController;

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
    return params;
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

    // Отдельная синхронизация визуальных переключателей/слайдеров
    var microToggle = document.getElementById('microToggle');
    var microParam = urlSearchParams.get('micro_investment');
    if (microToggle) {
      if (microParam === '1') microToggle.classList.add('active');
      else microToggle.classList.remove('active');
    }

    // Рейтинг слайдер
    var ratingSlider = document.getElementById('ratingSlider');
    var minRating = urlSearchParams.get('min_rating');
    var maxRating = urlSearchParams.get('max_rating');
    if (ratingSlider && ratingSlider.noUiSlider && minRating !== null && maxRating !== null) {
      try { ratingSlider.noUiSlider.set([minRating, maxRating]); } catch (_) {}
    }

    // Франшизы: слайдеры окупаемости/инвестиций
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

    // После замены DOM перевешиваем обработчики
    bindPaginationHandlers();
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
        // Фолбэк: если что-то пошло не так — обычная навигация
        window.location.href = url;
      });
  }

  function buildUrlWithParams(params, keepPageParam) {
    var url = new URL(window.location.href);
    var merged = new URLSearchParams(url.search);

    // Сбрасываем page, если не указано оставить
    if (!keepPageParam) merged.delete('page');

    // Полный сброс параметров, контролируемых формой, чтобы удалить снятые чекбоксы и прочие ключи
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

    // На всякий случай также удаляем ключи, присланные в текущих params
    params.forEach(function (_, key) { merged.delete(key); });
    // Добавляем актуальные значения формы
    params.forEach(function (value, key) { merged.append(key, value); });

    url.search = merged.toString();
    return url.toString();
  }

  function onFormChangeDebounced() {
    if (!filterFormElement) return;
    var params = serializeFormToParams(filterFormElement);
    var url = buildUrlWithParams(params, false);
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
        // toggleMicroInvestment уже обновляет скрытый инпут; просто триггерим запрос
        setTimeout(function () { debouncedFormChange(); }, 0);
      });
    }

    var ratingSlider = document.getElementById('ratingSlider');
    if (ratingSlider && ratingSlider.noUiSlider) {
      ratingSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
    }

    var paybackSlider = document.getElementById('paybackSlider');
    if (paybackSlider && paybackSlider.noUiSlider) {
      paybackSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
    }

    var investmentSlider = document.getElementById('investmentSlider');
    if (investmentSlider && investmentSlider.noUiSlider) {
      investmentSlider.noUiSlider.on('change', function () { debouncedFormChange(); });
    }
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

        // Собираем текущие параметры формы
        var formParams = serializeFormToParams(filterFormElement);
        // Переносим параметр page из ссылки
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
      return; // не страница каталога
    }

    // Синхронизируем форму с текущим URL при старте
    applyUrlParamsToForm(new URLSearchParams(window.location.search), filterFormElement);

    bindFormHandlers();
    bindPaginationHandlers();

    window.addEventListener('popstate', function () {
      var url = window.location.href;
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.text(); })
        .then(function (htmlText) {
          updatePageFromHtmlResponse(htmlText, url);
          // После загрузки синхронизируем форму c URL, чтобы отобразить актуальные значения
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


