document.addEventListener('DOMContentLoaded', function () {
  const banner = document.querySelector('.journey-start-banner');
    if (banner && banner.dataset.bgUrl) {
      banner.style.backgroundImage = `url('${banner.dataset.bgUrl}')`;
    }

  const categoriesRoot = document.querySelector('.journey-start-categories');
  if (categoriesRoot) {
    const startupsUrl = categoriesRoot.getAttribute('data-startups-url') || '/startups/';
    const carousel = categoriesRoot.querySelector('.category-carousel');
    const inner = categoriesRoot.querySelector('.category-carousel-inner');
    const viewport = categoriesRoot.querySelector('.category-carousel-viewport');
    const leftArrow = categoriesRoot.querySelector('.category-carousel-arrow-left');
    const rightArrow = categoriesRoot.querySelector('.category-carousel-arrow-right');
    if (carousel && inner && viewport && leftArrow && rightArrow) {
      const iconLeft = carousel.getAttribute('data-icon-left');
      const iconRight = carousel.getAttribute('data-icon-right');
      if (iconLeft) leftArrow.src = iconLeft;
      if (iconRight) rightArrow.src = iconRight;
      let offset = 0;
      let stepCache = 0;
      function getStep() {
        const item = inner.querySelector('.journey-start-category');
        if (!item) return 0;
        const gap = parseInt(getComputedStyle(inner).gap) || 0;
        const value = item.offsetWidth + gap;
        stepCache = value;
        return value;
      }
      function maxOffset() {
        const totalWidth = inner.scrollWidth;
        const viewWidth = viewport.clientWidth;
        return Math.max(0, totalWidth - viewWidth);
      }
      function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
      }
      function update() {
        inner.style.transform = `translateX(-${offset}px)`;
        markCenterItem();
      }
      function markCenterItem() {}
      leftArrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        offset = clamp(offset - getStep(), 0, maxOffset());
        update();
      });
      rightArrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        offset = clamp(offset + getStep(), 0, maxOffset());
        update();
      });
      window.addEventListener('resize', function(){ getStep(); update(); });
      getStep();
      update();
    }

    const items = categoriesRoot.querySelectorAll('.journey-start-category');
    items.forEach(function(item) {
      item.addEventListener('click', function() {
        const category = item.getAttribute('data-category');
        if (!category) return;
        const url = new URL(startupsUrl, window.location.origin);
        url.searchParams.append('category', category);
        window.location.href = url.toString();
      });

    });
  }
});
