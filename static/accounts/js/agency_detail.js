function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

function toggleTextTruncation(sectionId, maxLines) {
  try {
    const container = document.getElementById(sectionId);
    if (!container) return;
    const isTruncated = container.classList.contains(`truncated-${maxLines}-lines`);
    const toggle = container.querySelector('.text-truncate-toggle');
    if (isTruncated) {
      container.classList.remove(`truncated-${maxLines}-lines`);
      if (toggle) toggle.textContent = 'Скрыть';
    } else {
      container.classList.add(`truncated-${maxLines}-lines`);
      if (toggle) toggle.textContent = 'Показать полностью';
    }
  } catch (e) {}
}

window.toggleTextTruncation = toggleTextTruncation;

document.addEventListener('DOMContentLoaded', function () {
  const root = document.querySelector('.franchise-detail-page')
  if (!root) return
  const franchiseId = root.dataset.franchiseId
  const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]')
  const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken')

  function updateRatingDisplay(rating) {
    const ratingContainers = document.querySelectorAll('.rating-stars .rating-icon-container');
    ratingContainers.forEach((container, index) => {
      const value = index + 1;
      const emptyIcon = container.querySelector('.icon-empty');
      const filledIcon = container.querySelector('.icon-filled');
      if (value <= Math.floor(rating)) {
        if (emptyIcon) { emptyIcon.style.display = 'none'; emptyIcon.style.opacity = '0'; }
        if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'none'; }
      } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
        const partialValue = rating % 1;
        if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
        if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = `inset(0 ${100 - (partialValue * 100)}% 0 0)`; }
      } else {
        if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
        if (filledIcon) { filledIcon.style.display = 'none'; filledIcon.style.opacity = '0'; filledIcon.style.clipPath = 'none'; }
      }
    });
  }

  function submitRating(rating) {
    if (!csrfToken) {
      alert('Ошибка безопасности. Перезагрузите страницу.');
      return;
    }
    fetch(`/vote-agency/${franchiseId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `rating=${rating}`
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const ratingStars = document.querySelector('.rating-stars');
          if (ratingStars) {
            ratingStars.dataset.rating = rating;
            updateRatingDisplay(rating);
            ratingStars.removeAttribute('data-interactive');
          }
          const averageRatingElement = document.querySelector('.rating-label');
          if (averageRatingElement && data.average_rating !== undefined) {
            averageRatingElement.textContent = `Рейтинг ${Number(data.average_rating).toFixed(1)}/5`;
          }
          alert('Спасибо за оценку!')
        } else {
          alert(data.error || 'Ошибка при отправке оценки.')
        }
      })
      .catch(() => alert('Произошла ошибка при отправке оценки.'))
  }

  function setupRatingStars() {
    let ratingStars = document.querySelector('.rating-stars[data-interactive="true"]');
    if (!ratingStars) return
    const ratingContainers = ratingStars.querySelectorAll('.rating-icon-container');
    const currentRating = parseFloat((ratingStars.dataset.rating || '0').replace(',', '.')) || 0;
    updateRatingDisplay(currentRating)
    ratingContainers.forEach((container, index) => {
      const value = index + 1;
      container.addEventListener('mouseenter', () => updateRatingDisplay(value));
      container.addEventListener('mouseleave', () => updateRatingDisplay(currentRating));
      container.addEventListener('click', () => submitRating(value));
    });
  }

  function setupCommentRatings() {
    const commentRatings = document.querySelectorAll('.comment-rating');
    commentRatings.forEach((ratingContainer) => {
      const rating = parseFloat(ratingContainer.dataset.rating) || 0;
      const ratingIcons = ratingContainer.querySelectorAll('.rating-icon-container');
      ratingIcons.forEach((iconContainer, iconIndex) => {
        const value = iconIndex + 1;
        const emptyIcon = iconContainer.querySelector('.icon-empty');
        const filledIcon = iconContainer.querySelector('.icon-filled');
        if (value <= Math.floor(rating)) {
          if (emptyIcon) { emptyIcon.style.display = 'none'; emptyIcon.style.opacity = '0'; }
          if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'none'; }
        } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
          const partialValue = rating % 1;
          if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
          if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = `inset(0 ${100 - (partialValue * 100)}% 0 0)`; }
        } else {
          if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
          if (filledIcon) { filledIcon.style.display = 'none'; filledIcon.style.opacity = '0'; filledIcon.style.clipPath = 'none'; }
        }
      });
    });
  }

  function setupCommentRatingInput() {
    const commentForm = document.querySelector('.comment-form');
    if (!commentForm) return;
    const textarea = commentForm.querySelector('.comment-textarea');
    if (!textarea) return;
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'comment-rating-input';
    ratingContainer.innerHTML = `
      <div class="rating-input-label">Оцените агентство:</div>
      <div class="rating-input-stars" data-rating="0">
        ${[1,2,3,4,5].map(v => `
          <span class=\"rating-icon-container rating-input-icon\" data-value=\"${v}\">
            <img src=\"/static/accounts/images/planets/full_filled_planet.svg\" alt=\"\" class=\"icon-empty\">
            <img src=\"/static/accounts/images/planets/full_filled_planet.svg\" alt=\"\" class=\"icon-filled\">
          </span>`).join('')}
      </div>
      <input type="hidden" name="user_rating" value="0" class="rating-input-hidden">
    `;
    commentForm.insertBefore(ratingContainer, textarea);
    const ratingStars = ratingContainer.querySelector('.rating-input-stars');
    const ratingIcons = ratingStars.querySelectorAll('.rating-input-icon');
    const hiddenInput = ratingContainer.querySelector('.rating-input-hidden');
    function updateCommentRatingDisplay(icons, rating) {
      icons.forEach((icon, index) => {
        const value = index + 1;
        const emptyIcon = icon.querySelector('.icon-empty');
        const filledIcon = icon.querySelector('.icon-filled');
        if (value <= rating) {
          if (emptyIcon) { emptyIcon.style.display = 'none'; emptyIcon.style.opacity = '0'; }
          if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'none'; }
        } else {
          if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
          if (filledIcon) { filledIcon.style.display = 'none'; filledIcon.style.opacity = '0'; filledIcon.style.clipPath = 'none'; }
        }
      });
    }
    ratingIcons.forEach((icon, index) => {
      const value = index + 1;
      icon.addEventListener('click', function() {
        const current = parseInt(ratingStars.dataset.rating);
        const newRating = current === value ? 0 : value;
        ratingStars.dataset.rating = newRating;
        hiddenInput.value = newRating;
        updateCommentRatingDisplay(ratingIcons, newRating);
      });
      icon.addEventListener('mouseenter', function() { updateCommentRatingDisplay(ratingIcons, value) });
      icon.addEventListener('mouseleave', function() {
        const current = parseInt(ratingStars.dataset.rating);
        updateCommentRatingDisplay(ratingIcons, current);
      });
    });
  }

  setupRatingStars();
  setupCommentRatings();
  setupCommentRatingInput();
});


