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

            function updateGalaxyCarousel() {
                let galaxyInner = galaxyCarousel.querySelector('.galaxy-carousel-inner');
                if (!galaxyInner) {
                    galaxyInner = document.createElement('div');
                    galaxyInner.classList.add('galaxy-carousel-inner');
                    galaxyInner.style.display = 'flex';
                    galaxyInner.style.width = `${totalGalaxyCards * 100}%`;
                    galaxyCards.forEach(card => {
                        card.style.width = `${100 / totalGalaxyCards}%`;
                        galaxyInner.appendChild(card);
                    });
                    galaxyCarousel.appendChild(galaxyInner);
                } else {
                    galaxyInner.style.display = 'flex';
                    galaxyInner.style.width = `${totalGalaxyCards * 100}%`;
                     galaxyCards.forEach(card => {
                        card.style.width = `${100 / totalGalaxyCards}%`;
                    });
                }

                galaxyInner.style.transform = 'translateX(-' + (currentGalaxyIndex * (100 / totalGalaxyCards)) + '%)';
                
                const currentCardData = galaxyCards[currentGalaxyIndex].querySelector('.galaxy-step-data');
                if (currentCardData) {
                    currentStepTitleElement.textContent = currentCardData.dataset.stepTitle || 'Заголовок шага';
                    stepIndicatorButtonText.textContent = (currentCardData.dataset.stepNumber || '') + ' ШАГ';
                }
                galaxyCards.forEach((card, index) => {
                    card.classList.toggle('active-step', index === currentGalaxyIndex);
                });
                arrowLeftGalaxy.classList.toggle('disabled', currentGalaxyIndex === 0);
                arrowRightGalaxy.classList.toggle('disabled', currentGalaxyIndex === totalGalaxyCards - 1);
            }

            arrowLeftGalaxy.addEventListener('click', () => {
                if (currentGalaxyIndex > 0) {
                    currentGalaxyIndex--;
                    updateGalaxyCarousel();
                }
            });

            arrowRightGalaxy.addEventListener('click', () => {
                if (currentGalaxyIndex < totalGalaxyCards - 1) {
                    currentGalaxyIndex++;
                    updateGalaxyCarousel();
                }
            });

            let galaxyIsDown = false;
            let galaxyStartX;
            let galaxyScrollLeftPx;
            let galaxyWalked = 0;
            let galaxyInnerForDrag = galaxyCarousel.querySelector('.galaxy-carousel-inner') || galaxyCarousel;

            galaxyWrapper.addEventListener('mousedown', (e) => {
                galaxyIsDown = true;
                galaxyWrapper.classList.add('active-drag');
                galaxyStartX = e.pageX;
                const currentPercentageOffset = currentGalaxyIndex * (100 / totalGalaxyCards);
                galaxyScrollLeftPx = -(currentPercentageOffset / 100 * galaxyWrapper.offsetWidth);
                galaxyWalked = 0;
                galaxyInnerForDrag.style.transition = 'none';
            });

            function handleGalaxyDragEnd() {
                if (!galaxyIsDown) return;
                galaxyIsDown = false;
                galaxyWrapper.classList.remove('active-drag');
                galaxyInnerForDrag.style.transition = 'transform 0.5s ease-in-out';
                
                const threshold = galaxyWrapper.offsetWidth / 4;

                if (galaxyWalked < -threshold) {
                    if (currentGalaxyIndex < totalGalaxyCards - 1) currentGalaxyIndex++;
                } else if (galaxyWalked > threshold) {
                    if (currentGalaxyIndex > 0) currentGalaxyIndex--;
                }
                updateGalaxyCarousel();
            }

            galaxyWrapper.addEventListener('mouseleave', handleGalaxyDragEnd);
            galaxyWrapper.addEventListener('mouseup', handleGalaxyDragEnd);

            galaxyWrapper.addEventListener('mousemove', (e) => {
                if (!galaxyIsDown) return;
                e.preventDefault();
                const currentX = e.pageX;
                galaxyWalked = currentX - galaxyStartX;
                let newTransformPx = galaxyScrollLeftPx + galaxyWalked;

                const overscrollLimit = galaxyWrapper.offsetWidth / 3;
                const minTransformPx = -( (totalGalaxyCards -1) * galaxyWrapper.offsetWidth / totalGalaxyCards + overscrollLimit);
                const maxTransformPx = overscrollLimit;
                newTransformPx = Math.max(minTransformPx, Math.min(maxTransformPx, newTransformPx));

                galaxyInnerForDrag.style.transform = 'translateX(' + newTransformPx + 'px)';
            });
            updateGalaxyCarousel();
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

    // --- FAQ Logic --- Комментируем этот блок, так как логика будет в faq.js
    /*
    const faqAccordionCategories = document.querySelectorAll('.faq-accordion-category');
    const faqQuestionItems = document.querySelectorAll('.faq-question-item, .faq-question-category');
    const faqAnswerTitleElement = document.getElementById('faqAnswerTitle');
    const faqAnswerBodyElement = document.getElementById('faqAnswerBody');

    if (faqAccordionCategories.length > 0 && faqQuestionItems.length > 0 && faqAnswerTitleElement && faqAnswerBodyElement) {
        let faqData = {};
        try {
            const faqDataElement = document.getElementById('faqDataContainer'); // Используем faqData вместо faqDataContainer
            if (faqDataElement && faqDataElement.textContent) {
                faqData = JSON.parse(faqDataElement.textContent);
            } else {
                // console.warn('FAQ data element (faqData) or its content not found. FAQ will not work.');
            }
        } catch (error) {
            // console.error('Error parsing FAQ data:', error);
        }

        faqAccordionCategories.forEach(category => {
            const header = category.querySelector('.faq-accordion-header');
            const content = category.querySelector('.faq-accordion-content');
            const icon = header ? header.querySelector('.faq-chevron-icon') : null;

            if (header) {
                header.addEventListener('click', () => {
                    const isOpen = category.classList.contains('open');

                    const parentContainer = category.parentElement;
                    if (parentContainer) {
                        const siblings = Array.from(parentContainer.children).filter(child => 
                            child.classList.contains('faq-accordion-category') && child !== category
                        );
                        siblings.forEach(sibling => {
                            sibling.classList.remove('open');
                            const siblingContent = sibling.querySelector('.faq-accordion-content');
                            if (siblingContent) siblingContent.style.display = 'none';
                            const siblingIcon = sibling.querySelector('.faq-chevron-icon');
                            if (siblingIcon) siblingIcon.style.transform = 'rotate(0deg)';
                        });
                    }
                    
                    if (isOpen) {
                        category.classList.remove('open');
                        if (content) content.style.display = 'none';
                        if (icon) icon.style.transform = 'rotate(0deg)';
                    } else {
                        category.classList.add('open');
                        if (content) content.style.display = 'flex';
                        if (icon) icon.style.transform = 'rotate(180deg)';
                    }
                });
            }
        });

        faqQuestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const questionId = this.dataset.questionId;

                faqQuestionItems.forEach(qItem => qItem.classList.remove('active'));
                this.classList.add('active');

                if (faqData[questionId] && faqAnswerTitleElement && faqAnswerBodyElement) {
                    faqAnswerTitleElement.textContent = faqData[questionId].title;
                    faqAnswerBodyElement.innerHTML = faqData[questionId].answer;
                } else {
                    if (!faqData[questionId]) {
                        // console.warn('No data found for question ID: ' + questionId);
                    }
                }
            });
        });

        const initiallyActiveItem = document.querySelector('.faq-question-category.active, .faq-question-item.active');
        if (initiallyActiveItem) {
            initiallyActiveItem.click();

            let parent = initiallyActiveItem.closest('.faq-accordion-category');
            while (parent) {
                if (!parent.classList.contains('open')) {
                    const header = parent.querySelector('.faq-accordion-header');
                    if (header) {
                        parent.classList.add('open');
                        const content = parent.querySelector('.faq-accordion-content');
                        if (content) content.style.display = 'flex';
                        const icon = header.querySelector('.faq-chevron-icon');
                        if (icon) icon.style.transform = 'rotate(180deg)';
                    }
                }
                parent = parent.parentElement.closest('.faq-accordion-category');
            }
        } else if (faqQuestionItems.length > 0) {
             faqQuestionItems[0].click();
        }

    } else {
        // console.warn('Необходимые элементы для FAQ не найдены.');
    }
    */

    // Закомментированные вызовы, так как функции initFeatured1Carousel, initFeatured6Carousel, initFeatured8Carousel были либо удалены, либо их логика интегрирована/пересмотрена.
    // initFeatured1Carousel(); 
    // initFeatured6Carousel();
    // initFeatured8Carousel();

    // --- Sticky Scrolling for Featured3 (featured4 scrolls normally) ---
    const featured3Sticky = document.querySelector('.featured3');
    const featured4Block = document.querySelector('.featured4');
    const headerSticky = document.querySelector('#main-header'); 
    let headerHeightSticky = 80; 

    if (headerSticky && headerSticky.offsetHeight > 0) {
        headerHeightSticky = headerSticky.offsetHeight;
        console.log('[StickyDebug] Header height for sticky:', headerHeightSticky);
    } else {
        console.warn('[StickyDebug] Header element #main-header not found or has no height. Using default:', headerHeightSticky);
    }

    if (featured3Sticky && featured4Block) {
        const featured3NaturalOffsetTop = featured3Sticky.offsetTop;
        let isFeatured3CurrentlySticky = false;

        console.log('[StickyDebug] Initial featured3NaturalOffsetTop:', featured3NaturalOffsetTop);

        // Устанавливаем начальное состояние НЕ sticky
        featured3Sticky.style.position = 'relative';
        featured3Sticky.style.top = 'auto';
        featured3Sticky.style.zIndex = '3'; // z-index для relative (ниже чем у sticky featured4, если бы тот был sticky)

        console.log('[StickyDebug] Attempting to add scroll event listener...');

        const handleScroll = (eventSource) => {
            console.log(`[StickyDebug] Scroll event FIRED on ${eventSource}!`);
            const scrollY = window.pageYOffset;
            const featured3Rect = featured3Sticky.getBoundingClientRect();
            const featured4Rect = featured4Block.getBoundingClientRect();

            const stickConditionPoint = featured3NaturalOffsetTop - headerHeightSticky;
            const shouldBecomeSticky = scrollY >= stickConditionPoint;
            // Условие для отлипания: нижняя граница блока featured4 находится выше верхней границы хедера
            const shouldUnstick = featured4Rect.bottom < headerHeightSticky;

            console.log(`[StickyDebug] ScrollY: ${scrollY.toFixed(0)}, F3_ViewportTop: ${featured3Rect.top.toFixed(0)}, F4_ViewportBottom: ${featured4Rect.bottom.toFixed(0)}, HeaderH: ${headerHeightSticky}`);
            console.log(`[StickyDebug] --- Conditions --- IsCurrentlySticky: ${isFeatured3CurrentlySticky ? 'YES' : 'NO'}`);
            console.log(`[StickyDebug] BecomeSticky?: (ScrollY ${scrollY.toFixed(0)} >= StickPoint ${stickConditionPoint.toFixed(0)}) -> ${shouldBecomeSticky}`);
            console.log(`[StickyDebug] Unstick?: (F4_VB ${featured4Rect.bottom.toFixed(0)} < HeaderH ${headerHeightSticky}) -> ${shouldUnstick}`);

            if (shouldUnstick) {
                if (isFeatured3CurrentlySticky) {
                    console.log('[StickyDebug] === Action: UNSTICKING featured3 (F4 bottom passed header) ===');
                    featured3Sticky.style.position = 'relative';
                    featured3Sticky.style.top = 'auto';
                    featured3Sticky.style.zIndex = '3'; 
                    isFeatured3CurrentlySticky = false;
                    console.log('[StickyDebug] Featured3 UNSTUCK (featured4 scrolled past)');
                }
            } else if (shouldBecomeSticky) {
                if (!isFeatured3CurrentlySticky) {
                    console.log('[StickyDebug] === Action: STICKING featured3 ===');
                    featured3Sticky.style.position = 'sticky';
                    featured3Sticky.style.top = `${headerHeightSticky}px`;
                    featured3Sticky.style.zIndex = '10'; // z-index для sticky (выше .featured4)
                    isFeatured3CurrentlySticky = true;
                    console.log('[StickyDebug] Featured3 STICKY');
                }
            } else { // Scrolled back up above the sticky point
                if (isFeatured3CurrentlySticky) {
                    console.log('[StickyDebug] === Action: RESETTING featured3 to relative (scrolled UP above sticky point) ===');
                    featured3Sticky.style.position = 'relative';
                    featured3Sticky.style.top = 'auto';
                    featured3Sticky.style.zIndex = '3';
                    isFeatured3CurrentlySticky = false;
                    console.log('[StickyDebug] Featured3 reset to NOT STICKY (scrolled above sticky point)');
                }
            }
        };

        window.addEventListener('scroll', () => handleScroll('window'));
        // document.addEventListener('scroll', () => handleScroll('document')); // Удаляем этот обработчик
        // document.body.addEventListener('scroll', () => handleScroll('document.body')); // Удаляем этот обработчик

        console.log('[StickyDebug] Scroll event listener ADDED to window.');
    } else {
        if (!featured3Sticky) console.warn ('[StickyDebug] .featured3 not found for sticky script.');
        if (!featured4Block) console.warn ('[StickyDebug] .featured4 not found for sticky script logic.');
    }
    
    /* Удаляем старый код для динамического z-index, если он еще остался
    const featured3 = document.querySelector('.featured3');
    const featured4 = document.querySelector('.featured4');
    const header = document.querySelector('.header'); 
    let headerHeight = 80; // Default if no header or header has no height

    if (header && header.offsetHeight > 0) {
        headerHeight = header.offsetHeight;
        // console.log('Header found. Height:', headerHeight);
    } else {
        // console.warn('Header element with class .header not found or has no height. Using default headerHeight:', headerHeight);
    }

    if (featured3 && featured4) {
        // console.log('Applying sticky styles to featured3 and featured4. Top offset:', headerHeight);
        featured3.style.position = 'sticky'; // Убедимся что sticky применяется
        featured3.style.top = `${headerHeight}px`;
        
        featured4.style.position = 'sticky'; // Убедимся что sticky применяется
        featured4.style.top = `${headerHeight}px`;

        // Начальные z-index
        featured3.style.zIndex = '20'; 
        featured4.style.zIndex = '19'; 
        // console.log('Initial z-index - featured3:', featured3.style.zIndex, 'featured4:', featured4.style.zIndex);

        let isFeatured4CurrentlyOnTop = false;

        window.addEventListener('scroll', function() {
            const featured3Rect = featured3.getBoundingClientRect();
            const featured4Rect = featured4.getBoundingClientRect();
            
            // Проверяем, "прилип" ли блок featured4 к заданной позиции top
            // Добавляем небольшой допуск (например, 2px) для точности сравнения
            const isFeatured4StickyNow = featured4Rect.top <= headerHeight + 2 && featured4Rect.top >= headerHeight -2;

            if (isFeatured4StickyNow) {
                // Если featured4 "прилип" и еще не наверху, делаем его выше featured3
                if (!isFeatured4CurrentlyOnTop) {
                    featured3.style.zIndex = '19';
                    featured4.style.zIndex = '20';
                    isFeatured4CurrentlyOnTop = true;
                    // console.log('Featured4 is sticky and now on top. z-index - featured3:', featured3.style.zIndex, 'featured4:', featured4.style.zIndex);
                }
            } else {
                // Если featured4 не "прилип" (он либо выше, либо ниже точки прилипания)
                // или если featured3 должен быть снова сверху (например, при скролле вверх)
                const featured3IsAboveFeatured4Bottom = featured3Rect.bottom > featured4Rect.bottom;
                const featured4IsBelowStickyPoint = featured4Rect.top > headerHeight + 2;

                if (isFeatured4CurrentlyOnTop && (featured4IsBelowStickyPoint || featured3IsAboveFeatured4Bottom )) {
                    // Если featured4 был наверху, но теперь он ниже точки прилипания ИЛИ
                    // если мы скроллим вверх так, что низ featured3 оказался ниже низа featured4 (редкий случай, но для полноты)
                    // возвращаем featured3 наверх
                    featured3.style.zIndex = '20';
                    featured4.style.zIndex = '19';
                    isFeatured4CurrentlyOnTop = false;
                    // console.log('Featured4 is NOT sticky or scrolled up, featured3 back on top. z-index - featured3:', featured3.style.zIndex, 'featured4:', featured4.style.zIndex);
                }
            }
        });
    } else {
        // console.warn('Elements .featured3 or .featured4 not found for sticky scrolling.');
    }
    */
});
