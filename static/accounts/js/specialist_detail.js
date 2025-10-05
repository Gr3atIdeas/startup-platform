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
    fetch(`/vote-specialist/${franchiseId}/`, {
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
    if (!ratingStars) {
      const allRatingStars = document.querySelectorAll('.rating-stars');
      if (allRatingStars.length === 0) return;
      ratingStars = allRatingStars[0];
    }
    const ratingContainers = ratingStars.querySelectorAll('.rating-icon-container');
    const currentRating = parseFloat((ratingStars.dataset.rating || '0').replace(',', '.')) || 0;
    updateRatingDisplay(currentRating)
    ratingContainers.forEach((container, index) => {
      const value = index + 1;
      container.addEventListener('mouseenter', () => updateRatingDisplay(value));
      container.addEventListener('mouseleave', () => updateRatingDisplay(currentRating));
      if (ratingStars.dataset.interactive === 'true') {
        container.addEventListener('click', () => submitRating(value));
      }
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

  function setupOverallRating() {
    const overall = document.querySelector('.overall-rating-stars');
    if (!overall) return;
    const rating = parseFloat((overall.dataset.rating || '0').replace(',', '.')) || 0;
    const ratingIcons = overall.querySelectorAll('.rating-icon-container');
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
  }

  function setupSimilarAgencyRatings() {
    const similarRatings = document.querySelectorAll('.similar-card-rating');
    similarRatings.forEach((ratingContainer) => {
      const rating = parseFloat((ratingContainer.dataset.rating || '0').replace(',', '.')) || 0;
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

function setupSimilarSpecialistsShowMore() {
  const showMoreButton = document.querySelector('.show-more-similar');
  if (!showMoreButton) return;
  showMoreButton.addEventListener('click', (e) => {
    e.preventDefault();
    const root = document.querySelector('.franchise-detail-page');
    if (!root) return;
    const url = root.dataset.loadSimilarUrl;
    if (!url) return;
    showMoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
    showMoreButton.disabled = true;
    fetch(url)
      .then(r => r.text())
      .then(html => {
        const grid = document.querySelector('.similar-franchises-grid');
        if (!grid) return;
        if (!html || html.trim() === '') {
          grid.innerHTML = '<p style="margin-top:10px;color:#fff;opacity:.8;">Похожих специалистов пока нет.</p>';
          return;
        }
        const placeholder = document.createElement('div');
        placeholder.className = 'similar-card show-more-placeholder';
            placeholder.innerHTML = '<button class="action-button show-more-similar" style="display: inline-flex !important; align-items: center; gap: 8px; padding: 10px 20px; height: auto; border: 1px solid var(--text-primary) !important; border-radius: 25px !important; background: transparent !important; color: var(--text-primary) !important; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease; width: auto; text-decoration: none !important;"><i class="fas fa-redo"></i> Показать еще</button>';
        grid.innerHTML = html;
        grid.appendChild(placeholder);
        setupSimilarAgencyRatings();
        setupSimilarSpecialistsShowMore();
      })
      .catch(() => {
        showMoreButton.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
        showMoreButton.disabled = false;
      });
  });
}

  function setupTextTruncation() {
    const introSection = document.getElementById('intro-section');
    const aboutSection = document.getElementById('about-section');
    if (introSection) {
      const introText = introSection.querySelector('.text-content');
      const introToggle = introSection.querySelector('.text-truncate-toggle');
      if (introText && introToggle) {
        const lineHeight = parseInt(window.getComputedStyle(introText).lineHeight);
        const maxHeight = lineHeight * 3;
        if (introText.scrollHeight > maxHeight) {
          introSection.classList.add('truncated-3-lines');
          introToggle.style.display = 'inline-block';
        } else {
          introToggle.style.display = 'none';
          introSection.classList.remove('truncated-3-lines');
        }
      }
    }
    if (aboutSection) {
      const aboutText = aboutSection.querySelector('.text-content');
      const aboutToggle = aboutSection.querySelector('.text-truncate-toggle');
      if (aboutText && aboutToggle) {
        const lineHeight = parseInt(window.getComputedStyle(aboutText).lineHeight);
        const maxHeight = lineHeight * 5;
        if (aboutText.scrollHeight > maxHeight) {
          aboutSection.classList.add('truncated-5-lines');
          aboutToggle.style.display = 'inline-block';
        } else {
          aboutToggle.style.display = 'none';
          aboutSection.classList.remove('truncated-5-lines');
        }
      }
    }
  }

  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentSections = document.querySelectorAll('.content-section');
    if (!tabButtons.length || !contentSections.length) return;
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.target;
        tabButtons.forEach(btn => btn.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        button.classList.add('active');
        const target = document.getElementById(targetId);
        if (target) {
          target.classList.add('active');
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

  function setupActionButtons() {
    const chatButton = document.querySelector('.chat-button');
    if (chatButton) {
      chatButton.addEventListener('click', (e) => {
        e.preventDefault();
        const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
        if (!ownerId) {
          alert('Ошибка: не удалось определить автора специалиста');
          return;
        }
        startChatWithUser(ownerId);
      });
    }

    const writeButton = document.querySelector('.write-author-button');
    if (writeButton) {
      writeButton.addEventListener('click', (e) => {
        e.preventDefault();
        const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
        if (!ownerId) {
          alert('Ошибка: не удалось определить автора специалиста');
          return;
        }
        startChatWithUser(ownerId);
      });
    }
  }

  function startChatWithUser(userId) {
    fetch(`/cosmochat/start-chat/${userId}/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Сетевая ошибка: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          const chatId = data.chat_id || (data.chat && data.chat.conversation_id);
          if (chatId) {
            window.location.href = `/cosmochat/?chat_id=${chatId}`;
          } else {
            alert('Ошибка: не удалось получить ID чата');
          }
        } else {
          alert('Ошибка при создании чата: ' + (data.error || 'Неизвестная ошибка'));
        }
      })
      .catch((error) => {
        console.error('Ошибка:', error);
        alert('Ошибка при создании чата: ' + error.message);
      });
  }

  setupRatingStars();
  setupCommentRatings();
  setupCommentRatingInput();
  setupOverallRating();
  setupSimilarAgencyRatings();
  setupTextTruncation();
  setupTabNavigation();
  setupModeratorDelete();
  setupSimilarSpecialistsShowMore();
  setupActionButtons();
  initializeCarousel();
});

// Функции для кнопок чата и написания
function setupActionButtons() {
  console.log('Setting up action buttons...');

  const chatButton = document.querySelector('.carousel-chat-button-unique');
  console.log('Chat button found:', !!chatButton);
  if (chatButton) {
    console.log('Chat button text:', chatButton.textContent.trim());
    console.log('Chat button classes:', chatButton.className);
    chatButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Chat button clicked');

      const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
      if (!ownerId) {
        alert('Ошибка: не удалось определить автора специалиста');
        return;
      }

      startChatWithUser(ownerId);
    });
  } else {
    console.error('Chat button not found');
  }

  const writeButton = document.querySelector('.write-author-button-unique');
  if (writeButton) {
    writeButton.addEventListener('click', (e) => {
      e.preventDefault();
      const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
      if (!ownerId) {
        alert('Ошибка: не удалось определить автора специалиста');
        return;
      }
      startChatWithUser(ownerId);
    });
  }
}

function startChatWithUser(userId) {
  console.log('Starting chat with user:', userId);
  
  fetch(`/cosmochat/start-chat/${userId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = `/cosmochat/?chat_id=${data.chat_id}`;
    } else {
      alert('Ошибка при создании чата: ' + (data.error || 'Неизвестная ошибка'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Ошибка при создании чата');
  });
}

// Вызов функции при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  setupActionButtons();
});function initializeCarousel() {
  const carousel = document.getElementById('mediaCarousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.specialist-detail-carousel-slide');
  const indicators = document.querySelectorAll('.specialist-detail-indicator');
  const prevBtn = document.querySelector('.specialist-detail-carousel-prev');
  const nextBtn = document.querySelector('.specialist-detail-carousel-next');
  
  let currentSlide = 0;
  let autoSlideInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === index);
    });
    
    currentSlide = index;
  }

  function nextSlide() {
    const nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }

  function prevSlide() {
    const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prevIndex);
  }

  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      stopAutoSlide();
      startAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      stopAutoSlide();
      startAutoSlide();
    });
  }

  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
      stopAutoSlide();
      startAutoSlide();
    });
  });

// Функции для кнопок чата и написания
function setupActionButtons() {
  console.log('Setting up action buttons...');

  const chatButton = document.querySelector('.carousel-chat-button-unique');
  console.log('Chat button found:', !!chatButton);
  if (chatButton) {
    console.log('Chat button text:', chatButton.textContent.trim());
    console.log('Chat button classes:', chatButton.className);
    chatButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Chat button clicked');

      const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
      if (!ownerId) {
        alert('Ошибка: не удалось определить автора специалиста');
        return;
      }

      startChatWithUser(ownerId);
    });
  } else {
    console.error('Chat button not found');
  }

  const writeButton = document.querySelector('.write-author-button-unique');
  if (writeButton) {
    writeButton.addEventListener('click', (e) => {
      e.preventDefault();
      const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
      if (!ownerId) {
        alert('Ошибка: не удалось определить автора специалиста');
        return;
      }
      startChatWithUser(ownerId);
    });
  }
}

function startChatWithUser(userId) {
  console.log('Starting chat with user:', userId);
  
  fetch(`/cosmochat/start-chat/${userId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = `/cosmochat/?chat_id=${data.chat_id}`;
    } else {
      alert('Ошибка при создании чата: ' + (data.error || 'Неизвестная ошибка'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Ошибка при создании чата');
  });
}

// Вызов функции при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  setupActionButtons();
});  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);

  if (slides.length > 1) {
    startAutoSlide();
  }
}

function setupModeratorDelete() {
  const container = document.querySelector('.comments-list');
  if (!container) return;
  const csrf = getCookie('csrftoken');
  container.addEventListener('click', function (e) {
    const btn = e.target.closest('.comment-delete-btn');
    if (!btn) return;
    const card = btn.closest('.comment-card');
    if (!card) return;
    const commentId = card.getAttribute('data-comment-id');
    if (!commentId) return;
    if (!csrf) { alert('Ошибка безопасности. Перезагрузите страницу.'); return; }
    fetch(`/delete-comment/specialist/${commentId}/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrf, 'X-Requested-With': 'XMLHttpRequest' }
    }).then(r => r.json()).then(data => {
      if (data && data.success) {
        card.remove();
      } else {
        alert((data && data.error) || 'Не удалось удалить комментарий');
      }
    }).catch(() => alert('Сетевая ошибка при удалении'));
  });
}

// Функции для управления выпадающим меню
function toggleManagementDropdown() {
  const dropdown = document.getElementById('managementDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

function openChangeOwnerModal() {
  const modal = document.getElementById('changeOwnerModal');
  if (modal) {
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }
}

// Закрытие выпадающего меню при клике вне его
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('managementDropdown');
  const button = document.querySelector('.management-top-button');
  
  if (dropdown && button && !button.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.classList.remove('show');
  }
});

// Функции для кнопок чата и написания
function setupActionButtons() {
  console.log('Setting up action buttons...');

  const chatButton = document.querySelector('.carousel-chat-button-unique');
  console.log('Chat button found:', !!chatButton);
  if (chatButton) {
    console.log('Chat button text:', chatButton.textContent.trim());
    console.log('Chat button classes:', chatButton.className);
    chatButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Chat button clicked');

      const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
      if (!ownerId) {
        alert('Ошибка: не удалось определить автора специалиста');
        return;
      }

      startChatWithUser(ownerId);
    });
  } else {
    console.error('Chat button not found');
  }

  const writeButton = document.querySelector('.write-author-button-unique');
  if (writeButton) {
    writeButton.addEventListener('click', (e) => {
      e.preventDefault();
      const ownerId = document.querySelector('.specialist-detail-page').dataset.ownerId;
      if (!ownerId) {
        alert('Ошибка: не удалось определить автора специалиста');
        return;
      }
      startChatWithUser(ownerId);
    });
  }
}

function startChatWithUser(userId) {
  console.log('Starting chat with user:', userId);
  
  fetch(`/cosmochat/start-chat/${userId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = `/cosmochat/?chat_id=${data.chat_id}`;
    } else {
      alert('Ошибка при создании чата: ' + (data.error || 'Неизвестная ошибка'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Ошибка при создании чата');
  });
}

// Вызов функции при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  setupActionButtons();
});
