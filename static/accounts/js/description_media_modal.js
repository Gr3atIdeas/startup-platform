/**
 * Модальное окно для управления медиа-контентом в описании
 */

class DescriptionMediaModal {
    constructor(options = {}) {
        this.entityType = options.entityType || 'startup';
        this.entityId = options.entityId || null;
        this.isCreateMode = !this.entityId;
        this.maxFiles = 20;
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.maxVideoSize = 50 * 1024 * 1024; // 50MB
        this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        
        this.modal = null;
        this.files = [];
        this.tempFiles = []; // Для режима создания
        
        this.init();
    }
    
    init() {
        this.createModal();
        this.bindEvents();
        if (!this.isCreateMode) {
            this.loadExistingFiles();
        }
    }
    
    createModal() {
        const modalHTML = `
            <div id="descriptionMediaModal" class="modal-overlay" style="display: none;">
                <div class="modal-dialog media-modal-dialog">
                    <div class="modal-header">
                        <div class="modal-title">Управление медиа-контентом</div>
                        <button type="button" class="modal-close-btn" id="mediaModalCloseBtn">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="media-upload-section">
                            <div class="upload-area" id="mediaUploadArea">
                                <div class="upload-placeholder">
                                    <img src="/static/accounts/images/icons/image_placeholder.svg" alt="Upload" class="upload-icon">
                                    <p>Перетащите файлы сюда или нажмите для выбора</p>
                                    <p class="upload-hint">Изображения: JPG, PNG, GIF, WEBP (до 5MB)<br>Видео: MP4, MOV, AVI (до 50MB)</p>
                                </div>
                                <input type="file" id="mediaFileInput" multiple accept="image/*,video/*" style="display: none;">
                            </div>
                            <div class="upload-progress" id="uploadProgress" style="display: none;">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progressFill"></div>
                                </div>
                                <div class="progress-text" id="progressText">0%</div>
                            </div>
                        </div>
                        <div class="media-gallery" id="mediaGallery">
                            <div class="gallery-header">
                                <h3>Загруженные файлы</h3>
                                <div class="gallery-actions">
                                    <button type="button" class="btn-clear-all" id="clearAllBtn" style="display: none;">Очистить все</button>
                                </div>
                            </div>
                            <div class="gallery-grid" id="galleryGrid">
                                <div class="gallery-empty" id="galleryEmpty">
                                    <p>Нет загруженных файлов</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="mediaModalCancelBtn">Отмена</button>
                        <button type="button" class="btn-primary" id="mediaModalSaveBtn" disabled>Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('descriptionMediaModal');
    }
    
    bindEvents() {
        // Закрытие модального окна
        document.getElementById('mediaModalCloseBtn').addEventListener('click', () => this.close());
        document.getElementById('mediaModalCancelBtn').addEventListener('click', () => this.close());
        
        // Клик по фону для закрытия
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Загрузка файлов
        const uploadArea = document.getElementById('mediaUploadArea');
        const fileInput = document.getElementById('mediaFileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        
        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });
        
        // Кнопки действий
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllFiles());
        document.getElementById('mediaModalSaveBtn').addEventListener('click', () => this.saveFiles());
    }
    
    handleFileSelect(files) {
        const fileArray = Array.from(files);
        
        // Валидация файлов
        for (const file of fileArray) {
            if (!this.validateFile(file)) {
                return;
            }
        }
        
        // Проверка лимита файлов
        const totalFiles = this.files.length + fileArray.length;
        if (totalFiles > this.maxFiles) {
            this.showNotification(`Максимум ${this.maxFiles} файлов. У вас уже ${this.files.length} файлов.`, 'error');
            return;
        }
        
        // Добавляем файлы
        this.files.push(...fileArray);
        this.updateGallery();
        this.updateSaveButton();
    }
    
    validateFile(file) {
        const isImage = this.allowedImageTypes.includes(file.type);
        const isVideo = this.allowedVideoTypes.includes(file.type);
        
        if (!isImage && !isVideo) {
            this.showNotification(`Файл ${file.name} имеет неподдерживаемый тип`, 'error');
            return false;
        }
        
        const maxSize = isImage ? this.maxImageSize : this.maxVideoSize;
        if (file.size > maxSize) {
            const sizeMB = Math.round(maxSize / (1024 * 1024));
            this.showNotification(`Файл ${file.name} слишком большой. Максимум: ${sizeMB}MB`, 'error');
            return false;
        }
        
        return true;
    }
    
    updateGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        const galleryEmpty = document.getElementById('galleryEmpty');
        const clearAllBtn = document.getElementById('clearAllBtn');
        
        if (this.files.length === 0) {
            galleryEmpty.style.display = 'block';
            clearAllBtn.style.display = 'none';
            return;
        }
        
        galleryEmpty.style.display = 'none';
        clearAllBtn.style.display = 'block';
        
        // Очищаем галерею
        galleryGrid.innerHTML = '';
        
        // Добавляем файлы
        this.files.forEach((file, index) => {
            const fileItem = this.createFileItem(file, index);
            galleryGrid.appendChild(fileItem);
        });
    }
    
    createFileItem(file, index) {
        const isImage = file.type.startsWith('image/');
        const fileItem = document.createElement('div');
        fileItem.className = 'gallery-item';
        fileItem.dataset.index = index;
        
        const preview = isImage ? 
            `<img src="${URL.createObjectURL(file)}" alt="${file.name}" class="file-preview">` :
            `<div class="video-preview">
                <div class="video-icon">▶</div>
                <div class="video-name">${file.name}</div>
             </div>`;
        
        fileItem.innerHTML = `
            <div class="file-preview-container">
                ${preview}
                <div class="file-overlay">
                    <button type="button" class="btn-copy-url" data-index="${index}">Копировать URL</button>
                    <button type="button" class="btn-remove-file" data-index="${index}">×</button>
                </div>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-type">${isImage ? 'Изображение' : 'Видео'}</div>
            </div>
        `;
        
        // Обработчики событий
        fileItem.querySelector('.btn-copy-url').addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyFileUrl(index);
        });
        
        fileItem.querySelector('.btn-remove-file').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(index);
        });
        
        return fileItem;
    }
    
    copyFileUrl(index) {
        const file = this.files[index];
        if (!file) return;
        
        // Для режима создания генерируем временный URL
        if (this.isCreateMode) {
            const tempUrl = URL.createObjectURL(file);
            this.copyToClipboard(tempUrl);
            this.showNotification('URL скопирован в буфер обмена', 'success');
            return;
        }
        
        // Для режима редактирования загружаем файл и получаем URL
        this.uploadFile(file).then(result => {
            if (result.success) {
                const fileData = result.files[0];
                const tag = fileData.file_type === 'image' ? 
                    `<img src="${fileData.file_url}" alt="${fileData.file_name}">` :
                    `<video src="${fileData.file_url}" controls></video>`;
                
                this.copyToClipboard(tag);
                this.showNotification('HTML тег скопирован в буфер обмена', 'success');
            } else {
                this.showNotification('Ошибка загрузки файла: ' + result.error, 'error');
            }
        });
    }
    
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('files', file);
        
        try {
            const response = await fetch(`/upload-description-media/${this.entityType}/${this.entityId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Ошибка сети' };
        }
    }
    
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this.updateGallery();
        this.updateSaveButton();
    }
    
    clearAllFiles() {
        this.files = [];
        this.updateGallery();
        this.updateSaveButton();
    }
    
    updateSaveButton() {
        const saveBtn = document.getElementById('mediaModalSaveBtn');
        saveBtn.disabled = this.files.length === 0;
    }
    
    async loadExistingFiles() {
        try {
            const response = await fetch(`/get-description-media/${this.entityType}/${this.entityId}/`);
            const result = await response.json();
            
            if (result.success) {
                // Конвертируем существующие файлы в формат для отображения
                this.files = result.files.map(fileData => ({
                    name: fileData.name,
                    type: fileData.type === 'image' ? 'image/jpeg' : 'video/mp4',
                    url: fileData.url,
                    isExisting: true
                }));
                
                this.updateGallery();
                this.updateSaveButton();
            }
        } catch (error) {
            console.error('Error loading existing files:', error);
        }
    }
    
    saveFiles() {
        if (this.isCreateMode) {
            // В режиме создания сохраняем файлы в сессию
            this.saveToSession();
        } else {
            // В режиме редактирования файлы уже загружены
            this.close();
        }
    }
    
    saveToSession() {
        // Сохраняем информацию о файлах в сессию для последующей обработки
        const filesData = this.files.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        }));
        
        // Используем localStorage как временное хранилище
        localStorage.setItem(`temp_media_${this.entityType}`, JSON.stringify(filesData));
        
        // Добавляем скрытое поле в форму для отправки данных
        this.addTempMediaToForm(filesData);
        
        this.showNotification('Файлы сохранены для загрузки', 'success');
        this.close();
    }
    
    addTempMediaToForm(filesData) {
        // Находим форму по типу сущности
        let form;
        if (this.entityType === 'startup') {
            form = document.getElementById('startupForm');
        } else if (this.entityType === 'franchise') {
            form = document.getElementById('franchiseForm');
        } else if (this.entityType === 'agency') {
            form = document.getElementById('agencyForm');
        } else if (this.entityType === 'specialist') {
            form = document.getElementById('specialistForm');
        }
        
        if (form) {
            // Удаляем существующее поле, если есть
            const existingField = form.querySelector('input[name="temp_media_data"]');
            if (existingField) {
                existingField.remove();
            }
            
            // Создаем новое скрытое поле
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = 'temp_media_data';
            hiddenField.value = JSON.stringify(filesData);
            form.appendChild(hiddenField);
        }
    }
    
    show() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    getCSRFToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }
    
    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений или создаем простую
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type, 3000);
        } else {
            alert(message);
        }
    }
}

// Глобальная функция для открытия модального окна
window.openDescriptionMediaModal = function(entityType, entityId = null) {
    const modal = new DescriptionMediaModal({
        entityType: entityType,
        entityId: entityId
    });
    modal.show();
    return modal;
};
