document.addEventListener('DOMContentLoaded', function () {
  const banner = document.querySelector('.journey-start-banner');
    if (banner && banner.dataset.bgUrl) {
      banner.style.backgroundImage = `url('${banner.dataset.bgUrl}')`;
    }
});
