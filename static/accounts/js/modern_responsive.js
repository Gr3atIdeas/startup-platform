
document.addEventListener('DOMContentLoaded', function() {
    initContainerQueriesFallback();
    initModernComponents();
    initResponsiveUtils();
    initModernCSSSupport();
    initResponsiveImages();
    initSmoothAnimations();
});

function initContainerQueriesFallback() {
    if (!CSS.supports('container-type', 'inline-size')) {
        const containers = document.querySelectorAll('[class*="container"], .feature-card, .responsive-card');

        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const container = entry.target;
                const width = entry.contentRect.width;

                if (width <= 300) {
                    container.classList.add('container-small');
                } else if (width <= 400) {
                    container.classList.add('container-medium');
                } else {
                    container.classList.add('container-large');
                }
            });
        });

        containers.forEach(container => resizeObserver.observe(container));
    }
}

function initModernComponents() {
    initAccordions();
    initTabs();
    initModals();
    initMobileMenus();
    initToggles();
    initSliders();
    initTooltips();
    initNotifications();
}

function initAccordions() {
    const accordions = document.querySelectorAll('.accordion, [data-accordion]');

    accordions.forEach(accordion => {
        const headers = accordion.querySelectorAll('.accordion-header, [data-accordion-header]');

        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const isActive = header.classList.contains('active');

                headers.forEach(h => h.classList.remove('active'));
                accordion.querySelectorAll('.accordion-content, [data-accordion-content]').forEach(c => c.style.display = 'none');

                if (!isActive) {
                    header.classList.add('active');
                    content.style.display = 'block';
                }
            });
        });
    });
}

function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs, [data-tabs]');

    tabContainers.forEach(container => {
        const tabs = container.querySelectorAll('.tab, [data-tab]');
        const contents = container.querySelectorAll('.tab-content, [data-tab-content]');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab') || tab.textContent.toLowerCase();

                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const content = container.querySelector(`[data-tab-content="${target}"]`);
                if (content) content.classList.add('active');
            });
        });
    });
}

function initModals() {
    const modals = document.querySelectorAll('.modal, [data-modal]');

    modals.forEach(modal => {
        const triggers = document.querySelectorAll(`[data-modal-trigger="${modal.id}"]`);
        const closeButtons = modal.querySelectorAll('.modal-close, [data-modal-close]');

        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

function initMobileMenus() {
    const menuToggles = document.querySelectorAll('.mobile-menu-toggle, [data-mobile-menu]');

    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const menu = document.querySelector('.mobile-menu, [data-mobile-menu-content]');
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    });
}

function initToggles() {
    const toggles = document.querySelectorAll('.toggle, [data-toggle]');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const target = toggle.getAttribute('data-toggle-target');
            if (target) {
                const targetElement = document.querySelector(target);
                if (targetElement) targetElement.classList.toggle('active');
            }
        });
    });
}

function initSliders() {
    const sliders = document.querySelectorAll('.slider, [data-slider]');

    sliders.forEach(slider => {
        const input = slider.querySelector('input[type="range"]');
        const output = slider.querySelector('.slider-value');

        if (input && output) {
            input.addEventListener('input', () => {
                output.textContent = input.value;
                output.style.left = `${(input.value - input.min) / (input.max - input.min) * 100}%`;
            });
        }
    });
}

function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');

    tooltips.forEach(element => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = element.getAttribute('data-tooltip');
        document.body.appendChild(tooltip);

        element.addEventListener('mouseenter', () => {
            tooltip.classList.add('active');
        });

        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('active');
        });

        element.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY - 30 + 'px';
        });
    });
}

function initNotifications() {
    window.showNotification = function(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('active');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    };
}

function initResponsiveUtils() {
    window.getScreenSize = function() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: window.innerWidth / window.innerHeight
        };
    };

    window.supportsModernCSS = function() {
        return CSS.supports('container-type', 'inline-size') &&
               CSS.supports('clamp', '1px 2vw 3px') &&
               CSS.supports('aspect-ratio', '16/9');
    };

    window.loadResponsiveImage = function(img, srcset) {
        const sizes = getScreenSize();
        const ratio = sizes.ratio;

        if (ratio < 0.75) {
            img.src = srcset.mobile || srcset.default;
        } else if (ratio < 1.33) {
            img.src = srcset.tablet || srcset.default;
        } else {
            img.src = srcset.desktop || srcset.default;
        }
    };

    window.initLazyLoading = function() {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    };
}

function initModernCSSSupport() {
    if (!CSS.supports('clamp', '1px 2vw 3px')) {
        const elements = document.querySelectorAll('[style*="clamp"]');

        elements.forEach(element => {
            const style = element.style.cssText;
            const clampMatches = style.match(/clamp\([^)]+\)/g);

            if (clampMatches) {
                clampMatches.forEach(match => {
                    const values = match.match(/clamp\(([^,]+),([^,]+),([^)]+)\)/);
                    if (values) {
                        const min = values[1].trim();
                        const preferred = values[2].trim();
                        const max = values[3].trim();

                        const computedValue = calculateClamp(min, preferred, max);
                        element.style.cssText = element.style.cssText.replace(match, computedValue);
                    }
                });
            }
        });
    }

    if (!CSS.supports('aspect-ratio', '16/9')) {
        const elements = document.querySelectorAll('[style*="aspect-ratio"]');

        elements.forEach(element => {
            const style = element.style.cssText;
            const aspectMatch = style.match(/aspect-ratio:\s*([^;]+)/);

            if (aspectMatch) {
                const ratio = aspectMatch[1].trim();
                const [width, height] = ratio.split('/').map(Number);

                if (width && height) {
                    const paddingTop = (height / width) * 100;
                    element.style.paddingTop = `${paddingTop}%`;
                    element.style.position = 'relative';

                    const children = element.children;
                    for (let child of children) {
                        child.style.position = 'absolute';
                        child.style.top = '0';
                        child.style.left = '0';
                        child.style.width = '100%';
                        child.style.height = '100%';
                    }
                }
            }
        });
    }
}

function calculateClamp(min, preferred, max) {
    const minValue = parseFloat(min);
    const maxValue = parseFloat(max);
    const preferredValue = preferred.trim();

    if (preferredValue.includes('vw')) {
        const vwValue = parseFloat(preferredValue);
        const screenWidth = window.innerWidth;
        const computedValue = (vwValue / 100) * screenWidth;
        return Math.max(minValue, Math.min(maxValue, computedValue)) + 'px';
    }

    return preferredValue;
}

function initResponsiveImages() {
    const images = document.querySelectorAll('img[data-responsive]');

    images.forEach(img => {
        const srcset = JSON.parse(img.getAttribute('data-responsive'));
        loadResponsiveImage(img, srcset);

        window.addEventListener('resize', () => {
            loadResponsiveImage(img, srcset);
        });
    });
}

function initSmoothAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll, [data-animate]');

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => {
        animationObserver.observe(element);
    });
}

window.ModernCSS = {
    clamp: function(min, preferred, max) {
        return `clamp(${min}, ${preferred}, ${max})`;
    },

    aspectRatio: function(width, height) {
        return `${width}/${height}`;
    },

    containerQuery: function(selector, maxWidth, styles) {
        return `@container (max-width: ${maxWidth}) { ${selector} { ${styles} } }`;
    },

    responsiveValue: function(min, max, unit = 'px') {
        const viewportWidth = window.innerWidth;
        const value = min + (max - min) * (viewportWidth / 1920);
        return `${value}${unit}`;
    },

    fluidTypography: function(minSize, maxSize, minWidth = 320, maxWidth = 1920) {
        const slope = (maxSize - minSize) / (maxWidth - minWidth);
        const yAxisIntersection = -minWidth * slope + minSize;
        return `clamp(${minSize}px, ${yAxisIntersection}px + ${slope * 100}vw, ${maxSize}px)`;
    },

    responsiveSpacing: function(min, max, unit = 'px') {
        return this.clamp(`${min}${unit}`, `${(min + max) / 2}${unit}`, `${max}${unit}`);
    }
};