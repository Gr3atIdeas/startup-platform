(function() {
  'use strict';

  var modal = document.getElementById('leadModal');
  if (!modal) return;

  var form = document.getElementById('leadForm');
  var errorDiv = document.getElementById('leadFormError');
  var formContent = document.getElementById('leadFormContent');
  var successContent = document.getElementById('leadSuccessContent');
  var submitBtn = document.getElementById('leadSubmitBtn');

  // Open modal
  window.openLeadModal = function() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset form state
    if (form) form.reset();
    // Re-fill autofill fields (they get cleared on reset)
    var nameInput = document.getElementById('leadName');
    var emailInput = document.getElementById('leadEmail');
    if (nameInput && nameInput.defaultValue) nameInput.value = nameInput.defaultValue;
    if (emailInput && emailInput.defaultValue) emailInput.value = emailInput.defaultValue;

    formContent.style.display = '';
    successContent.style.display = 'none';
    errorDiv.style.display = 'none';
  };

  // Close modal
  window.closeLeadModal = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  // Close on overlay click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeLeadModal();
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeLeadModal();
    }
  });

  // Submit form
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var entityType = modal.dataset.entityType;
      var entityId = modal.dataset.entityId;
      var leadType = modal.dataset.leadType;

      var name = (document.getElementById('leadName').value || '').trim();
      var email = (document.getElementById('leadEmail').value || '').trim();
      var phone = (document.getElementById('leadPhone').value || '').trim();
      var budgetRange = document.getElementById('leadBudget').value || '';
      var message = (document.getElementById('leadMessage').value || '').trim();
      var targetCityEl = document.getElementById('leadCity');
      var targetCity = targetCityEl ? targetCityEl.value : '';
      var experienceEl = document.getElementById('leadExperience');
      var businessExperience = experienceEl ? experienceEl.value : '';
      var timelineEl = document.getElementById('leadTimeline');
      var timeline = timelineEl ? timelineEl.value : '';

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
      // Fallback: read from cookie
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
          budget_range: budgetRange,
          message: message,
          target_city: targetCity || null,
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
          // Track in Yandex.Metrika
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
