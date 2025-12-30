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
  }
}

window.toggleTextTruncation = toggleTextTruncation;

function initializeCarousel() {
  const carousel = document.getElementById('mediaCarousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.startup-detail-carousel-slide');
  const indicators = document.querySelectorAll('.startup-detail-indicator');
  const prevBtn = document.querySelector('.startup-detail-carousel-prev');
  const nextBtn = document.querySelector('.startup-detail-carousel-next');
  
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
    clearInterval(autoSlideInterval);
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

  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);

  if (slides.length > 1) {
    startAutoSlide();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const pageDataElement = document.querySelector('.startup-detail-page')
  if (!pageDataElement) {
    return
  }
  const startupId = pageDataElement.dataset.startupId
  const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]')
  const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken')

  initializeCarousel()


  if (!startupId) {
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
      return;
    }
    const searchInput = document.getElementById(searchInputId)
    const searchResults = document.getElementById(resultsId)

    if (!searchInput) {
      return;
    }

    if (!searchResults) {
      return;
    }

    const debouncedSearch = debounce(function (query) {
      if (query.length < 2) {
        searchResults.innerHTML = ''
        return
      }


      fetch(`/search-suggestions/?q=${encodeURIComponent(query)}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrfToken
        },
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
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
            onSelect(user);
            if (modalId === 'changeOwnerModal') {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const currentModal = bootstrap.Modal.getInstance(searchModalElement);
                if (currentModal) {
                    currentModal.hide();
                    }
                } else {
                }
            }
          });
          searchResults.appendChild(li)
        })
      })
      .catch(error => {
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

  setupUserSearch('changeOwnerModal', 'userSearchInput', 'userSearchResults', (user) => {
    const confirmModalEl = document.getElementById('confirmChangeOwnerModal')
    if (!confirmModalEl) {
      return;
    }
    const newOwnerNameEl = document.getElementById('newOwnerName');
    const newOwnerIdEl = document.getElementById('newOwnerId');


    if (!newOwnerNameEl || !newOwnerIdEl) {
      alert('Ошибка: элементы формы не найдены');
      return;
    }

    newOwnerNameEl.textContent = user.name;
    newOwnerIdEl.value = user.id;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const confirmModal = new bootstrap.Modal(confirmModalEl);
    confirmModal.show();
    } else {
      alert('Ошибка: Bootstrap не загружен');
    }
  });

  const confirmChangeOwnerBtn = document.querySelector('.confirm-change-owner')
  if (confirmChangeOwnerBtn) {
    confirmChangeOwnerBtn.addEventListener('click', function () {
      const newOwnerIdEl = document.getElementById('newOwnerId');
      if (!newOwnerIdEl) {
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


      fetch(`/change_owner/${startupId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
        },
        body: `new_owner_id=${newOwnerId}`,
      })
      .then(async response => {
        let data = null;
        try {
          data = await response.json();
        } catch (e) {
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
        alert('Сетевая ошибка при смене владельца.');
      });
    })
  } else {
  }

  const addInvestorModalEl = document.getElementById('addInvestorModal');
  let selectedInvestor = null;
  if (addInvestorModalEl) {

    setupUserSearch('addInvestorModal', 'investorSearchInput', 'investorSearchResults', (user) => {
      selectedInvestor = user;
      const investorSearchInput = document.getElementById('investorSearchInput');
      if (investorSearchInput) {
      investorSearchInput.value = user.name;
      investorSearchInput.disabled = true;
      }

      const searchResults = document.getElementById('investorSearchResults');
      if (searchResults) {
        searchResults.innerHTML = '';
      }

      const addInvestmentButton = document.getElementById('addInvestmentButton');
      if (addInvestmentButton) {
        addInvestmentButton.disabled = false;
      }
    });

    const addInvestmentButton = document.getElementById('addInvestmentButton');
    if (addInvestmentButton) {
    addInvestmentButton.addEventListener('click', function() {

        if (!selectedInvestor) {
            alert('Сначала выберите пользователя из списка.');
            return;
        }

        const amountInput = document.getElementById('investmentAmount');
        if (!amountInput) {
          alert('Ошибка: поле суммы инвестиции не найдено');
          return;
        }

        const amount = amountInput.value;
        if (!amount || parseFloat(amount) <= 0) {
            alert('Введите корректную сумму инвестиции.');
            return;
        }

        if (!csrfToken) {
          alert('Ошибка безопасности. Попробуйте перезагрузить страницу.');
          return;
        }


        fetch(`/add_investor/${startupId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                user_id: selectedInvestor.id,
                amount: amount,
            }),
        })
        .then(async response => {
            let data = null;
            try {
                data = await response.json();
            } catch (e) {
            }

            if (response.ok && data && data.success) {
                alert('Инвестор успешно добавлен!');
                const amountInput = document.getElementById('investmentAmount');
                if (amountInput) {
                    amountInput.value = '';
                }
                loadCurrentInvestors().then(() => {
                    if (selectedInvestor) {
                        const addInvestmentButton = document.getElementById('addInvestmentButton');
                        if (addInvestmentButton) {
                            addInvestmentButton.disabled = false;
                        }
                    }
                });
                updateStartupFinancials(data.new_amount_raised, data.new_investor_count);
            } else {
                const errMsg = (data && data.error) || 'Ошибка при добавлении инвестора.';
                alert(errMsg);
            }
        })
        .catch(error => {
            alert('Сетевая ошибка при добавлении инвестора.');
        });
    });
    } else {
    }
  }

    function resetAddInvestorForm() {
        selectedInvestor = null;

        const searchInput = document.getElementById('investorSearchInput');
      if (searchInput) {
        searchInput.value = '';
        searchInput.disabled = false;
      }

      const amountInput = document.getElementById('investmentAmount');
      if (amountInput) {
          amountInput.value = '';
      }

      const addButton = document.getElementById('addInvestmentButton');
      if (addButton) {
          addButton.disabled = true;
      }
  }

    function loadCurrentInvestors() {
        return fetch(`/get_investors/${startupId}/`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Ошибка сервера: ${response.status}. Ответ: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            const investorsList = document.getElementById('currentInvestorsList');
          if (investorsList) {
            investorsList.innerHTML = data.html;
          }
          const addInvestmentButton = document.getElementById('addInvestmentButton');
          if (addInvestmentButton) {
            if (selectedInvestor) {
              addInvestmentButton.disabled = false;
            } else {
              addInvestmentButton.disabled = true;
            }
          }
          return data;
        })
        .catch(error => {
            const investorsList = document.getElementById('currentInvestorsList');
          if (investorsList) {
            investorsList.innerHTML = '<p class="text-danger">Не удалось загрузить список инвесторов.</p>';
          }
          throw error;
      });
  }

  const currentInvestorsList = document.getElementById('currentInvestorsList');
  if (currentInvestorsList) {
    currentInvestorsList.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.delete-investment-btn');
        if (deleteButton) {
            const transactionId = deleteButton.dataset.transactionId;
            const userId = deleteButton.dataset.userId;

            if (!transactionId && !userId) {
                alert('Ошибка: не удалось определить транзакцию.');
                return;
            }

            if (!csrfToken) {
                alert('Ошибка безопасности. Попробуйте перезагрузить страницу.');
                return;
            }

            if (confirm(`Вы уверены, что хотите удалить эту инвестицию?`)) {
                const url = `/delete_investment/${startupId}/${userId || 0}/`;
                const body = transactionId ? JSON.stringify({ transaction_id: parseInt(transactionId) }) : '{}';
                
                fetch(url, {
                    method: 'POST',
                    headers: { 
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: body
                })
                .then(async response => {
                    if (!response.ok) {
                        let errorText = '';
                        try {
                            const errorData = await response.json();
                            errorText = errorData.error || errorData.message || `Ошибка ${response.status}`;
                        } catch (e) {
                            errorText = await response.text() || `Ошибка ${response.status}`;
                        }
                        throw new Error(errorText);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.success) {
                        alert('Инвестиция удалена.');
                        loadCurrentInvestors();
                        updateStartupFinancials(data.new_amount_raised, data.new_investor_count);
                    } else {
                        alert(data?.error || 'Ошибка при удалении.');
                    }
                })
                .catch(error => {
                    console.error('Delete investment error:', error);
                    alert('Произошла ошибка при удалении: ' + (error.message || 'Неизвестная ошибка'));
                });
            }
        }
    });
  } else {
  }

    function updateStartupFinancials(investorCount, amountRaised) {

        const investorCountDisplay = document.getElementById('investor-count-display');
        if (investorCountDisplay) {
            investorCountDisplay.textContent = `(${investorCount})`;
        } else {
        }

        const amountRaisedCard = document.querySelector('.info-card-value-button.accent-blue-bg');
        if (amountRaisedCard) {
            amountRaisedCard.textContent = `${new Intl.NumberFormat('ru-RU').format(Math.floor(amountRaised))} ₽`;
      } else {
        }

        const fundingGoal = parseFloat(pageDataElement.dataset.fundingGoal) || 0;
        const progressPercentage = fundingGoal > 0 ? (amountRaised / fundingGoal) * 100 : 0;

        const progressBar = document.querySelector('.progress-animation-container');
        const progressText = document.querySelector('.progress-percentage');


        if (progressBar) {
            progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
      } else {
        }

        if (progressText) {
            progressText.textContent = `${Math.floor(progressPercentage)}%`;
      } else {
        }
    }

  if (addInvestorModalEl) {
    addInvestorModalEl.addEventListener('show.bs.modal', function () {
        loadCurrentInvestors();
        const searchInput = document.getElementById('investorSearchInput');
        if (searchInput && !selectedInvestor) {
            searchInput.value = '';
            searchInput.disabled = false;
        }
        const amountInput = document.getElementById('investmentAmount');
        if (amountInput) {
            amountInput.value = '';
        }
        if (!selectedInvestor) {
            const addButton = document.getElementById('addInvestmentButton');
            if (addButton) {
                addButton.disabled = true;
            }
        }
    });
  }

  function setupRatingStars() {
    let ratingStars = document.querySelector('.rating-stars[data-interactive="true"]');
    if (!ratingStars) {
      const allRatingStars = document.querySelectorAll('.rating-stars');
      if (allRatingStars.length > 0) {
        ratingStars = allRatingStars[0];
      } else {
        return;
      }
    }

    const ratingContainers = ratingStars.querySelectorAll('.rating-icon-container');
    const currentRatingStr = ratingStars.dataset.rating || '0';
    const currentRating = parseFloat(currentRatingStr.replace(',', '.')) || 0;


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

    });

    updateRatingDisplay(currentRating);

    if (ratingStars.dataset.interactive === 'true') {
      ratingContainers.forEach((container, index) => {
        const value = index + 1;

        container.addEventListener('mouseenter', () => {
          updateRatingDisplay(value);
        });

        container.addEventListener('mouseleave', () => {
          updateRatingDisplay(currentRating);
        });

        container.addEventListener('click', () => {
          submitRating(value);
        });
      });
    }
  }

  function updateRatingDisplay(rating) {
    const ratingContainers = document.querySelectorAll('.rating-stars .rating-icon-container');

    ratingContainers.forEach((container, index) => {
      const value = index + 1;
      const emptyIcon = container.querySelector('.icon-empty');
      const filledIcon = container.querySelector('.icon-filled');


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

    if (!csrfToken) {
      alert('Ошибка безопасности. Попробуйте перезагрузить страницу.');
      return;
    }

    fetch(`/vote-startup/${startupId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `rating=${rating}`
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text);
        });
      }
      return response.json();
    })
    .then(data => {
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
      alert('Произошла ошибка при отправке оценки.');
    });
  }

  function setupCommentRatings() {
    const commentRatings = document.querySelectorAll('.comment-rating');

    commentRatings.forEach((ratingContainer, index) => {
      const rating = parseFloat(ratingContainer.dataset.rating) || 0;
      const ratingIcons = ratingContainer.querySelectorAll('.rating-icon-container');


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
    const overallRating = document.querySelector('.overall-rating-stars');

    if (overallRating) {
      const rating = parseFloat(overallRating.dataset.rating) || 0;
      const ratingIcons = overallRating.querySelectorAll('.rating-icon-container');


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
    } else {
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

  setupSimilarStartupsRatings();

  setupSimilarStartupsShowMore();

  setupCommentsShowMore();

  setupCommentRatingInput();

  setupTextTruncation();
  setupModeratorDelete();

  function setupSimilarStartupsRatings() {
    const similarRatings = document.querySelectorAll('.similar-card-rating');

    similarRatings.forEach((ratingContainer, index) => {
      const rating = parseFloat(ratingContainer.dataset.rating) || 0;
      const ratingIcons = ratingContainer.querySelectorAll('.rating-icon-container');


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

  function setupSimilarStartupsShowMore() {
    const showMoreButton = document.querySelector('.show-more-similar');

    if (showMoreButton) {
      showMoreButton.addEventListener('click', (e) => {
        e.preventDefault();

        const startupId = document.querySelector('.startup-detail-page').dataset.startupId;
        const loadSimilarUrl = document.querySelector('.startup-detail-page').dataset.loadSimilarUrl;

        if (!loadSimilarUrl) {
          return;
        }

        showMoreButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
        showMoreButton.disabled = true;

        fetch(loadSimilarUrl)
          .then(response => response.text())
          .then(html => {
            const similarGrid = document.querySelector('.similar-startups-grid');
            if (!similarGrid) return;
            if (!html || html.trim() === '') {
              similarGrid.innerHTML = '<p style="margin-top:10px;color:#fff;opacity:.8;">Похожих стартапов пока нет.</p>';
              return;
            }

            const placeholder = document.createElement('div');
            placeholder.className = 'similar-card show-more-placeholder';
            placeholder.innerHTML = '<button class="action-button show-more-similar"><i class="fas fa-redo"></i> Показать еще</button>';
            similarGrid.innerHTML = html;
            similarGrid.appendChild(placeholder);
            setupSimilarStartupsRatings();

            setupSimilarStartupsShowMore();
          })
          .catch(error => {
            showMoreButton.innerHTML = '<i class="fas fa-redo"></i> Показать еще';
            showMoreButton.disabled = false;
          });
      });
    } else {
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
      fetch(`/delete-comment/startup/${commentId}/`, {
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
      <div class="rating-input-label">Оцените стартап:</div>
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
    const tabButtons = document.querySelectorAll('.tab-button');
    const contentSections = document.querySelectorAll('.content-section');


    tabButtons.forEach((button, index) => {
      const targetId = button.dataset.target;
    });

    contentSections.forEach((section, index) => {
    });

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.target;

        tabButtons.forEach(btn => btn.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));

        button.classList.add('active');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.classList.add('active');
        } else {
          const partialMatch = Array.from(contentSections).find(section =>
            section.id.includes(targetId.replace('-section', '')) ||
            targetId.includes(section.id.replace('-section', ''))
          );
          if (partialMatch) {
            partialMatch.classList.add('active');
          }
        }
      });
    });
  }

  setupTabNavigation();

  function setupActionButtons() {

    const chatButton = document.querySelector('.carousel-chat-button-unique');
    if (chatButton) {
      chatButton.addEventListener('click', (e) => {
        e.preventDefault();

        const ownerId = document.querySelector('.startup-detail-page').dataset.ownerId;
        if (!ownerId) {
          alert('Ошибка: не удалось определить автора стартапа');
          return;
        }

        startChatWithUser(ownerId);
      });
    } else {
    }

    const writeButton = document.querySelector('.write-author-button-unique');
    if (writeButton) {
      writeButton.addEventListener('click', (e) => {
        e.preventDefault();

        const ownerId = document.querySelector('.startup-detail-page').dataset.ownerId;
        if (!ownerId) {
          alert('Ошибка: не удалось определить автора стартапа');
          return;
        }

        startChatWithUser(ownerId);
      });
    } else {
    }

    const allButtons = document.querySelectorAll('button');
    allButtons.forEach((btn, index) => {
      if (btn.textContent.includes('Чат') || btn.textContent.includes('Написать')) {
      }
    });
  }

  setupActionButtons();
  setupImageManager();

  function setupTimelineSteps() {
    const timelineSteps = document.querySelectorAll('.timeline-step');
    const descriptionItems = document.querySelectorAll('.timeline-description-item');

    if (timelineSteps.length === 0) {
      return;
    }


    timelineSteps.forEach((step, index) => {
      const stepNumber = step.dataset.step;

      step.addEventListener('click', () => {

        timelineSteps.forEach(s => s.classList.remove('active-step-display'));
        descriptionItems.forEach(d => d.classList.remove('active'));

        step.classList.add('active-step-display');

        const targetDescription = document.querySelector(`.timeline-description-item:nth-child(${parseInt(stepNumber)})`);
        if (targetDescription) {
          targetDescription.classList.add('active');
        } else {
        }
      });

      step.style.cursor = 'pointer';
    });
  }

  setupTimelineSteps();

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
        alert('Ошибка при создании чата: ' + error.message);
      });
  }
});

// Глобальные переменные для управления изображениями
let currentEntityType = null;
let currentEntityId = null;
let imageOrderChanged = false;

function setupImageManager() {
  // Настройка drag and drop для загрузки файлов
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  
  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      handleFileUpload(files);
    });
    
    fileInput.addEventListener('change', (e) => {
      handleFileUpload(e.target.files);
    });
  }
}

function openImageManager(entityType, entityId) {
  currentEntityType = entityType;
  currentEntityId = entityId;
  imageOrderChanged = false;
  
  const modal = document.getElementById('imageManagerModal');
  modal.style.display = 'block';
  
  // Загружаем текущие изображения
  loadCurrentImages();
  
  // Переключаемся на вкладку изображений
  switchTab('creatives');
}

function closeImageManager() {
  const modal = document.getElementById('imageManagerModal');
  modal.style.display = 'none';
  
  // Сбрасываем состояние
  currentEntityType = null;
  currentEntityId = null;
  imageOrderChanged = false;
  
  // Очищаем форму загрузки
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
  
  const uploadProgress = document.getElementById('uploadProgress');
  if (uploadProgress) uploadProgress.style.display = 'none';
}

function switchTab(tabName) {
  // Переключаем кнопки табов
  document.querySelectorAll('.image-manager-tabs .image-manager-tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
  
  // Переключаем контент табов
  document.querySelectorAll('.image-manager-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

function loadCurrentImages() {
  const imageList = document.getElementById('imageList');
  if (!imageList) return;
  
  // Получаем текущие изображения из карусели
  const carouselImages = document.querySelectorAll('.startup-detail-carousel-image');
  const imageUrls = Array.from(carouselImages).map(img => {
    const src = img.src;
    // Извлекаем file_id из URL
    const match = src.match(/\/creatives\/([^\/]+)_/);
    return match ? match[1] : null;
  }).filter(Boolean);
  
  if (imageUrls.length === 0) {
    imageList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Изображения не загружены</p>';
    return;
  }
  
  // Создаем элементы изображений
  imageList.innerHTML = imageUrls.map((fileId, index) => `
    <div class="image-manager-item" data-file-id="${fileId}" draggable="true">
      <img src="{% get_file_url_tag '${fileId}' ${currentEntityId} 'creative' '${currentEntityType}' %}" alt="Изображение ${index + 1}">
      <div class="image-manager-order">${index + 1}</div>
      <div class="image-manager-controls">
        <button onclick="deleteImage('${fileId}')" title="Удалить">×</button>
      </div>
    </div>
  `).join('');
  
  // Настраиваем drag and drop для изменения порядка
  setupImageDragAndDrop();
}

function setupImageDragAndDrop() {
  const imageItems = document.querySelectorAll('.image-manager-item');
  
  imageItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.outerHTML);
      item.style.opacity = '0.5';
    });
    
    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedItem = document.querySelector('.image-manager-item[style*="opacity: 0.5"]');
      if (draggedItem && draggedItem !== item) {
        const parent = item.parentNode;
        const nextSibling = item.nextSibling;
        parent.insertBefore(draggedItem, nextSibling);
        updateImageOrder();
        imageOrderChanged = true;
        document.getElementById('saveOrderBtn').style.display = 'inline-block';
      }
    });
  });
}

function updateImageOrder() {
  const imageItems = document.querySelectorAll('.image-manager-item');
  imageItems.forEach((item, index) => {
    const orderElement = item.querySelector('.image-manager-order');
    if (orderElement) {
      orderElement.textContent = index + 1;
    }
  });
}

function deleteImage(fileId) {
  if (!confirm('Вы уверены, что хотите удалить это изображение?')) {
    return;
  }
  
  fetch(`/delete-file/${currentEntityType}/${currentEntityId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      file_type: 'creative',
      file_id: fileId
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Удаляем элемент из DOM
      const imageItem = document.querySelector(`[data-file-id="${fileId}"]`);
      if (imageItem) {
        imageItem.remove();
        updateImageOrder();
        imageOrderChanged = true;
        document.getElementById('saveOrderBtn').style.display = 'inline-block';
      }
      
      // Обновляем карусель на странице
      location.reload();
    } else {
      alert('Ошибка при удалении изображения: ' + (data.error || 'Неизвестная ошибка'));
    }
  })
  .catch(error => {
    alert('Ошибка при удалении изображения');
  });
}

function saveImageOrder() {
  const imageItems = document.querySelectorAll('.image-manager-item');
  const newOrder = Array.from(imageItems).map(item => item.dataset.fileId);
  
  fetch(`/reorder-files/${currentEntityType}/${currentEntityId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      file_type: 'creative',
      new_order: newOrder
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      imageOrderChanged = false;
      document.getElementById('saveOrderBtn').style.display = 'none';
      alert('Порядок изображений сохранен!');
      
      // Обновляем карусель на странице
      location.reload();
    } else {
      alert('Ошибка при сохранении порядка: ' + (data.error || 'Неизвестная ошибка'));
    }
  })
  .catch(error => {
    alert('Ошибка при сохранении порядка изображений');
  });
}

function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  
  // Проверяем лимиты
  if (files.length > 10) {
    alert('Максимально можно загрузить 10 изображений');
    return;
  }
  
  for (let file of files) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert(`Файл ${file.name} слишком большой. Максимальный размер: 5MB`);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert(`Файл ${file.name} не является изображением`);
      return;
    }
  }
  
  // Показываем прогресс
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('image-manager-progress-text');
  
  uploadProgress.style.display = 'block';
  
  // Загружаем файлы
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('creatives', file);
  });
  
  // Отправляем на страницу редактирования
  fetch(`/edit-startup/${currentEntityId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      progressFill.style.width = '100%';
      progressText.textContent = '100%';
      
      setTimeout(() => {
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        
        // Обновляем список изображений
        loadCurrentImages();
        
        // Обновляем карусель на странице
        location.reload();
      }, 1000);
    } else {
      alert('Ошибка при загрузке файлов: ' + (data.error || 'Неизвестная ошибка'));
      uploadProgress.style.display = 'none';
    }
  })
  .catch(error => {
    alert('Ошибка при загрузке файлов');
    uploadProgress.style.display = 'none';
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

function openAddInvestorModal() {
  const modal = document.getElementById('addInvestorModal');
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

let currentInvestStartupId = null;
let currentInvestType = null;

function openInvestModal(type, startupId) {
  currentInvestStartupId = startupId;
  currentInvestType = type;
  
  const userRole = getUserRole();
  const pageDataElement = document.querySelector('.startup-detail-page');
  const isAuthenticated = pageDataElement && pageDataElement.dataset.userAuthenticated === 'true';
  
  if (!isAuthenticated) {
    alert('Для инвестирования необходимо войти в систему');
    return;
  }
  
  if (userRole === 'moderator') {
    const modal = document.getElementById('investModal');
    const modalTitle = document.getElementById('investModalTitle');
    const amountInput = document.getElementById('investAmount');
    const errorDiv = document.getElementById('investError');
    
    if (!modal) return;
    
    if (modalTitle) {
      modalTitle.textContent = type === 'buy' ? 'Выкупить' : 'Связаться';
    }
    
    if (amountInput) {
      amountInput.value = '';
      amountInput.style.display = 'block';
    }
    
    const amountLabel = amountInput ? amountInput.previousElementSibling : null;
    if (amountLabel && amountLabel.tagName === 'LABEL') {
      amountLabel.style.display = 'block';
    }
    
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      modal.style.display = 'block';
    }
  } else if (userRole === 'investor' || userRole === 'startuper') {
    const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken');
    
    if (!csrfToken) {
      alert('Ошибка безопасности. Перезагрузите страницу.');
      return;
    }
    
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfToken);
    
    fetch(`/invest/${startupId}/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.redirect) {
          window.location.href = `/cosmochat/?chat_id=${data.chat_id}`;
        }
      } else {
        alert(data.error || 'Произошла ошибка при создании чата');
      }
    })
    .catch(error => {
      alert('Произошла ошибка при отправке запроса');
    });
  } else {
    alert('Недостаточно прав для инвестирования');
  }
}

function getUserRole() {
  const pageDataElement = document.querySelector('.startup-detail-page');
  if (pageDataElement) {
    const userRole = pageDataElement.dataset.userRole;
    return userRole;
  }
  return null;
}

document.addEventListener('DOMContentLoaded', function() {
  const confirmInvestButton = document.getElementById('confirmInvestButton');
  const investModal = document.getElementById('investModal');
  
  if (confirmInvestButton) {
    confirmInvestButton.addEventListener('click', function() {
      const userRole = getUserRole();
      const errorDiv = document.getElementById('investError');
      
      if (!currentInvestStartupId) {
        return;
      }
      
      const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
      const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken');
      
      if (!csrfToken) {
        if (errorDiv) {
          errorDiv.textContent = 'Ошибка безопасности. Перезагрузите страницу.';
          errorDiv.style.display = 'block';
        }
        return;
      }
      
      const formData = new FormData();
      
      if (userRole === 'moderator') {
        const amountInput = document.getElementById('investAmount');
        if (!amountInput) {
          return;
        }
        
        const amount = parseFloat(amountInput.value);
        
        if (!amount || amount <= 0) {
          if (errorDiv) {
            errorDiv.textContent = 'Введите корректную сумму';
            errorDiv.style.display = 'block';
          }
          return;
        }
        
        formData.append('amount', amount);
      }
      
      formData.append('csrfmiddlewaretoken', csrfToken);
      
      confirmInvestButton.disabled = true;
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
      
      fetch(`/invest/${currentInvestStartupId}/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken
        },
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        confirmInvestButton.disabled = false;
        
        if (data.success) {
          if (data.redirect) {
            window.location.href = `/cosmochat/?chat_id=${data.chat_id}`;
          } else {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal && investModal) {
              const bsModal = bootstrap.Modal.getInstance(investModal);
              if (bsModal) {
                bsModal.hide();
              }
            } else if (investModal) {
              investModal.style.display = 'none';
            }
            
            alert('Инвестирование успешно выполнено!');
            location.reload();
          }
        } else {
          if (errorDiv) {
            errorDiv.textContent = data.error || 'Произошла ошибка при инвестировании';
            errorDiv.style.display = 'block';
          } else {
            alert(data.error || 'Произошла ошибка при инвестировании');
          }
        }
      })
      .catch(error => {
        confirmInvestButton.disabled = false;
        if (errorDiv) {
          errorDiv.textContent = 'Произошла ошибка при отправке запроса';
          errorDiv.style.display = 'block';
        } else {
          alert('Произошла ошибка при отправке запроса');
        }
      });
    });
  }

  let currentAiRatingEntityType = null;
  let currentAiRatingEntityId = null;

  function openEditAiRatingModal(entityType, entityId, currentRating) {
    currentAiRatingEntityType = entityType;
    currentAiRatingEntityId = entityId;
    
    const modal = document.getElementById('editAiRatingModal');
    const ratingInput = document.getElementById('aiRatingInput');
    const errorDiv = document.getElementById('aiRatingError');
    
    if (!modal) return;
    
    if (ratingInput) {
      ratingInput.value = currentRating || '';
    }
    
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      modal.style.display = 'block';
    }
  }

  window.openEditAiRatingModal = openEditAiRatingModal;

  const confirmAiRatingButton = document.getElementById('confirmAiRatingButton');
  const editAiRatingModal = document.getElementById('editAiRatingModal');
  
  if (confirmAiRatingButton) {
    confirmAiRatingButton.addEventListener('click', function() {
      const ratingInput = document.getElementById('aiRatingInput');
      const errorDiv = document.getElementById('aiRatingError');
      
      if (!ratingInput || !currentAiRatingEntityId) {
        return;
      }
      
      const rating = parseFloat(ratingInput.value);
      
      if (!rating || rating < 1 || rating > 10) {
        if (errorDiv) {
          errorDiv.textContent = 'Оценка должна быть от 1 до 10';
          errorDiv.style.display = 'block';
        }
        return;
      }
      
      const csrfTokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
      const csrfToken = csrfTokenInput ? csrfTokenInput.value : getCookie('csrftoken');
      
      if (!csrfToken) {
        if (errorDiv) {
          errorDiv.textContent = 'Ошибка безопасности. Перезагрузите страницу.';
          errorDiv.style.display = 'block';
        }
        return;
      }
      
      const formData = new FormData();
      formData.append('ai_rating', rating);
      formData.append('csrfmiddlewaretoken', csrfToken);
      
      confirmAiRatingButton.disabled = true;
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
      
      fetch(`/edit-ai-rating/${currentAiRatingEntityType}/${currentAiRatingEntityId}/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken
        },
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        confirmAiRatingButton.disabled = false;
        
        if (data.success) {
          const ratingValueElement = document.getElementById('ai-rating-value');
          if (ratingValueElement) {
            ratingValueElement.textContent = data.ai_rating + ' из 10';
          }
          
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal && editAiRatingModal) {
            const bsModal = bootstrap.Modal.getInstance(editAiRatingModal);
            if (bsModal) {
              bsModal.hide();
            }
          } else if (editAiRatingModal) {
            editAiRatingModal.style.display = 'none';
          }
        } else {
          if (errorDiv) {
            errorDiv.textContent = data.error || 'Произошла ошибка при сохранении оценки';
            errorDiv.style.display = 'block';
          } else {
            alert(data.error || 'Произошла ошибка при сохранении оценки');
          }
        }
      })
      .catch(error => {
        confirmAiRatingButton.disabled = false;
        if (errorDiv) {
          errorDiv.textContent = 'Произошла ошибка при отправке запроса';
          errorDiv.style.display = 'block';
        } else {
          alert('Произошла ошибка при отправке запроса');
        }
      });
    });
  }
});