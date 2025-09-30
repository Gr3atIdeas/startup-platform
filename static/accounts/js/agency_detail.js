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
    if (!container) {
      console.warn(`Container with id '${sectionId}' not found`);
      return;
    }

    const isTruncated = container.classList.contains(`truncated-${maxLines}-lines`);
    const toggle = container.querySelector('.text-truncate-toggle');

    if (isTruncated) {
      container.classList.remove(`truncated-${maxLines}-lines`);
      if (toggle) toggle.textContent = 'Скрыть';
    } else {
      container.classList.add(`truncated-${maxLines}-lines`);
      if (toggle) toggle.textContent = 'Показать полностью';
    }
  } catch (error) {
    console.error('Error in toggleTextTruncation:', error);
  }
}

window.toggleTextTruncation = toggleTextTruncation;

document.addEventListener('DOMContentLoaded', function () {
  const pageDataElement = document.querySelector('.agency-detail-page')
  if (!pageDataElement) {
    console.error('Не удалось найти основной элемент .agency-detail-page')
    return
  }
  const agencyId = pageDataElement.dataset.agencyId
  const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]')
  const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken')

  console.log('CSRF Token found:', !!csrfToken);
  console.log('Agency ID found:', agencyId);

  if (!agencyId) {
    console.error('Agency ID не найден в data-атрибутах.')
          return
  }

  function debounce(func, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }

  function setupUserSearch(modalId, searchInputId, resultsId, onSelect) {
    const searchModalElement = document.getElementById(modalId)
    if (!searchModalElement) {
      console.error(`Modal element with id '${modalId}' not found`);
      return;
    }
    const searchInput = document.getElementById(searchInputId)
    const searchResults = document.getElementById(resultsId)

    if (!searchInput) {
      console.error(`Search input with id '${searchInputId}' not found`);
      return;
    }

    if (!searchResults) {
      console.error(`Search results with id '${resultsId}' not found`);
      return;
    }

    const debouncedSearch = debounce(function (query) {
      if (query.length < 2) {
        searchResults.innerHTML = ''
        return
      }

      console.log('Searching for:', query);

      fetch(`/search-suggestions/?q=${encodeURIComponent(query)}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrfToken
        },
      })
      .then(response => {
        console.log('Search response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Search results:', data);
        searchResults.innerHTML = ''
        if (!data.suggestions || data.suggestions.length === 0) {
          searchResults.innerHTML = '<li class="list-group-item">Пользователи не найдены</li>'
          return
        }
        data.suggestions.forEach(user => {
          const li = document.createElement('li')
          li.classList.add('list-group-item')
          li.style.cursor = 'pointer';
          li.textContent = user.name
          li.dataset.userId = user.id
          li.addEventListener('click', () => {
            console.log('User selected:', user);
            onSelect(user);
            if (modalId === 'changeOwnerModal') {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const currentModal = bootstrap.Modal.getInstance(searchModalElement);
                if (currentModal) {
                    currentModal.hide();
                    }
                } else {
                    console.error('Bootstrap Modal not available for hiding modal');
                }
            }
          });
          searchResults.appendChild(li)
        })
      })
      .catch(error => {
        console.error('Ошибка поиска:', error)
        searchResults.innerHTML = '<li class="list-group-item">Ошибка поиска</li>'
      })
    }, 300)

    searchInput.addEventListener('input', function () {
      debouncedSearch(this.value.trim())
    })

    if (searchModalElement) {
    searchModalElement.addEventListener('hidden.bs.modal', function () {
          if (searchInput) searchInput.value = '';
          if (searchResults) searchResults.innerHTML = '';
    });
    }
  }

  console.log('Setting up change owner search...');
  setupUserSearch('changeOwnerModal', 'userSearchInput', 'userSearchResults', (user) => {
    console.log('Setting up change owner for user:', user);
    const confirmModalEl = document.getElementById('confirmChangeOwnerModal')
    if (!confirmModalEl) {
      console.error('Confirm modal element not found');
      return;
    }
    const newOwnerNameEl = document.getElementById('newOwnerName');
    const newOwnerIdEl = document.getElementById('newOwnerId');

    console.log('newOwnerName element found:', !!newOwnerNameEl);
    console.log('newOwnerId element found:', !!newOwnerIdEl);

    if (!newOwnerNameEl || !newOwnerIdEl) {
      console.error('Required elements for change owner not found');
      alert('Ошибка: элементы формы не найдены');
      return;
    }

    newOwnerNameEl.textContent = user.name;
    newOwnerIdEl.value = user.id;
    console.log('Set new owner name:', user.name, 'id:', user.id);
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const confirmModal = new bootstrap.Modal(confirmModalEl);
    confirmModal.show();
    } else {
      console.error('Bootstrap Modal not available');
      alert('Ошибка: Bootstrap не загружен');
    }
  });

  const confirmChangeOwnerBtn = document.querySelector('.confirm-change-owner')
  console.log('Confirm change owner button found:', !!confirmChangeOwnerBtn);
  if (confirmChangeOwnerBtn) {
    confirmChangeOwnerBtn.addEventListener('click', function () {
      console.log('Confirm change owner button clicked');
      const newOwnerIdEl = document.getElementById('newOwnerId');
      if (!newOwnerIdEl) {
        console.error('newOwnerId element not found');
        alert('Ошибка: элемент формы не найден');
        return;
      }
      const newOwnerId = newOwnerIdEl.value;

      if (!newOwnerId) {
        alert('Не выбран новый владелец.');
        return;
      }

      if (!csrfToken) {
        alert('Ошибка безопасности. Попробуйте перезагрузить страницу.');
        return;
      }

      console.log('Sending change owner request for agency:', agencyId, 'new owner:', newOwnerId);

              fetch(`/change_owner_agency/${agencyId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
        },
        body: `new_owner_id=${newOwnerId}`,
      })
      .then(async response => {
        console.log('Change owner response status:', response.status);
        let data = null;
        try {
          data = await response.json();
          console.log('Change owner response data:', data);
        } catch (e) {
          console.error('Error parsing JSON response:', e);
        }

        if (response.ok && data && data.success) {
          alert('Владелец успешно изменён!');
          location.reload();
        } else {
          const errMsg = (data && data.error) || 'Ошибка при смене владельца.';
          alert(errMsg);
        }
      })
      .catch(error => {
        console.error('Ошибка при смене владельца:', error);
        alert('Сетевая ошибка при смене владельца.');
      });
    })
  } else {
    console.error('Confirm change owner button not found');
  }

  function setupRatingStars() {
    console.log('Setting up rating stars...');
    let ratingStars = document.querySelector('.rating-stars[data-interactive="true"]');
    if (!ratingStars) {
      console.log('Rating stars not found or not interactive');
      const allRatingStars = document.querySelectorAll('.rating-stars');
      console.log('All rating stars found:', allRatingStars.length);
      if (allRatingStars.length > 0) {
        ratingStars = allRatingStars[0];
        console.log('Using first rating stars element');
      } else {
        return;
      }
    }

    const ratingContainers = ratingStars.querySelectorAll('.rating-icon-container');
    const currentRatingStr = ratingStars.dataset.rating || '0';
    const currentRating = parseFloat(currentRatingStr.replace(',', '.')) || 0;

    console.log('Found rating stars:', ratingStars);
    console.log('Rating containers count:', ratingContainers.length);
    console.log('Current rating:', currentRating);
    console.log('Rating stars data attributes:', {
      rating: ratingStars.dataset.rating,
      interactive: ratingStars.dataset.interactive
    });

    ratingContainers.forEach((container, index) => {
      const emptyIcon = container.querySelector('.icon-empty');
      const filledIcon = container.querySelector('.icon-filled');

      if (emptyIcon) {
        emptyIcon.style.display = 'block';
        emptyIcon.style.opacity = '1';
      }
      if (filledIcon) {
        filledIcon.style.display = 'none';
        filledIcon.style.opacity = '0';
      }

      console.log(`Container ${index + 1} initial state:`, {
        emptyDisplay: emptyIcon ? emptyIcon.style.display : 'no element',
        filledDisplay: filledIcon ? filledIcon.style.display : 'no element'
      });
    });

    updateRatingDisplay(currentRating);

    if (ratingStars.dataset.interactive === 'true') {
      ratingContainers.forEach((container, index) => {
        const value = index + 1;

        container.addEventListener('mouseenter', () => {
          console.log('Mouse enter on rating container:', value);
          updateRatingDisplay(value);
        });

        container.addEventListener('mouseleave', () => {
          console.log('Mouse leave on rating container');
          updateRatingDisplay(currentRating);
        });

        container.addEventListener('click', () => {
          console.log('Click on rating container:', value);
          submitRating(value);
        });
      });
    }
  }

  function updateRatingDisplay(rating) {
    console.log('Updating rating display to:', rating);
    const ratingContainers = document.querySelectorAll('.rating-stars .rating-icon-container');

    ratingContainers.forEach((container, index) => {
      const value = index + 1;
      const emptyIcon = container.querySelector('.icon-empty');
      const filledIcon = container.querySelector('.icon-filled');

      console.log(`Container ${value}: empty=${!!emptyIcon}, filled=${!!filledIcon}`);

      if (value <= Math.floor(rating)) {
        if (emptyIcon) {
          emptyIcon.style.display = 'none';
          emptyIcon.style.opacity = '0';
        }
        if (filledIcon) {
          filledIcon.style.display = 'block';
          filledIcon.style.opacity = '1';
          filledIcon.style.clipPath = 'none';
        }
      } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
        const partialValue = rating % 1;
        if (emptyIcon) {
          emptyIcon.style.display = 'block';
          emptyIcon.style.opacity = '1';
        }
        if (filledIcon) {
          filledIcon.style.display = 'block';
          filledIcon.style.opacity = '1';
          filledIcon.style.clipPath = `inset(0 ${100 - (partialValue * 100)}% 0 0)`;
        }
      } else {
        if (emptyIcon) {
          emptyIcon.style.display = 'block';
          emptyIcon.style.opacity = '1';
        }
        if (filledIcon) {
          filledIcon.style.display = 'none';
          filledIcon.style.opacity = '0';
          filledIcon.style.clipPath = 'none';
        }
      }
    });
  }

  function submitRating(rating) {
    console.log('Submitting rating:', rating);

    if (!csrfToken) {
      alert('Ошибка безопасности. Попробуйте перезагрузить страницу.');
      return;
    }

    fetch(`/vote-agency/${agencyId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `rating=${rating}`
    })
    .then(response => {
      console.log('Rating submission response status:', response.status);
      if (!response.ok) {
        return response.text().then(text => {
          console.error('Rating submission error response:', text);
          throw new Error(text);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Rating submission response data:', data);
      if (data.success) {
        const ratingStars = document.querySelector('.rating-stars');
        if (ratingStars) {
          ratingStars.dataset.rating = rating;
          updateRatingDisplay(rating);
        }

        const averageRatingElement = document.querySelector('.rating-label');
        if (averageRatingElement && data.average_rating) {
          averageRatingElement.textContent = `Рейтинг ${data.average_rating.toFixed(1)}/5`;
        }

        ratingStars.removeAttribute('data-interactive');
        ratingStars.querySelectorAll('.rating-icon-container').forEach(container => {
          container.removeEventListener('mouseenter', () => {});
          container.removeEventListener('mouseleave', () => {});
          container.removeEventListener('click', () => {});
        });

        alert('Спасибо за оценку!');
      } else {
        alert(data.error || 'Ошибка при отправке оценки.');
      }
    })
    .catch(error => {
      console.error('Ошибка при отправке оценки:', error);
      alert('Произошла ошибка при отправке оценки.');
    });
  }

  function setupCommentRatings() {
    console.log('Setting up comment ratings...');
    const commentRatings = document.querySelectorAll('.comment-rating');

    commentRatings.forEach((ratingContainer, index) => {
      const rating = parseFloat(ratingContainer.dataset.rating) || 0;
      const ratingIcons = ratingContainer.querySelectorAll('.rating-icon-container');

      console.log(`Comment ${index + 1} rating:`, rating);

      ratingIcons.forEach((iconContainer, iconIndex) => {
        const value = iconIndex + 1;
        const emptyIcon = iconContainer.querySelector('.icon-empty');
        const filledIcon = iconContainer.querySelector('.icon-filled');

        if (value <= Math.floor(rating)) {
          if (emptyIcon) {
            emptyIcon.style.display = 'none';
            emptyIcon.style.opacity = '0';
          }
          if (filledIcon) {
            filledIcon.style.display = 'block';
            filledIcon.style.opacity = '1';
            filledIcon.style.clipPath = 'none';
          }
        } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
          const partialValue = rating % 1;
          if (emptyIcon) {
            emptyIcon.style.display = 'block';
            emptyIcon.style.opacity = '1';
          }
          if (filledIcon) {
            filledIcon.style.display = 'block';
            filledIcon.style.opacity = '1';
            filledIcon.style.clipPath = `inset(0 ${100 - (partialValue * 100)}% 0 0)`;
          }
        } else {
          if (emptyIcon) {
            emptyIcon.style.display = 'block';
            emptyIcon.style.opacity = '1';
          }
          if (filledIcon) {
            filledIcon.style.display = 'none';
            filledIcon.style.opacity = '0';
            filledIcon.style.clipPath = 'none';
          }
        }
      });
    });
  }

  function setupOverallRating() {
    console.log('Setting up overall rating...');
    const overallRating = document.querySelector('.overall-rating-stars');

    if (overallRating) {
      const rating = parseFloat(overallRating.dataset.rating) || 0;
      const ratingIcons = overallRating.querySelectorAll('.rating-icon-container');

      console.log('Overall rating:', rating);
      console.log('Rating icons found:', ratingIcons.length);

      ratingIcons.forEach((iconContainer, iconIndex) => {
        const value = iconIndex + 1;
        const emptyIcon = iconContainer.querySelector('.icon-empty');
        const filledIcon = iconContainer.querySelector('.icon-filled');

        console.log(`Icon ${value}: empty=${!!emptyIcon}, filled=${!!filledIcon}`);

        if (value <= Math.floor(rating)) {
          if (emptyIcon) {
            emptyIcon.style.display = 'none';
            emptyIcon.style.opacity = '0';
          }
          if (filledIcon) {
            filledIcon.style.display = 'block';
            filledIcon.style.opacity = '1';
            filledIcon.style.clipPath = 'none';
          }
        } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
          const partialValue = rating % 1;
          console.log(`Partial rating for icon ${value}: ${partialValue}`);
          if (emptyIcon) {
            emptyIcon.style.display = 'block';
            emptyIcon.style.opacity = '1';
          }
          if (filledIcon) {
            filledIcon.style.display = 'block';
            filledIcon.style.opacity = '1';
            filledIcon.style.clipPath = `inset(0 ${100 - (partialValue * 100)}% 0 0)`;
          }
        } else {
          if (emptyIcon) {
            emptyIcon.style.display = 'block';
            emptyIcon.style.opacity = '1';
          }
          if (filledIcon) {
            filledIcon.style.display = 'none';
            filledIcon.style.opacity = '0';
            filledIcon.style.clipPath = 'none';
          }
        }
      });
    } else {
      console.log('Overall rating element not found');
    }
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

        if (introText.scrollHeight <= maxHeight) {
          introToggle.style.display = 'none';
          introSection.classList.remove('truncated-3-lines');
        } else {
          introSection.classList.add('truncated-3-lines');
          introToggle.style.display = 'inline-block';
        }
      }
    }

    if (aboutSection) {
      const aboutText = aboutSection.querySelector('.text-content');
      const aboutToggle = aboutSection.querySelector('.text-truncate-toggle');

      if (aboutText && aboutToggle) {
        const lineHeight = parseInt(window.getComputedStyle(aboutText).lineHeight);
        const maxHeight = lineHeight * 5;

        if (aboutText.scrollHeight <= maxHeight) {
          aboutToggle.style.display = 'none';
          aboutSection.classList.remove('truncated-5-lines');
        } else {
          aboutSection.classList.add('truncated-5-lines');
          aboutToggle.style.display = 'inline-block';
        }
      }
    }
  }

  setupRatingStars();

  setupCommentRatings();

  setupOverallRating();

  setupSimilarAgenciesRatings();

  setupSimilarAgenciesShowMore();

  setupCommentsShowMore();

  setupCommentRatingInput();

  setupTextTruncation();
  setupModeratorDelete();

  function setupSimilarAgenciesRatings() {
    console.log('Setting up similar agencies ratings...');
    const similarRatings = document.querySelectorAll('.similar-card-rating');

    similarRatings.forEach((ratingContainer, index) => {
      const rating = parseFloat(ratingContainer.dataset.rating) || 0;
      const ratingIcons = ratingContainer.querySelectorAll('.rating-icon-container');

      console.log(`Similar agency ${index + 1} rating:`, rating);

      ratingIcons.forEach((iconContainer, iconIndex) => {
        const value = iconIndex + 1;
        const emptyIcon = iconContainer.querySelector('.icon-empty');
        const filledIcon = iconContainer.querySelector('.icon-filled');

        if (value <= Math.floor(rating)) {
          if (emptyIcon) {
            emptyIcon.style.display = 'none';
            emptyIcon.style.opacity = '0';
          }
          if (filledIcon) {
            filledIcon.style.display = 'block';
            filledIcon.style.opacity = '1';
            filledIcon.style.clipPath = 'none';
          }
        } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
          const partialValue = rating % 1;
          if (emptyIcon) {
            emptyIcon.style.display = 'block';
            emptyIcon.style.opacity = '1';
          }
          if (filledIcon) {
            filledIcon.style.display = 'block';
            filledIcon.style.opacity = '1';
            filledIcon.style.clipPath = `inset(0 ${100 - (partialValue * 100)}% 0 0)`;
          }
        } else {
          if (emptyIcon) {
            emptyIcon.style.display = 'block';
            emptyIcon.style.opacity = '1';
          }
          if (filledIcon) {
            filledIcon.style.display = 'none';
            filledIcon.style.opacity = '0';
            filledIcon.style.clipPath = 'none';
          }
        }
      });
    });
  }

  function setupSimilarAgenciesShowMore() {
    console.log('Setting up similar agencies show more button...');
    const showMoreButton = document.querySelector('.show-more-similar');

    if (showMoreButton) {
      console.log('Show more button found');
      showMoreButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Show more button clicked');

        const agencyId = document.querySelector('.agency-detail-page').dataset.agencyId;
        const loadSimilarUrl = document.querySelector('.agency-detail-page').dataset.loadSimilarUrl;

        if (!loadSimilarUrl) {
          console.error('Load similar URL not found');
          return;
        }

        showMoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
        showMoreButton.disabled = true;

        fetch(loadSimilarUrl)
          .then(response => {
            if (!response.ok) {
              return response.text().then(text => { throw new Error(text) });
            }
            return response.text();
          })
          .then(html => {
            const similarGrid = document.querySelector('.similar-agencies-grid');
            if (!similarGrid) return;
            if (!html || html.trim() === '') {
              similarGrid.innerHTML = '<p style="margin-top:10px;color:#fff;opacity:.8;">Похожих агентств пока нет.</p>';
              return;
            }
            const placeholder = document.createElement('div');
            placeholder.className = 'similar-card show-more-placeholder';
            placeholder.innerHTML = '<button class="action-button show-more-similar" style="display: inline-flex !important; align-items: center; gap: 8px; padding: 10px 20px; height: auto; border: 1px solid var(--text-primary) !important; border-radius: 25px !important; background: transparent !important; color: var(--text-primary) !important; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease; width: auto; text-decoration: none !important;"><i class="fas fa-redo"></i> Показать еще</button>';
            similarGrid.innerHTML = html;
            similarGrid.appendChild(placeholder);
            setupSimilarAgenciesRatings();
            setupSimilarAgenciesShowMore();
          })
          .catch(error => {
            console.error('Error loading similar agencies:', error);
            showMoreButton.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
            showMoreButton.disabled = false;
          });
      });
    } else {
      console.log('Show more button not found');
    }
  }

  function setupCommentsShowMore() {
    const showMoreButton = document.querySelector('.show-more-comments');
    const hideButton = document.querySelector('.hide-comments-button');
    const hiddenComments = document.querySelectorAll('.comment-card.hidden');

    if (showMoreButton && hiddenComments.length > 0) {
      showMoreButton.addEventListener('click', function() {
        hiddenComments.forEach(comment => {
          comment.classList.remove('hidden');
        });
        showMoreButton.style.display = 'none';
        if (hideButton) {
          hideButton.style.display = 'inline-flex';
        }
      });
    }

    if (hideButton) {
      hideButton.addEventListener('click', function() {
        const allComments = document.querySelectorAll('.comment-card');
        allComments.forEach((comment, index) => {
          if (index >= 5) {
            comment.classList.add('hidden');
          }
        });
        hideButton.style.display = 'none';
        if (showMoreButton) {
          showMoreButton.style.display = 'inline-flex';
        }
      });
    }
  }

  function setupModeratorDelete() {
    const container = document.querySelector('.comments-list');
    if (!container) return;
    container.addEventListener('click', function (e) {
      const btn = e.target.closest('.comment-delete-btn');
      if (!btn) return;
      const card = btn.closest('.comment-card');
      if (!card) return;
      const commentId = card.getAttribute('data-comment-id');
      if (!commentId) return;
      if (!csrfToken) { alert('Ошибка безопасности. Перезагрузите страницу.'); return; }
      fetch(`/delete-comment/agency/${commentId}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' }
      }).then(r => r.json()).then(data => {
        if (data && data.success) {
          card.remove();
        } else {
          alert((data && data.error) || 'Не удалось удалить комментарий');
        }
      }).catch(() => alert('Сетевая ошибка при удалении'));
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
        <span class="rating-icon-container rating-input-icon" data-value="1">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-empty">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-filled">
        </span>
        <span class="rating-icon-container rating-input-icon" data-value="2">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-empty">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-filled">
        </span>
        <span class="rating-icon-container rating-input-icon" data-value="3">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-empty">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-filled">
        </span>
        <span class="rating-icon-container rating-input-icon" data-value="4">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-empty">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-filled">
        </span>
        <span class="rating-icon-container rating-input-icon" data-value="5">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-empty">
          <img src="/static/accounts/images/planets/full_filled_planet.svg" alt="" class="icon-filled">
        </span>
      </div>
      <input type="hidden" name="user_rating" value="0" class="rating-input-hidden">
    `;

    commentForm.insertBefore(ratingContainer, textarea);

    const ratingStars = ratingContainer.querySelector('.rating-input-stars');
    const ratingIcons = ratingStars.querySelectorAll('.rating-input-icon');
    const hiddenInput = ratingContainer.querySelector('.rating-input-hidden');

    ratingIcons.forEach((icon, index) => {
      const value = index + 1;

      icon.addEventListener('click', function() {
        const currentRating = parseInt(ratingStars.dataset.rating);
        const newRating = currentRating === value ? 0 : value;

        ratingStars.dataset.rating = newRating;
        hiddenInput.value = newRating;

        updateCommentRatingDisplay(ratingIcons, newRating);
      });

      icon.addEventListener('mouseenter', function() {
        updateCommentRatingDisplay(ratingIcons, value);
      });

      icon.addEventListener('mouseleave', function() {
        const currentRating = parseInt(ratingStars.dataset.rating);
        updateCommentRatingDisplay(ratingIcons, currentRating);
      });
    });
  }

  function updateCommentRatingDisplay(icons, rating) {
    icons.forEach((icon, index) => {
      const value = index + 1;
      const emptyIcon = icon.querySelector('.icon-empty');
      const filledIcon = icon.querySelector('.icon-filled');

      if (value <= rating) {
        if (emptyIcon) {
          emptyIcon.style.display = 'none';
          emptyIcon.style.opacity = '0';
        }
        if (filledIcon) {
          filledIcon.style.display = 'block';
          filledIcon.style.opacity = '1';
          filledIcon.style.clipPath = 'none';
        }
      } else {
        if (emptyIcon) {
          emptyIcon.style.display = 'block';
          emptyIcon.style.opacity = '1';
        }
        if (filledIcon) {
          filledIcon.style.display = 'none';
          filledIcon.style.opacity = '0';
          filledIcon.style.clipPath = 'none';
        }
      }
    });
  }

  function setupTabNavigation() {
    console.log('Setting up tab navigation...');
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentSections = document.querySelectorAll('.content-section');

    console.log('Found tab buttons:', tabButtons.length);
    console.log('Found content sections:', contentSections.length);

    tabButtons.forEach((button, index) => {
      const targetId = button.dataset.target;
      console.log(`Tab button ${index}:`, button.textContent.trim(), 'target:', targetId);
    });

    contentSections.forEach((section, index) => {
      console.log(`Content section ${index}:`, section.id);
    });

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.target;
        console.log('Tab button clicked, target:', targetId);
        console.log('Button element:', button);
        console.log('Button text:', button.textContent.trim());

        tabButtons.forEach(btn => btn.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));

        button.classList.add('active');
        const targetSection = document.getElementById(targetId);
        console.log('Target section found:', !!targetSection);
        if (targetSection) {
          targetSection.classList.add('active');
          console.log('Activated section:', targetId);
          console.log('Section classes after activation:', targetSection.className);
        } else {
          console.error('Target section not found:', targetId);
          const partialMatch = Array.from(contentSections).find(section =>
            section.id.includes(targetId.replace('-section', '')) ||
            targetId.includes(section.id.replace('-section', ''))
          );
          if (partialMatch) {
            partialMatch.classList.add('active');
            console.log('Found partial match, activated section:', partialMatch.id);
          }
        }
      });
    });
  }

  setupTabNavigation();

  function setupActionButtons() {
    console.log('Setting up action buttons...');

    const chatButton = document.querySelector('.chat-button');
    console.log('Chat button found:', !!chatButton);
    if (chatButton) {
      console.log('Chat button text:', chatButton.textContent.trim());
      console.log('Chat button classes:', chatButton.className);
      chatButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Chat button clicked');

        const ownerId = document.querySelector('.agency-detail-page').dataset.ownerId;
        if (!ownerId) {
          alert('Ошибка: не удалось определить автора агентства');
          return;
        }

        window.location.href = `/cosmochat/`;
      });
    } else {
      console.error('Chat button not found');
    }

    const writeButton = document.querySelector('.write-author-button');
    console.log('Write button found:', !!writeButton);
    if (writeButton) {
      console.log('Write button text:', writeButton.textContent.trim());
      console.log('Write button classes:', writeButton.className);
      writeButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Write button clicked');

        const ownerId = document.querySelector('.agency-detail-page').dataset.ownerId;
        if (!ownerId) {
          alert('Ошибка: не удалось определить автора агентства');
          return;
        }

        startChatWithUser(ownerId);
      });
    } else {
      console.error('Write button not found');
    }

    const allButtons = document.querySelectorAll('button');
    console.log('Total buttons found on page:', allButtons.length);
    allButtons.forEach((btn, index) => {
      if (btn.textContent.includes('Чат') || btn.textContent.includes('Написать')) {
        console.log(`Button ${index}:`, btn.textContent.trim(), 'classes:', btn.className);
      }
    });
  }

  setupActionButtons();

  function startChatWithUser(userId) {
    fetch(`/cosmochat/start-chat/${userId}/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
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
});