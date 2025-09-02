document.addEventListener('DOMContentLoaded', function() {
    const scrollArrowUp = document.createElement('button');
    scrollArrowUp.className = 'scroll-arrow scroll-arrow-up';
    scrollArrowUp.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
    `;
    scrollArrowUp.title = 'Прокрутить вверх';

    const scrollArrowDown = document.createElement('button');
    scrollArrowDown.className = 'scroll-arrow scroll-arrow-down';
    scrollArrowDown.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
        </svg>
    `;
    scrollArrowDown.title = 'Прокрутить вниз';

    document.body.appendChild(scrollArrowUp);
    document.body.appendChild(scrollArrowDown);

    function smoothScrollTo(target) {
        const targetPosition = target === 'top' ? 0 : document.documentElement.scrollHeight - window.innerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    scrollArrowUp.addEventListener('click', function(e) {
        e.preventDefault();
        smoothScrollTo('top');
    });

    scrollArrowDown.addEventListener('click', function(e) {
        e.preventDefault();
        smoothScrollTo('bottom');
    });

    function updateScrollArrows() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const hasVerticalScroll = documentHeight > windowHeight;

        if (hasVerticalScroll) {
            scrollArrowUp.classList.add('show');
            scrollArrowDown.classList.add('show');

            if (scrollTop <= 50) {
                scrollArrowUp.classList.remove('show');
            }

            if (scrollTop + windowHeight >= documentHeight - 50) {
                scrollArrowDown.classList.remove('show');
            }
        } else {
            scrollArrowUp.classList.remove('show');
            scrollArrowDown.classList.remove('show');
        }
    }

    updateScrollArrows();

    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateScrollArrows, 10);
    });

    window.addEventListener('resize', function() {
        updateScrollArrows();
    });
});