// JavaScript для управления чекбоксами выбора слайдера

class SliderCheckboxManager {
    constructor() {
        this.maxSelections = 4;
        this.checkboxes = document.querySelectorAll('.slider-checkbox');
        this.counter = null;
        this.init();
    }

    init() {
        if (this.checkboxes.length === 0) return;

        this.createCounter();
        this.bindEvents();
        this.updateCounter();
        this.updateCheckboxStates();
    }

    createCounter() {
        // Находим контейнер с чекбоксами
        const container = document.querySelector('.form-group.upload-box');
        if (!container) return;

        // Создаем счетчик
        this.counter = document.createElement('div');
        this.counter.className = 'slider-counter';
        this.counter.textContent = '0/4';
        
        // Добавляем счетчик после подсказки
        const hint = container.querySelector('.small-text[style*="color: var(--accent-yellow)"]');
        if (hint) {
            hint.appendChild(this.counter);
        }
    }

    bindEvents() {
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleCheckboxChange(e);
            });
        });
    }

    handleCheckboxChange(event) {
        const checkbox = event.target;
        const selectedCount = this.getSelectedCount();

        if (checkbox.checked && selectedCount > this.maxSelections) {
            // Если превышен лимит, отменяем выбор
            checkbox.checked = false;
            this.showLimitMessage();
            return;
        }

        this.updateCounter();
        this.updateCheckboxStates();
        this.updatePreviewItems();
    }

    getSelectedCount() {
        return Array.from(this.checkboxes).filter(cb => cb.checked).length;
    }

    updateCounter() {
        if (!this.counter) return;

        const selectedCount = this.getSelectedCount();
        this.counter.textContent = `${selectedCount}/${this.maxSelections}`;
        
        if (selectedCount >= this.maxSelections) {
            this.counter.classList.add('max-reached');
        } else {
            this.counter.classList.remove('max-reached');
        }
    }

    updateCheckboxStates() {
        const selectedCount = this.getSelectedCount();
        const isMaxReached = selectedCount >= this.maxSelections;

        this.checkboxes.forEach(checkbox => {
            if (!checkbox.checked && isMaxReached) {
                checkbox.disabled = true;
            } else {
                checkbox.disabled = false;
            }
        });
    }

    updatePreviewItems() {
        // Обновляем визуальное состояние превью изображений
        this.checkboxes.forEach(checkbox => {
            const container = checkbox.closest('.file-preview-item');
            if (container) {
                if (checkbox.checked) {
                    container.classList.add('selected-for-slider');
                } else {
                    container.classList.remove('selected-for-slider');
                }
            }
        });
    }

    showLimitMessage() {
        // Показываем сообщение о достижении лимита
        const message = document.createElement('div');
        message.className = 'slider-limit-message';
        message.textContent = `Можно выбрать максимум ${this.maxSelections} изображений для слайдера`;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-red);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(message);

        // Удаляем сообщение через 3 секунды
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    // Метод для получения выбранных изображений
    getSelectedImages() {
        return Array.from(this.checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    // Метод для валидации перед отправкой формы
    validate() {
        const selectedCount = this.getSelectedCount();
        if (selectedCount > this.maxSelections) {
            this.showLimitMessage();
            return false;
        }
        return true;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем только на страницах с формами
    if (document.querySelector('.slider-checkbox')) {
        window.sliderCheckboxManager = new SliderCheckboxManager();
    }
});

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .file-preview-item.selected-for-slider {
        border: 2px solid var(--accent-yellow) !important;
        background: rgba(255, 193, 7, 0.05) !important;
    }
    
    .file-preview-item.selected-for-slider::before {
        content: "✓";
        position: absolute;
        top: 8px;
        right: 8px;
        background: var(--accent-yellow);
        color: var(--bg-primary);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        z-index: 10;
    }
`;
document.head.appendChild(style);

// Интеграция с отправкой формы
document.addEventListener('submit', function(e) {
    if (window.sliderCheckboxManager && !window.sliderCheckboxManager.validate()) {
        e.preventDefault();
        return false;
    }
});
