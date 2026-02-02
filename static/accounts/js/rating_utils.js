/**
 * Общий модуль для работы с рейтинговыми звёздами.
 * Используется в startup_detail, agency_detail, franchise_detail, specialist_detail.
 */
(function (global) {
  'use strict';

  /**
   * Обновляет отображение звёзд рейтинга в контейнере .rating-stars.
   * @param {number} rating — значение рейтинга (0-5, может быть дробным)
   * @param {Element} [container] — контейнер звёзд (по умолчанию .rating-stars)
   */
  function updateRatingDisplay(rating, container) {
    var root = container || document.querySelector('.rating-stars');
    if (!root) return;

    var ratingContainers = root.querySelectorAll('.rating-icon-container');
    ratingContainers.forEach(function (iconContainer, index) {
      var value = index + 1;
      var emptyIcon = iconContainer.querySelector('.icon-empty');
      var filledIcon = iconContainer.querySelector('.icon-filled');

      if (value <= Math.floor(rating)) {
        if (emptyIcon) { emptyIcon.style.display = 'none'; emptyIcon.style.opacity = '0'; }
        if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'none'; }
      } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
        var partialValue = rating % 1;
        if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
        if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'inset(0 ' + (100 - (partialValue * 100)) + '% 0 0)'; }
      } else {
        if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
        if (filledIcon) { filledIcon.style.display = 'none'; filledIcon.style.opacity = '0'; filledIcon.style.clipPath = 'none'; }
      }
    });
  }

  /**
   * Инициализирует отображение рейтинга в комментариях (.comment-rating).
   */
  function setupCommentRatings() {
    var commentRatings = document.querySelectorAll('.comment-rating');
    commentRatings.forEach(function (ratingContainer) {
      var rating = parseFloat(ratingContainer.dataset.rating) || 0;
      var ratingIcons = ratingContainer.querySelectorAll('.rating-icon-container');

      ratingIcons.forEach(function (iconContainer, iconIndex) {
        var value = iconIndex + 1;
        var emptyIcon = iconContainer.querySelector('.icon-empty');
        var filledIcon = iconContainer.querySelector('.icon-filled');

        if (value <= Math.floor(rating)) {
          if (emptyIcon) { emptyIcon.style.display = 'none'; emptyIcon.style.opacity = '0'; }
          if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'none'; }
        } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
          var partialValue = rating % 1;
          if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
          if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'inset(0 ' + (100 - (partialValue * 100)) + '% 0 0)'; }
        } else {
          if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
          if (filledIcon) { filledIcon.style.display = 'none'; filledIcon.style.opacity = '0'; filledIcon.style.clipPath = 'none'; }
        }
      });
    });
  }

  /**
   * Инициализирует overall рейтинг (.overall-rating-stars).
   */
  function setupOverallRating() {
    var overallRating = document.querySelector('.overall-rating-stars');
    if (!overallRating) return;

    var rating = parseFloat(overallRating.dataset.rating) || 0;
    var ratingIcons = overallRating.querySelectorAll('.rating-icon-container');

    ratingIcons.forEach(function (iconContainer, index) {
      var value = index + 1;
      var emptyIcon = iconContainer.querySelector('.icon-empty');
      var filledIcon = iconContainer.querySelector('.icon-filled');

      if (value <= Math.floor(rating)) {
        if (emptyIcon) { emptyIcon.style.display = 'none'; emptyIcon.style.opacity = '0'; }
        if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'none'; }
      } else if (value === Math.ceil(rating) && rating % 1 !== 0) {
        var partialValue = rating % 1;
        if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
        if (filledIcon) { filledIcon.style.display = 'block'; filledIcon.style.opacity = '1'; filledIcon.style.clipPath = 'inset(0 ' + (100 - (partialValue * 100)) + '% 0 0)'; }
      } else {
        if (emptyIcon) { emptyIcon.style.display = 'block'; emptyIcon.style.opacity = '1'; }
        if (filledIcon) { filledIcon.style.display = 'none'; filledIcon.style.opacity = '0'; filledIcon.style.clipPath = 'none'; }
      }
    });
  }

  global.RatingUtils = {
    updateRatingDisplay: updateRatingDisplay,
    setupCommentRatings: setupCommentRatings,
    setupOverallRating: setupOverallRating
  };

})(window);
