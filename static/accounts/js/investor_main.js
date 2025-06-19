// This is a placeholder for JavaScript code for the main_temp page.
// We can add functionality here later if needed.

document.addEventListener('DOMContentLoaded', function () {
  const banner = document.querySelector('.journey-start-banner');
    if (banner && banner.dataset.bgUrl) {
      banner.style.backgroundImage = `url('${banner.dataset.bgUrl}')`;
    }
});
