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
            let currentScroll = 0;
            const scrollAmount = cardWidth + gap;
            const maxScroll = (featureCards.length - visibleCards) * scrollAmount;

            function updateFeaturesArrows() {
                featuresArrowLeft.style.opacity = currentScroll <= 0 ? '0.5' : '1';
                featuresArrowLeft.style.pointerEvents = currentScroll <= 0 ? 'none' : 'auto';
                featuresArrowRight.style.opacity = currentScroll >= maxScroll ? '0.5' : '1';
                featuresArrowRight.style.pointerEvents = currentScroll >= maxScroll ? 'none' : 'auto';
            }

            featuresArrowLeft.addEventListener('click', () => {
                currentScroll -= scrollAmount;
                if (currentScroll < 0) currentScroll = 0;
                featuresCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                updateFeaturesArrows();
            });

            featuresArrowRight.addEventListener('click', () => {
                currentScroll += scrollAmount;
                if (currentScroll > maxScroll) currentScroll = maxScroll;
                featuresCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                updateFeaturesArrows();
            });

            updateFeaturesArrows();

            let isDownFeatures = false;
            let startXFeatures;
            let scrollLeftFeatures;

            featuresWrapper.addEventListener('mousedown', (e) => {
                isDownFeatures = true;
                featuresWrapper.classList.add('active-drag');
                startXFeatures = e.pageX - featuresWrapper.offsetLeft;
                scrollLeftFeatures = currentScroll;
                featuresCarousel.style.transition = 'none';
            });

            featuresWrapper.addEventListener('mouseleave', () => {
                if (!isDownFeatures) return;
                isDownFeatures = false;
                featuresWrapper.classList.remove('active-drag');
                featuresCarousel.style.transition = 'transform 0.3s ease-out';
                const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
                currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
                featuresCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                updateFeaturesArrows();
                setTimeout(() => {
                    featuresCarousel.style.transition = 'transform 0.5s ease-in-out';
                }, 300);
            });

            featuresWrapper.addEventListener('mouseup', () => {
                if (!isDownFeatures) return;
                isDownFeatures = false;
                featuresWrapper.classList.remove('active-drag');
                featuresCarousel.style.transition = 'transform 0.3s ease-out';
                const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
                currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
                featuresCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                updateFeaturesArrows();
                setTimeout(() => {
                    featuresCarousel.style.transition = 'transform 0.5s ease-in-out';
                }, 300);
            });

            featuresWrapper.addEventListener('mousemove', (e) => {
                if (!isDownFeatures) return;
                e.preventDefault();
                const x = e.pageX - featuresWrapper.offsetLeft;
                const walk = (x - startXFeatures) * 1.5;
                let newScrollVal = scrollLeftFeatures - walk;
                const overScrollDrag = scrollAmount / 3;
                currentScroll = Math.max(-overScrollDrag, Math.min(newScrollVal, maxScroll + overScrollDrag));
                featuresCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
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
                galaxyCarousel.style.transform = 'translateX(-' + (currentGalaxyIndex * 100) + '%)';
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

            galaxyWrapper.addEventListener('mousedown', (e) => {
                galaxyIsDown = true;
                galaxyWrapper.classList.add('active-drag');
                galaxyStartX = e.pageX;
                galaxyScrollLeftPx = -currentGalaxyIndex * galaxyWrapper.offsetWidth;
                galaxyWalked = 0;
                galaxyCarousel.style.transition = 'none';
            });

            function handleGalaxyDragEnd() {
                if (!galaxyIsDown) return;
                galaxyIsDown = false;
                galaxyWrapper.classList.remove('active-drag');
                galaxyCarousel.style.transition = 'transform 0.5s ease-in-out';
                
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
                const minTransformPx = -( (totalGalaxyCards -1) * galaxyWrapper.offsetWidth + overscrollLimit);
                const maxTransformPx = overscrollLimit;
                newTransformPx = Math.max(minTransformPx, Math.min(maxTransformPx, newTransformPx));

                galaxyCarousel.style.transform = 'translateX(' + newTransformPx + 'px)';
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
        const successCards = successCarousel.querySelectorAll('.success-story-card');
        if (successCards.length > 0) {
            const cardWidth = successCards[0].offsetWidth;
            const gap = parseInt(getComputedStyle(successCarousel).gap) || 20;
            const visibleCards = 3;
            let currentScroll = 0;
            const scrollAmount = cardWidth + gap;
            const maxScroll = Math.max(0, (successCards.length - visibleCards) * scrollAmount);


            function updateSuccessArrows() {
                successArrowLeft.classList.toggle('disabled', currentScroll <= 0);
                successArrowRight.classList.toggle('disabled', currentScroll >= maxScroll && maxScroll > 0);
                 if (maxScroll <= 0) {
                    successArrowLeft.classList.add('disabled');
                    successArrowRight.classList.add('disabled');
                }
            }

            successArrowLeft.addEventListener('click', () => {
                if (currentScroll > 0) {
                    currentScroll -= scrollAmount;
                    if (currentScroll < 0) currentScroll = 0;
                    successCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                    updateSuccessArrows();
                }
            });

            successArrowRight.addEventListener('click', () => {
                 if (currentScroll < maxScroll) {
                    currentScroll += scrollAmount;
                    if (currentScroll > maxScroll) currentScroll = maxScroll;
                    successCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                    updateSuccessArrows();
                }
            });
            
            updateSuccessArrows();

            let isDownSuccess = false;
            let startXSuccess;
            let scrollLeftSuccess;

            successWrapper.addEventListener('mousedown', (e) => {
                isDownSuccess = true;
                successWrapper.classList.add('active-drag');
                startXSuccess = e.pageX - successWrapper.offsetLeft;
                scrollLeftSuccess = currentScroll;
                successCarousel.style.transition = 'none';
            });

            function handleSuccessDragEnd() {
                if (!isDownSuccess) return;
                isDownSuccess = false;
                successWrapper.classList.remove('active-drag');
                successCarousel.style.transition = 'transform 0.3s ease-out';
                const newScroll = Math.round(currentScroll / scrollAmount) * scrollAmount;
                currentScroll = Math.max(0, Math.min(newScroll, maxScroll));
                successCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
                updateSuccessArrows();
                setTimeout(() => {
                    successCarousel.style.transition = 'transform 0.5s ease-in-out';
                }, 300);
            }

            successWrapper.addEventListener('mouseleave', handleSuccessDragEnd);
            successWrapper.addEventListener('mouseup', handleSuccessDragEnd);

            successWrapper.addEventListener('mousemove', (e) => {
                if (!isDownSuccess) return;
                e.preventDefault();
                const x = e.pageX - successWrapper.offsetLeft;
                const walk = (x - startXSuccess) * 1.5;
                let newTransform = scrollLeftSuccess - walk;
                const overscroll = scrollAmount / 3;
                currentScroll = Math.max(-overscroll, Math.min(newTransform, maxScroll + overscroll));
                successCarousel.style.transform = 'translateX(-' + currentScroll + 'px)';
            });
        } else {
            // console.warn('Карточки в карусели "Истории успеха" не найдены.');
        }
    } else {
        // console.warn('Элементы карусели "Истории успеха" не найдены.');
    }

    // --- FAQ Logic ---
    const faqAccordionCategories = document.querySelectorAll('.faq-accordion-category');
    const faqQuestionItems = document.querySelectorAll('.faq-question-item, .faq-question-category');
    const faqAnswerTitleElement = document.getElementById('faqAnswerTitle');
    const faqAnswerBodyElement = document.getElementById('faqAnswerBody');

    if (faqAccordionCategories.length > 0 && faqQuestionItems.length > 0 && faqAnswerTitleElement && faqAnswerBodyElement) {
        let faqData = {};
        try {
            const faqDataElement = document.getElementById('faqDataContainer');
            if (faqDataElement && faqDataElement.textContent) {
                faqData = JSON.parse(faqDataElement.textContent);
            } else {
                console.warn('FAQ data element (faqDataContainer) or its content not found. FAQ will not work.');
            }
        } catch (error) {
            console.error('Error parsing FAQ data:', error);
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
                    if (!faqData[questionId]) console.warn('No data found for question ID: ' + questionId);
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
});
