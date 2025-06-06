// This is a placeholder for JavaScript code for the main_temp page.
// We can add functionality here later if needed.

document.addEventListener('DOMContentLoaded', function () {
    // --- Features Carousel (Почему выбирают нас?) ---
    const featuresCarousel = document.querySelector('.features-carousel');
    const featuresWrapper = document.querySelector('.features-carousel-wrapper');
    const featuresArrowLeft = document.querySelector('.arrow-left-control');
    const featuresArrowRight = document.querySelector('.arrow-right-control');

    if (featuresCarousel && featuresWrapper && featuresArrowLeft && featuresArrowRight) {
        const featureCards = featuresCarousel.querySelectorAll('.feature-card');
        if (featureCards.length > 0) {
            const cardWidth = featureCards[0].offsetWidth;
            const gap = parseInt(getComputedStyle(featuresCarousel).gap) || 20;
            const visibleCards = 3;
            let currentCardIndex = 0;
            const scrollAmount = cardWidth + gap;
            const totalCards = featureCards.length;
            const maxCardIndex = Math.max(0, totalCards - visibleCards);

            function updateFeaturesControls() {
                featuresArrowLeft.classList.toggle('disabled', currentCardIndex === 0);
                featuresArrowRight.classList.toggle('disabled', currentCardIndex >= maxCardIndex);
            }
            
            let carouselInnerContainer = featuresCarousel.querySelector('.featured1-carousel-inner');
            if (!carouselInnerContainer) {
                carouselInnerContainer = document.createElement('div');
                carouselInnerContainer.classList.add('featured1-carousel-inner');
                while (featuresCarousel.firstChild) {
                    carouselInnerContainer.appendChild(featuresCarousel.firstChild);
                }
                featuresCarousel.appendChild(carouselInnerContainer);
                carouselInnerContainer.style.display = 'flex';
                carouselInnerContainer.style.gap = `${gap}px`;
            }

            featuresArrowLeft.addEventListener('click', () => {
                if (currentCardIndex > 0) {
                    currentCardIndex--;
                    carouselInnerContainer.style.transform = 'translateX(-' + (currentCardIndex * scrollAmount) + 'px)';
                    updateFeaturesControls();
                }
            });

            featuresArrowRight.addEventListener('click', () => {
                if (currentCardIndex < maxCardIndex) {
                    currentCardIndex++;
                    carouselInnerContainer.style.transform = 'translateX(-' + (currentCardIndex * scrollAmount) + 'px)';
                    updateFeaturesControls();
                }
            });

            updateFeaturesControls();

            let isDownFeatures = false;
            let startXFeatures;
            let scrollLeftFeatures_draggable;

            featuresWrapper.addEventListener('mousedown', (e) => {
                isDownFeatures = true;
                featuresWrapper.classList.add('active-drag');
                startXFeatures = e.pageX - featuresWrapper.offsetLeft;
                scrollLeftFeatures_draggable = currentCardIndex * scrollAmount;
                if (carouselInnerContainer) carouselInnerContainer.style.transition = 'none';
            });

            function handleDragEnd() {
                if (!isDownFeatures) return;
                isDownFeatures = false;
                featuresWrapper.classList.remove('active-drag');
                if (carouselInnerContainer) carouselInnerContainer.style.transition = 'transform 0.3s ease-out';
                
                const currentTransform = parseFloat(getComputedStyle(carouselInnerContainer).transform.split(',')[4] || 0);
                currentCardIndex = Math.round(-currentTransform / scrollAmount);
                currentCardIndex = Math.max(0, Math.min(currentCardIndex, maxCardIndex));
                
                if (carouselInnerContainer) carouselInnerContainer.style.transform = 'translateX(-' + (currentCardIndex * scrollAmount) + 'px)';
                updateFeaturesControls();
                setTimeout(() => {
                    if (carouselInnerContainer) carouselInnerContainer.style.transition = 'transform 0.5s ease-in-out';
                }, 300);
            }

            featuresWrapper.addEventListener('mouseleave', handleDragEnd);
            featuresWrapper.addEventListener('mouseup', handleDragEnd);

            featuresWrapper.addEventListener('mousemove', (e) => {
                if (!isDownFeatures || !carouselInnerContainer) return;
                e.preventDefault();
                const x = e.pageX - featuresWrapper.offsetLeft;
                const walk = (x - startXFeatures) * 1.5;
                let newScrollVal = scrollLeftFeatures_draggable - walk;
                
                const overScrollDragLimit = scrollAmount / 2;
                const minPossibleTransform = -(maxCardIndex * scrollAmount) - overScrollDragLimit;
                const maxPossibleTransform = overScrollDragLimit;

                newScrollVal = Math.max(minPossibleTransform, Math.min(newScrollVal, maxPossibleTransform));
                carouselInnerContainer.style.transform = 'translateX(-' + newScrollVal + 'px)';
            });

        } else {
            // console.warn('Карточки в карусели "Почему выбирают нас?" не найдены.');
        }
    } else {
        // console.warn('Элементы карусели "Почему выбирают нас?" не найдены.');
    }

    // --- Galaxy Carousel (Как работает наша галактика?) ---
    const galaxyCarousel = document.querySelector('.galaxy-carousel');
    const galaxyWrapper = document.querySelector('.galaxy-carousel-wrapper');
    const arrowLeftGalaxy = document.querySelector('.galaxy-arrow-left');
    const arrowRightGalaxy = document.querySelector('.galaxy-arrow-right');
    const currentStepTitleElement = document.querySelector('.galaxy-step-current-title');
    const stepIndicatorButtonText = document.querySelector('.galaxy-step-number-text');

    if (galaxyCarousel && galaxyWrapper && arrowLeftGalaxy && arrowRightGalaxy && currentStepTitleElement && stepIndicatorButtonText) {
        const galaxyCards = galaxyCarousel.querySelectorAll('.galaxy-step-card');
        if (galaxyCards.length > 0) {
            let currentGalaxyIndex = 0;
            const totalGalaxyCards = galaxyCards.length;
            let galaxyAutoplayInterval = null;

            function updateGalaxyCarousel() {
                galaxyCards.forEach((card, index) => {
                    card.classList.toggle('active-step', index === currentGalaxyIndex);
                });
                
                const currentCardData = galaxyCards[currentGalaxyIndex].querySelector('.galaxy-step-data');
                if (currentCardData) {
                    currentStepTitleElement.textContent = currentCardData.dataset.stepTitle || 'Заголовок шага';
                    stepIndicatorButtonText.textContent = (currentCardData.dataset.stepNumber || '') + ' ШАГ';
                }
            }

            function advanceSlide(direction) {
                if (direction === 'next') {
                    currentGalaxyIndex = (currentGalaxyIndex + 1) % totalGalaxyCards;
                } else {
                    currentGalaxyIndex = (currentGalaxyIndex - 1 + totalGalaxyCards) % totalGalaxyCards;
                }
                updateGalaxyCarousel();
            }

            function resetAutoplay() {
                clearInterval(galaxyAutoplayInterval);
                galaxyAutoplayInterval = setInterval(() => {
                    advanceSlide('next');
                }, 10000); // 10 seconds
            }

            arrowLeftGalaxy.addEventListener('click', () => {
                advanceSlide('prev');
                resetAutoplay();
            });

            arrowRightGalaxy.addEventListener('click', () => {
                advanceSlide('next');
                resetAutoplay();
            });

            // Stop autoplay on hover for better UX
            galaxyWrapper.addEventListener('mouseenter', () => clearInterval(galaxyAutoplayInterval));
            galaxyWrapper.addEventListener('mouseleave', () => resetAutoplay());
            
            updateGalaxyCarousel();
            resetAutoplay();

        } else {
            // console.warn('Карточки в карусели "Галактика" не найдены.');
        }
    } else {
        // console.warn('Элементы карусели "Галактика" не найдены.');
    }

    // --- Success Stories Carousel ---
    const successCarousel = document.querySelector('.success-stories-carousel');
    const successWrapper = document.querySelector('.success-stories-carousel-outer');
    const successArrowLeft = document.querySelector('.success-stories-arrow-left');
    const successArrowRight = document.querySelector('.success-stories-arrow-right');

    if (successCarousel && successWrapper && successArrowLeft && successArrowRight) {
        let successInner = successCarousel.querySelector('.featured8-carousel-inner');
        if (!successInner) {
            successInner = document.createElement('div');
            successInner.classList.add('featured8-carousel-inner');
            successInner.style.display = 'flex';
            const successCardsTemp = Array.from(successCarousel.querySelectorAll('.success-story-card'));
            successCardsTemp.forEach(card => successInner.appendChild(card));
            successCarousel.innerHTML = '';
            successCarousel.appendChild(successInner);
        }
        
        const successCards = successInner.querySelectorAll('.success-story-card');
        if (successCards.length > 0) {
            const cardWidthSuccess = successCards[0].offsetWidth;
            const gapSuccess = parseInt(getComputedStyle(successInner).gap) || 20;
            const visibleCardsSuccess = 3;
            let currentScrollSuccess = 0;
            const scrollAmountSuccess = cardWidthSuccess + gapSuccess;
            const maxScrollSuccess = Math.max(0, (successCards.length - visibleCardsSuccess) * scrollAmountSuccess);

            function updateSuccessArrows() {
                successArrowLeft.classList.toggle('disabled', currentScrollSuccess <= 0);
                successArrowRight.classList.toggle('disabled', currentScrollSuccess >= maxScrollSuccess && maxScrollSuccess > 0);
                 if (maxScrollSuccess <= 0) {
                    successArrowLeft.classList.add('disabled');
                    successArrowRight.classList.add('disabled');
                }
            }

            successArrowLeft.addEventListener('click', () => {
                if (currentScrollSuccess > 0) {
                    currentScrollSuccess -= scrollAmountSuccess;
                    if (currentScrollSuccess < 0) currentScrollSuccess = 0;
                    successInner.style.transform = 'translateX(-' + currentScrollSuccess + 'px)';
                    updateSuccessArrows();
                }
            });

            successArrowRight.addEventListener('click', () => {
                 if (currentScrollSuccess < maxScrollSuccess) {
                    currentScrollSuccess += scrollAmountSuccess;
                    if (currentScrollSuccess > maxScrollSuccess) currentScrollSuccess = maxScrollSuccess;
                    successInner.style.transform = 'translateX(-' + currentScrollSuccess + 'px)';
                    updateSuccessArrows();
                }
            });
            
            updateSuccessArrows();

            if(successWrapper) {
                let isDownSuccess = false;
                let startXSuccess;
                let scrollLeftSuccess_draggable;

                successWrapper.addEventListener('mousedown', (e) => {
                    isDownSuccess = true;
                    successWrapper.classList.add('active-drag');
                    startXSuccess = e.pageX - successWrapper.offsetLeft;
                    scrollLeftSuccess_draggable = currentScrollSuccess;
                    successInner.style.transition = 'none';
                });

                function handleSuccessDragEnd() {
                    if (!isDownSuccess) return;
                    isDownSuccess = false;
                    successWrapper.classList.remove('active-drag');
                    successInner.style.transition = 'transform 0.3s ease-out';
                    
                    const currentTransform = parseFloat(getComputedStyle(successInner).transform.split(',')[4] || 0);
                    let newIndex = Math.round(-currentTransform / scrollAmountSuccess);
                    newIndex = Math.max(0, Math.min(newIndex, successCards.length - visibleCardsSuccess));
                    currentScrollSuccess = newIndex * scrollAmountSuccess;

                    successInner.style.transform = 'translateX(-' + currentScrollSuccess + 'px)';
                    updateSuccessArrows();
                    setTimeout(() => {
                        successInner.style.transition = 'transform 0.5s ease-in-out';
                    }, 300);
                }

                successWrapper.addEventListener('mouseleave', handleSuccessDragEnd);
                successWrapper.addEventListener('mouseup', handleSuccessDragEnd);

                successWrapper.addEventListener('mousemove', (e) => {
                    if (!isDownSuccess) return;
                    e.preventDefault();
                    const x = e.pageX - successWrapper.offsetLeft;
                    const walk = (x - startXSuccess) * 1.5;
                    let newTransform = scrollLeftSuccess_draggable - walk;
                    const overscroll = scrollAmountSuccess / 2;
                    newTransform = Math.max(-overscroll, Math.min(newTransform, maxScrollSuccess + overscroll));
                    successInner.style.transform = 'translateX(-' + newTransform + 'px)';
                });
            }
        } else {
            // console.warn('Карточки в карусели "Истории успеха" не найдены.');
        }
    } else {
        // console.warn('Элементы карусели "Истории успеха" не найдены.');
    }

    // Блок скрипта для sticky эффекта был здесь и теперь удален.
});
