(function() {
  'use strict';

  var modal = document.getElementById('leadModal');
  if (!modal) return;

  var form = document.getElementById('leadForm');
  var errorDiv = document.getElementById('leadFormError');
  var formContent = document.getElementById('leadFormContent');
  var successContent = document.getElementById('leadSuccessContent');
  var submitBtn = document.getElementById('leadSubmitBtn');

  // ── Custom Select Dropdowns ──────────────────────
  var customSelects = modal.querySelectorAll('.lead-custom-select');

  customSelects.forEach(function(sel) {
    var trigger = sel.querySelector('.lead-custom-select-trigger');
    var dropdown = sel.querySelector('.lead-custom-select-dropdown');
    var hiddenInput = sel.querySelector('input[type="hidden"]');
    var valueSpan = trigger.querySelector('.lead-select-value');
    var options = dropdown.querySelectorAll('.lead-custom-select-option');

    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      // Close all other selects
      customSelects.forEach(function(other) {
        if (other !== sel) other.classList.remove('open');
      });
      sel.classList.toggle('open');
    });

    options.forEach(function(opt) {
      opt.addEventListener('click', function() {
        options.forEach(function(o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        hiddenInput.value = opt.dataset.value;
        valueSpan.textContent = opt.textContent;
        sel.classList.remove('open');
      });
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.lead-custom-select')) {
      customSelects.forEach(function(sel) { sel.classList.remove('open'); });
    }
  });

  // ── City Autocomplete ────────────────────────────
  var RUSSIAN_CITIES = [
    'Москва','Санкт-Петербург','Новосибирск','Екатеринбург','Казань',
    'Нижний Новгород','Челябинск','Самара','Омск','Ростов-на-Дону',
    'Уфа','Красноярск','Воронеж','Пермь','Волгоград',
    'Краснодар','Саратов','Тюмень','Тольятти','Ижевск',
    'Барнаул','Ульяновск','Иркутск','Хабаровск','Ярославль',
    'Владивосток','Махачкала','Томск','Оренбург','Кемерово',
    'Новокузнецк','Рязань','Астрахань','Набережные Челны','Пенза',
    'Липецк','Тула','Киров','Чебоксары','Калининград',
    'Брянск','Курск','Иваново','Магнитогорск','Улан-Удэ',
    'Тверь','Ставрополь','Белгород','Сочи','Нижний Тагил',
    'Архангельск','Владимир','Калуга','Смоленск','Чита',
    'Саранск','Вологда','Орёл','Грозный','Владикавказ',
    'Мурманск','Тамбов','Петрозаводск','Кострома','Нальчик',
    'Йошкар-Ола','Якутск','Сургут','Симферополь','Севастополь',
    'Абакан','Великий Новгород','Псков','Череповец','Подольск',
    'Балашиха','Химки','Мытищи','Люберцы','Королёв',
    'Красногорск','Одинцово','Домодедово','Электросталь','Коломна',
  ];

  var cityInput = document.getElementById('leadCity');
  var citySuggestions = document.getElementById('leadCitySuggestions');

  if (cityInput && citySuggestions) {
    var debounceTimer = null;

    cityInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var query = cityInput.value.trim().toLowerCase();
        citySuggestions.innerHTML = '';

        if (query.length < 1) {
          citySuggestions.classList.remove('visible');
          return;
        }

        var matches = RUSSIAN_CITIES.filter(function(city) {
          return city.toLowerCase().indexOf(query) !== -1;
        }).slice(0, 8);

        if (matches.length === 0) {
          citySuggestions.classList.remove('visible');
          return;
        }

        matches.forEach(function(city) {
          var div = document.createElement('div');
          div.className = 'lead-city-suggestion';
          // Highlight matching part
          var idx = city.toLowerCase().indexOf(query);
          div.innerHTML = city.substring(0, idx) +
            '<mark>' + city.substring(idx, idx + query.length) + '</mark>' +
            city.substring(idx + query.length);
          div.addEventListener('click', function() {
            cityInput.value = city;
            citySuggestions.classList.remove('visible');
          });
          citySuggestions.appendChild(div);
        });

        citySuggestions.classList.add('visible');
      }, 150);
    });

    // Hide on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.lead-city-autocomplete')) {
        citySuggestions.classList.remove('visible');
      }
    });

    // Hide on blur with delay (so click on suggestion works)
    cityInput.addEventListener('blur', function() {
      setTimeout(function() {
        citySuggestions.classList.remove('visible');
      }, 200);
    });
  }

  // ── Open / Close Modal ───────────────────────────
  window.openLeadModal = function() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset form state
    if (form) form.reset();
    // Reset custom selects
    customSelects.forEach(function(sel) {
      var hiddenInput = sel.querySelector('input[type="hidden"]');
      var valueSpan = sel.querySelector('.lead-select-value');
      var options = sel.querySelectorAll('.lead-custom-select-option');
      hiddenInput.value = '';
      valueSpan.textContent = 'Не указан';
      options.forEach(function(o, i) {
        o.classList.toggle('selected', i === 0);
      });
      sel.classList.remove('open');
    });
    // Re-fill autofill fields
    var nameInput = document.getElementById('leadName');
    var emailInput = document.getElementById('leadEmail');
    if (nameInput && nameInput.defaultValue) nameInput.value = nameInput.defaultValue;
    if (emailInput && emailInput.defaultValue) emailInput.value = emailInput.defaultValue;

    formContent.style.display = '';
    successContent.style.display = 'none';
    errorDiv.style.display = 'none';
  };

  window.closeLeadModal = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeLeadModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeLeadModal();
    }
  });

  // ── Submit Form ──────────────────────────────────
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var entityType = modal.dataset.entityType;
      var entityId = modal.dataset.entityId;
      var leadType = modal.dataset.leadType;

      var name = (document.getElementById('leadName').value || '').trim();
      var email = (document.getElementById('leadEmail').value || '').trim();
      var phone = (document.getElementById('leadPhone').value || '').trim();
      var messenger = (document.getElementById('leadMessenger').value || '').trim();
      var budgetRange = document.getElementById('leadBudget').value || '';
      var message = (document.getElementById('leadMessage').value || '').trim();
      var targetCityText = (document.getElementById('leadCity').value || '').trim();
      var businessExperience = document.getElementById('leadExperience').value || '';
      var timeline = document.getElementById('leadTimeline').value || '';

      if (!name || !email) {
        errorDiv.textContent = 'Заполните имя и email';
        errorDiv.style.display = 'block';
        return;
      }

      errorDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      var csrfToken = '';
      var csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta) {
        csrfToken = csrfMeta.content;
      } else {
        var csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) csrfToken = csrfInput.value;
      }
      if (!csrfToken) {
        var match = document.cookie.match(/csrftoken=([^;]+)/);
        if (match) csrfToken = match[1];
      }

      fetch('/leads/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: parseInt(entityId, 10),
          lead_type: leadType,
          name: name,
          email: email,
          phone: phone,
          messenger: messenger,
          budget_range: budgetRange,
          message: message,
          target_city: null,
          target_city_text: targetCityText,
          business_experience: businessExperience,
          timeline: timeline,
        }),
      })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';

        if (data.success) {
          formContent.style.display = 'none';
          successContent.style.display = '';
          if (typeof ym === 'function') {
            ym(107142125, 'reachGoal', 'lead_submitted', {
              entity_type: entityType,
              lead_type: leadType,
            });
          }
        } else {
          errorDiv.textContent = data.error || 'Произошла ошибка';
          errorDiv.style.display = 'block';
        }
      })
      .catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';
        errorDiv.textContent = 'Ошибка сети. Попробуйте ещё раз.';
        errorDiv.style.display = 'block';
      });
    });
  }
})();
